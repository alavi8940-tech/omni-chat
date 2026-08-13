export function cleanApiUrl(url = '') {
  return String(url ?? '').trim().replace(/\/+$/, '').replace(/\/v1$/i, '')
}

function requestHeaders(apiKey, extra = {}) {
  const normalizedKey = String(apiKey ?? '').trim()
  return {
    Accept: 'application/json',
    ...(normalizedKey ? { Authorization: `Bearer ${normalizedKey}` } : {}),
    ...extra,
  }
}

function friendlyNetworkError(error) {
  if (error?.name === 'AbortError') return new Error('Request cancelled.')
  if (error instanceof TypeError) {
    return new Error(
      'Could not reach the API. Check the URL, internet connection, HTTPS certificate, and CORS settings.',
    )
  }
  return error instanceof Error ? error : new Error('Unexpected API error.')
}

async function readError(response) {
  try {
    const data = await response.json()
    return (
      data?.error?.message ||
      data?.error?.detail ||
      data?.detail ||
      data?.message ||
      `Request failed with HTTP ${response.status}.`
    )
  } catch {
    return `Request failed with HTTP ${response.status}.`
  }
}

async function ensureOk(response) {
  if (!response.ok) throw new Error(await readError(response))
  return response
}

async function apiFetch(url, options = {}, timeoutMs = 120000) {
  const timeoutController = new AbortController()
  const timer = window.setTimeout(() => timeoutController.abort(), timeoutMs)
  const sourceSignal = options.signal
  const abortFromSource = () => timeoutController.abort()
  sourceSignal?.addEventListener('abort', abortFromSource, { once: true })

  try {
    return await fetch(url, { ...options, signal: timeoutController.signal })
  } catch (error) {
    if (timeoutController.signal.aborted && !sourceSignal?.aborted) {
      throw new Error('The API request timed out. Try again or check the provider status.')
    }
    throw friendlyNetworkError(error)
  } finally {
    window.clearTimeout(timer)
    sourceSignal?.removeEventListener('abort', abortFromSource)
  }
}

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the generated media.'))
    reader.readAsDataURL(blob)
  })
}

export function isSafeMediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    const url = new URL(value, window.location.origin)
    return ['http:', 'https:', 'data:', 'blob:'].includes(url.protocol)
  } catch {
    return false
  }
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    let timer
    const stop = () => {
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', stop)
      reject(new DOMException('Request cancelled.', 'AbortError'))
    }
    const finish = () => {
      signal?.removeEventListener('abort', stop)
      resolve()
    }
    if (signal?.aborted) {
      stop()
      return
    }
    timer = window.setTimeout(finish, ms)
    signal?.addEventListener('abort', stop, { once: true })
  })
}

function firstMedia(data, kind) {
  const item = data?.data?.[0] || data?.output?.[0] || data?.[0] || data
  const url =
    item?.url ||
    item?.[`${kind}_url`] ||
    item?.output_url ||
    data?.url ||
    data?.[`${kind}_url`] ||
    data?.output_url
  const base64 =
    item?.b64_json ||
    item?.base64 ||
    item?.b64 ||
    data?.b64_json ||
    data?.base64 ||
    data?.b64
  if (url) return isSafeMediaUrl(url) ? url : ''
  if (base64) {
    const mime = kind === 'image' ? 'image/png' : kind === 'video' ? 'video/mp4' : 'audio/mpeg'
    return `data:${mime};base64,${base64}`
  }
  return ''
}

function extractText(data) {
  const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? data?.output_text
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part?.text || part?.content || ''))
      .join('')
  }
  return ''
}

function extractStreamToken(data) {
  const content =
    data?.choices?.[0]?.delta?.content ??
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    data?.delta ??
    ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map((part) => part?.text || part?.content || '').join('')
  }
  return ''
}

