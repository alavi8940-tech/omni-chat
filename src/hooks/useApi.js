import { useApp } from '../contexts/AppContext'

export function useApi() {
  const { state, dispatch } = useApp()

  async function fetchModels(apiUrl, apiKey) {
    const url = apiUrl || state.settings.apiUrl
    const key = apiKey || state.settings.apiKey
    if (!url) return

    try {
      const cleanUrl = url.replace(/\/+$/, '')
      const res = await fetch(`${cleanUrl}/v1/models`, {
        headers: key ? { Authorization: `Bearer ${key}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const models = (data.data || data || []).map(m => ({
        id: m.id,
        name: m.id,
        type: detectModelType(m.id),
      }))
      dispatch({ type: 'SET_MODELS', payload: models })
      dispatch({ type: 'SET_CONNECTED', payload: true })
      return models
    } catch (err) {
      console.error('Failed to fetch models:', err)
      dispatch({ type: 'SET_CONNECTED', payload: false })
      return null
    }
  }

  async function sendMessage(chatId, modelId, messages, modelType) {
    const url = state.settings.apiUrl
    const key = state.settings.apiKey
    if (!url) return

    dispatch({ type: 'SET_LOADING', payload: true })
    const cleanUrl = url.replace(/\/+$/, '')

    try {
      if (modelType === 'image') {
        return await generateImage(cleanUrl, key, chatId, modelId, messages)
      }
      if (modelType === 'audio') {
        return await generateAudio(cleanUrl, key, chatId, modelId, messages)
      }
      if (modelType === 'video') {
        return await generateVideo(cleanUrl, key, chatId, modelId, messages)
      }

      const res = await fetch(`${cleanUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { Authorization: `Bearer ${key}` } : {}),
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      dispatch({
        type: 'ADD_MESSAGE',
        payload: { chatId, message: { role: 'assistant', content: '', timestamp: Date.now() } },
      })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content || ''
            fullContent += delta
            dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: { chatId, content: fullContent } })
          } catch {}
        }
      }
    } catch (err) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { chatId, message: { role: 'assistant', content: `Error: ${err.message}`, timestamp: Date.now() } },
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  async function generateImage(baseUrl, key, chatId, modelId, messages) {
    const prompt = messages[messages.length - 1]?.content || ''
    try {
      const res = await fetch(`${baseUrl}/v1/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
        body: JSON.stringify({ model: modelId, prompt, n: 1, size: '1024x1024' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId, message: { role: 'assistant', content: imageUrl, type: 'image', timestamp: Date.now() } } })
    } catch (err) {
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId, message: { role: 'assistant', content: `Error: ${err.message}`, timestamp: Date.now() } } })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  async function generateAudio(baseUrl, key, chatId, modelId, messages) {
    const text = messages[messages.length - 1]?.content || ''
    try {
      const res = await fetch(`${baseUrl}/v1/audio/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
        body: JSON.stringify({ model: modelId, input: text, voice: 'alloy' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const audioUrl = URL.createObjectURL(blob)
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId, message: { role: 'assistant', content: audioUrl, type: 'audio', timestamp: Date.now() } } })
    } catch (err) {
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId, message: { role: 'assistant', content: `Error: ${err.message}`, timestamp: Date.now() } } })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  async function generateVideo(baseUrl, key, chatId, modelId, messages) {
    const prompt = messages[messages.length - 1]?.content || ''
    try {
      const res = await fetch(`${baseUrl}/v1/video/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
        body: JSON.stringify({ model: modelId, prompt }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const videoUrl = data.data?.[0]?.url
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId, message: { role: 'assistant', content: videoUrl, type: 'video', timestamp: Date.now() } } })
    } catch (err) {
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId, message: { role: 'assistant', content: `Error: ${err.message}`, timestamp: Date.now() } } })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  return { fetchModels, sendMessage }
}

function detectModelType(id) {
  const lower = id.toLowerCase()
  if (/dall|image|img|flux|stable|midjourney|pic/.test(lower)) return 'image'
  if (/whisper|tts|audio|speech|voice|sound/.test(lower)) return 'audio'
  if (/video|sora|runway|luma|animate/.test(lower)) return 'video'
  return 'text'
}
