import { detectModelType, MODEL_TYPES } from './model.js'
import { makeId } from './text.js'

export const DEFAULT_SETTINGS = {
  apiUrl: '',
  apiKey: '',
  systemPrompt: 'You are a helpful, accurate, and concise assistant.',
  temperature: 0.7,
  voice: 'alloy',
  imageSize: '1024x1024',
  maxContextMessages: 40,
  language: 'en',
  activeProviderId: '',
}

export function makeChat(initial = {}) {
  return {
    id: makeId(),
    title: 'New conversation',
    model: '',
    modelType: 'text',
    messages: [],
    pinned: false,
    archived: false,
    tags: [],
    note: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...initial,
  }
}

export function normalizeSettings(value) {
  const source = value && typeof value === 'object' ? value : {}
  const temperature = Number(source.temperature)
  return {
    ...DEFAULT_SETTINGS,
    apiUrl: typeof source.apiUrl === 'string' ? source.apiUrl : '',
    apiKey: typeof source.apiKey === 'string' ? source.apiKey : '',
    systemPrompt:
      typeof source.systemPrompt === 'string'
        ? source.systemPrompt
        : DEFAULT_SETTINGS.systemPrompt,
    temperature: Number.isFinite(temperature)
      ? Math.min(2, Math.max(0, temperature))
      : DEFAULT_SETTINGS.temperature,
    voice: typeof source.voice === 'string' ? source.voice : DEFAULT_SETTINGS.voice,
    imageSize:
      typeof source.imageSize === 'string' ? source.imageSize : DEFAULT_SETTINGS.imageSize,
    maxContextMessages: Number.isFinite(Number(source.maxContextMessages))
      ? Math.min(200, Math.max(2, Number(source.maxContextMessages)))
      : DEFAULT_SETTINGS.maxContextMessages,
    language: source.language === 'fa' ? 'fa' : 'en',
    activeProviderId:
      typeof source.activeProviderId === 'string' ? source.activeProviderId : '',
  }
}

export function normalizeMessage(message) {
  if (!message || typeof message !== 'object') return null
  return {
    ...message,
    id: typeof message.id === 'string' ? message.id : makeId(),
    role: message.role === 'user' ? 'user' : 'assistant',
    content: typeof message.content === 'string' ? message.content : '',
    prompt: typeof message.prompt === 'string' ? message.prompt : '',
    url: typeof message.url === 'string' ? message.url : '',
    createdAt: Number(message.createdAt) || Date.now(),
  }
}

export function normalizeChat(chat) {
  if (!chat || typeof chat !== 'object') return null
  return {
    ...makeChat(),
    ...chat,
    id: typeof chat.id === 'string' ? chat.id : makeId(),
    title: typeof chat.title === 'string' ? chat.title : 'Imported conversation',
    model: typeof chat.model === 'string' ? chat.model : '',
    modelType: MODEL_TYPES.includes(chat.modelType)
      ? chat.modelType
      : detectModelType(chat.model),
    pinned: Boolean(chat.pinned),
    archived: Boolean(chat.archived),
    tags: Array.isArray(chat.tags)
      ? [...new Set(chat.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean))].slice(0, 12)
      : [],
    note: typeof chat.note === 'string' ? chat.note : '',
    messages: Array.isArray(chat.messages)
      ? chat.messages.map(normalizeMessage).filter(Boolean)
      : [],
    createdAt: Number(chat.createdAt) || Date.now(),
    updatedAt: Number(chat.updatedAt) || Number(chat.createdAt) || Date.now(),
  }
}

export function normalizeProviderProfiles(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter((profile) => profile && typeof profile.apiUrl === 'string' && profile.apiUrl.trim())
    .map((profile) => ({
      id: typeof profile.id === 'string' ? profile.id : makeId(),
      name: typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim() : 'API provider',
      apiUrl: profile.apiUrl.trim(),
      apiKey: typeof profile.apiKey === 'string' ? profile.apiKey : '',
      createdAt: Number(profile.createdAt) || Date.now(),
      updatedAt: Number(profile.updatedAt) || Date.now(),
    }))
}

export function normalizeCustomPrompts(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter((prompt) => prompt && typeof prompt.prompt === 'string' && prompt.prompt.trim())
    .map((prompt) => ({
      id: typeof prompt.id === 'string' ? prompt.id : makeId(),
      category: typeof prompt.category === 'string' ? prompt.category : 'Custom',
      title: typeof prompt.title === 'string' ? prompt.title : 'Untitled prompt',
      description: typeof prompt.description === 'string' ? prompt.description : '',
      prompt: prompt.prompt,
      custom: true,
      createdAt: Number(prompt.createdAt) || Date.now(),
    }))
}