export function useApi() {
  const fetchModels = async (apiUrl, apiKey, signal) => {
    const baseUrl = cleanApiUrl(apiUrl)
    if (!baseUrl) throw new Error('Enter an API URL.')
    const response = await apiFetch(
      `${baseUrl}/v1/models`,
      { headers: requestHeaders(apiKey), signal },
      30000,
    )
    await ensureOk(response)
    const payload = await response.json()
    const rawModels = payload.data || payload.models || []
    if (!Array.isArray(rawModels)) throw new Error('The API returned an invalid model list.')
    return rawModels
      .map((model) => (typeof model === 'string' ? { id: model } : model))
      .filter((model) => typeof model?.id === 'string' && model.id.trim())
      .sort((a, b) => a.id.localeCompare(b.id))
  }

  const testConnection = async (apiUrl, apiKey, signal) => {
    if (!cleanApiUrl(apiUrl)) throw new Error('Enter an API URL.')
    const found = await fetchModels(apiUrl, apiKey, signal)
    return found.length
  }

  const streamChat = async ({
    apiUrl,
    apiKey,
    model,
    messages,
    temperature,
    signal,
    onToken,
  }) => {
    const temp = Number(temperature)
    const body = {
      model,
      messages,
      stream: true,
    }
    if (Number.isFinite(temp) && temp >= 0 && temp <= 2) {
      body.temperature = temp
    }
    const response = await apiFetch(
      `${cleanApiUrl(apiUrl)}/v1/chat/completions`,
      {
        method: 'POST',
        headers: requestHeaders(apiKey, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
        signal,
      },
      300000,
    )
    await ensureOk(response)

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const content = extractText(await response.json())
      if (!content) throw new Error('The API returned an empty response.')
      onToken(content)
      return
    }

    if (!response.body) throw new Error('Streaming is not supported by this browser or provider.')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let receivedText = false

    const processLine = (line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith(':')) return
      const chunk = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed
      if (!chunk || chunk === '[DONE]') return
      try {
        const token = extractStreamToken(JSON.parse(chunk))
        if (token) {
          receivedText = true
          onToken(token)
        }
      } catch {
        // Some providers send heartbeat or metadata lines that are not JSON.
      }
    }

    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''
      lines.forEach(processLine)
      if (done) break
    }
    if (buffer.trim()) processLine(buffer)
    if (!receivedText) throw new Error('The API completed without returning text.')
  }

  const generateImage = async ({ apiUrl, apiKey, model, prompt, imageSize, signal }) => {
    const response = await apiFetch(
      `${cleanApiUrl(apiUrl)}/v1/images/generations`,
      {
        method: 'POST',
        headers: requestHeaders(apiKey, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ model, prompt, n: 1, size: imageSize || '1024x1024' }),
        signal,
      },
      300000,
    )
    await ensureOk(response)
    const url = firstMedia(await response.json(), 'image')
    if (!url) throw new Error('The API returned no image.')
    return url
  }

  const generateAudio = async ({ apiUrl, apiKey, model, prompt, voice, signal }) => {
    const response = await apiFetch(
      `${cleanApiUrl(apiUrl)}/v1/audio/speech`,
      {
        method: 'POST',
        headers: requestHeaders(apiKey, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ model, input: prompt, voice: voice || 'alloy' }),
        signal,
      },
      180000,
    )
    await ensureOk(response)
    const type = response.headers.get('content-type') || ''
    if (type.includes('application/json')) {
      const url = firstMedia(await response.json(), 'audio')
      if (!url) throw new Error('The API returned no audio.')
      return url
    }
    return toDataUrl(await response.blob())
  }

  const generateVideo = async ({ apiUrl, apiKey, model, prompt, signal }) => {
    const endpoint = `${cleanApiUrl(apiUrl)}/v1/video/generations`
    const response = await apiFetch(
      endpoint,
      {
        method: 'POST',
        headers: requestHeaders(apiKey, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ model, prompt }),
        signal,
      },
      600000,
    )
    await ensureOk(response)
    const type = response.headers.get('content-type') || ''
    if (type.includes('application/json')) {
      let payload = await response.json()
      let url = firstMedia(payload, 'video')
      if (url) return url

      const jobId = payload?.id || payload?.data?.id || payload?.job_id
      if (!jobId) throw new Error('The API returned no video or job ID.')

      for (let attempt = 0; attempt < 60; attempt += 1) {
        await wait(5000, signal)
        const pollResponse = await apiFetch(
          `${endpoint}/${encodeURIComponent(jobId)}`,
          { headers: requestHeaders(apiKey), signal },
          60000,
        )
        await ensureOk(pollResponse)
        payload = await pollResponse.json()
        url = firstMedia(payload, 'video')
        if (url) return url
        const status = String(payload?.status || payload?.data?.status || '').toLowerCase()
        if (['failed', 'error', 'cancelled', 'canceled'].includes(status)) {
          throw new Error(payload?.error?.message || payload?.message || 'Video generation failed.')
        }
      }
      throw new Error('Video generation is still processing. The provider took longer than five minutes.')
    }
    return toDataUrl(await response.blob())
  }

  return { fetchModels, testConnection, streamChat, generateImage, generateAudio, generateVideo }
}
