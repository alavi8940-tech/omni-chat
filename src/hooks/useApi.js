function cleanApiUrl(url = '') {
  return url.trim().replace(/\/+$/, '')
}

function headers(apiKey, extra = {}) {
  return {
    Authorization: `Bearer ${apiKey.trim()}`,
    ...extra,
  }
}

async function readError(response) {
  try {
    const data = await response.json()
    return data?.error?.message || data?.message || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

async function ensureOk(response) {
  if (!response.ok) throw new Error(await readError(response))
  return response
}

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function firstMedia(data, kind) {
  const item = data?.data?.[0] || data?.[0] || data
  const url = item?.url || item?.[`${kind}_url`] || data?.url || data?.[`${kind}_url`]
  const base64 = item?.b64_json || item?.base64 || data?.b64_json || data?.base64
  if (url) return url
  if (base64) {
    const mime = kind === 'image' ? 'image/png' : kind === 'video' ? 'video/mp4' : 'audio/mpeg'
    return `data:${mime};base64,${base64}`
  }
  return ''
}

export function useApi() {
  const fetchModels = async (apiUrl, apiKey) => {
    const response = await fetch(`${cleanApiUrl(apiUrl)}/v1/models`, {
      headers: headers(apiKey),
    })
    await ensureOk(response)
    const payload = await response.json()
    return (payload.data || payload.models || []).map((model) =>
      typeof model === 'string' ? { id: model } : model,
    )
  }

  const testConnection = async (apiUrl, apiKey) => {
    if (!cleanApiUrl(apiUrl)) throw new Error('Enter an API URL.')
    if (!apiKey.trim()) throw new Error('Enter an API key.')
    const found = await fetchModels(apiUrl, apiKey)
    return found.length
  }

  const streamChat = async ({ apiUrl, apiKey, model, messages, onToken }) => {
    const response = await fetch(`${cleanApiUrl(apiUrl)}/v1/chat/completions`, {
      method: 'POST',
      headers: headers(apiKey, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ model, messages, stream: true }),
    })
    await ensureOk(response)

    if ((response.headers.get('content-type') || '').includes('application/json')) {
      const data = await response.json()
      const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || ''
      onToken(content)
      return
    }

    if (!response.body) {
      const data = await response.json()
      const content = data?.choices?.[0]?.message?.content || ''
      onToken(content)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const chunk = trimmed.slice(5).trim()
        if (!chunk || chunk === '[DONE]') continue
        try {
          const data = JSON.parse(chunk)
          const token =
            data?.choices?.[0]?.delta?.content ??
            data?.choices?.[0]?.message?.content ??
            ''
          if (token) onToken(token)
        } catch {
          // Ignore keep-alive or non-JSON SSE messages.
        }
      }
      if (done) break
    }

    const finalLine = buffer.trim()
    if (finalLine.startsWith('data:')) {
      const chunk = finalLine.slice(5).trim()
      if (chunk && chunk !== '[DONE]') {
        try {
          const data = JSON.parse(chunk)
          const token = data?.choices?.[0]?.delta?.content || ''
          if (token) onToken(token)
        } catch {
          // Ignore a malformed final SSE fragment.
        }
      }
    }
  }

  const generateImage = async ({ apiUrl, apiKey, model, prompt }) => {
    const response = await fetch(`${cleanApiUrl(apiUrl)}/v1/images/generations`, {
      method: 'POST',
      headers: headers(apiKey, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ model, prompt, n: 1, size: '1024x1024' }),
    })
    await ensureOk(response)
    const url = firstMedia(await response.json(), 'image')
    if (!url) throw new Error('The API returned no image.')
    return url
  }

  const generateAudio = async ({ apiUrl, apiKey, model, prompt }) => {
    const response = await fetch(`${cleanApiUrl(apiUrl)}/v1/audio/speech`, {
      method: 'POST',
      headers: headers(apiKey, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ model, input: prompt, voice: 'alloy' }),
    })
    await ensureOk(response)
    const type = response.headers.get('content-type') || ''
    if (type.includes('application/json')) {
      const url = firstMedia(await response.json(), 'audio')
      if (!url) throw new Error('The API returned no audio.')
      return url
    }
    return toDataUrl(await response.blob())
  }

  const generateVideo = async ({ apiUrl, apiKey, model, prompt }) => {
    const response = await fetch(`${cleanApiUrl(apiUrl)}/v1/video/generations`, {
      method: 'POST',
      headers: headers(apiKey, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ model, prompt }),
    })
    await ensureOk(response)
    const type = response.headers.get('content-type') || ''
    if (type.includes('application/json')) {
      const url = firstMedia(await response.json(), 'video')
      if (!url) throw new Error('The API returned no video.')
      return url
    }
    return toDataUrl(await response.blob())
  }

  return { fetchModels, testConnection, streamChat, generateImage, generateAudio, generateVideo }
}
