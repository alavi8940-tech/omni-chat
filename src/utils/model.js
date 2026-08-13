export const MODEL_TYPES = ['text', 'image', 'audio', 'video']

export const MODEL_TYPE_LABELS = {
  text: 'Text',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
}

const typeMatchers = {
  image: ['dall', 'image', 'img', 'flux', 'stable', 'midjourney', 'pic', 'sdxl'],
  audio: ['whisper', 'tts', 'audio', 'speech', 'voice', 'sound', 'realtime'],
  video: ['video', 'sora', 'runway', 'luma', 'animate', 'veo', 'kling'],
}

export function detectModelType(name = '') {
  const normalized = String(name).toLowerCase()
  for (const [type, words] of Object.entries(typeMatchers)) {
    if (words.some((word) => normalized.includes(word))) return type
  }
  return 'text'
}

export function normalizeModel(model) {
  if (typeof model === 'string') return { id: model, type: detectModelType(model) }
  if (!model || typeof model.id !== 'string') return null
  return { ...model, type: detectModelType(model.id) }
}

export function filterModels(models, query = '', type = 'all', favorites = []) {
  const normalizedQuery = query.trim().toLowerCase()
  const favoriteSet = new Set(favorites)
  return models
    .filter((model) => {
      const modelType = model.type || detectModelType(model.id)
      const matchesType = type === 'all' || modelType === type
      return matchesType && model.id.toLowerCase().includes(normalizedQuery)
    })
    .sort((a, b) => {
      const favoriteDifference = Number(favoriteSet.has(b.id)) - Number(favoriteSet.has(a.id))
      return favoriteDifference || a.id.localeCompare(b.id)
    })
}
