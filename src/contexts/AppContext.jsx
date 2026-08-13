import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const AppContext = createContext(null)

const SETTINGS_KEY = 'omnichat-settings'
const CHATS_KEY = 'omnichat-chats'
const ACTIVE_CHAT_KEY = 'omnichat-active-chat'

export const defaultSettings = {
  apiUrl: '',
  apiKey: '',
  systemPrompt: 'You are a helpful, accurate, and concise assistant.',
  temperature: 0.7,
  voice: 'alloy',
  imageSize: '1024x1024',
}

const typeMatchers = {
  image: ['dall', 'image', 'img', 'flux', 'stable', 'midjourney', 'pic'],
  audio: ['whisper', 'tts', 'audio', 'speech', 'voice', 'sound'],
  video: ['video', 'sora', 'runway', 'luma', 'animate'],
}

export function detectModelType(name = '') {
  const normalized = name.toLowerCase()
  for (const [type, words] of Object.entries(typeMatchers)) {
    if (words.some((word) => normalized.includes(word))) return type
  }
  return 'text'
}

export function detectTextDirection(value = '') {
  return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(value) ? 'rtl' : 'ltr'
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // Storage can be unavailable or full (for example, after a large media response).
    return false
  }
}

function makeChat(initial = {}) {
  return {
    id: makeId(),
    title: 'New conversation',
    model: '',
    modelType: 'text',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...initial,
  }
}

export function makeId() {
  return globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function normalizeSettings(value) {
  const source = value && typeof value === 'object' ? value : {}
  const temperature = Number(source.temperature)
  return {
    ...defaultSettings,
    apiUrl: typeof source.apiUrl === 'string' ? source.apiUrl : '',
    apiKey: typeof source.apiKey === 'string' ? source.apiKey : '',
    systemPrompt:
      typeof source.systemPrompt === 'string'
        ? source.systemPrompt
        : defaultSettings.systemPrompt,
    temperature: Number.isFinite(temperature)
      ? Math.min(2, Math.max(0, temperature))
      : defaultSettings.temperature,
    voice: typeof source.voice === 'string' ? source.voice : defaultSettings.voice,
    imageSize:
      typeof source.imageSize === 'string' ? source.imageSize : defaultSettings.imageSize,
  }
}

function normalizeMessage(message) {
  if (!message || typeof message !== 'object') return null
  return {
    ...message,
    id: typeof message.id === 'string' ? message.id : makeId(),
    role: message.role === 'user' ? 'user' : 'assistant',
    content: typeof message.content === 'string' ? message.content : '',
    prompt: typeof message.prompt === 'string' ? message.prompt : '',
    url: typeof message.url === 'string' ? message.url : '',
  }
}

function normalizeChat(chat) {
  if (!chat || typeof chat !== 'object') return null
  return {
    ...makeChat(),
    ...chat,
    id: typeof chat.id === 'string' ? chat.id : makeId(),
    title: typeof chat.title === 'string' ? chat.title : 'Imported conversation',
    model: typeof chat.model === 'string' ? chat.model : '',
    modelType: ['text', 'image', 'audio', 'video'].includes(chat.modelType)
      ? chat.modelType
      : detectModelType(chat.model),
    messages: Array.isArray(chat.messages)
      ? chat.messages.map(normalizeMessage).filter(Boolean)
      : [],
  }
}

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(() =>
    normalizeSettings(readStorage(SETTINGS_KEY, defaultSettings)),
  )
  const [chats, setChats] = useState(() => {
    const stored = readStorage(CHATS_KEY, [])
    return Array.isArray(stored) ? stored.map(normalizeChat).filter(Boolean) : []
  })
  const [activeChatId, setActiveChatId] = useState(() => readStorage(ACTIVE_CHAT_KEY, null))
  const [models, setModels] = useState([])
  const [view, setView] = useState('chat')
  const [storageWarning, setStorageWarning] = useState('')
  const chatsRef = useRef(chats)
  chatsRef.current = chats

  useEffect(() => {
    if (!writeStorage(SETTINGS_KEY, settings)) {
      setStorageWarning('Settings could not be saved on this device.')
    }
  }, [settings])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!writeStorage(CHATS_KEY, chats)) {
        setStorageWarning('Storage is full. Large generated media may not persist after closing the app.')
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [chats])

  useEffect(() => {
    writeStorage(ACTIVE_CHAT_KEY, activeChatId)
  }, [activeChatId])

  useEffect(() => {
    const flushChats = () => writeStorage(CHATS_KEY, chatsRef.current)
    window.addEventListener('pagehide', flushChats)
    return () => window.removeEventListener('pagehide', flushChats)
  }, [])

  useEffect(() => {
    if (chats.length && !chats.some((chat) => chat.id === activeChatId)) {
      setActiveChatId(chats[0].id)
    }
  }, [chats, activeChatId])

  const activeChat = chats.find((chat) => chat.id === activeChatId) || null

  const createChat = useCallback((initial = {}) => {
    const chat = makeChat(initial)
    setChats((current) => [chat, ...current])
    setActiveChatId(chat.id)
    setView('chat')
    return chat.id
  }, [])

  const deleteChat = useCallback((id) => {
    setChats((current) => current.filter((chat) => chat.id !== id))
    setActiveChatId((current) => (current === id ? null : current))
  }, [])

  const updateChat = useCallback((id, updates) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === id ? { ...chat, ...updates, updatedAt: Date.now() } : chat,
      ),
    )
  }, [])

  const addMessage = useCallback((chatId, message) => {
    setChats((current) =>
      current.map((chat) => {
        if (chat.id !== chatId) return chat
        const title =
          chat.messages.length === 0 && message.role === 'user'
            ? message.content.trim().slice(0, 42) || 'New conversation'
            : chat.title
        return {
          ...chat,
          title,
          messages: [...chat.messages, message],
          updatedAt: Date.now(),
        }
      }),
    )
  }, [])

  const updateMessage = useCallback((chatId, messageId, updates) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === messageId ? { ...message, ...updates } : message,
              ),
              updatedAt: Date.now(),
            }
          : chat,
      ),
    )
  }, [])

  const deleteMessage = useCallback((chatId, messageId) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.filter((message) => message.id !== messageId),
              updatedAt: Date.now(),
            }
          : chat,
      ),
    )
  }, [])

  const clearChats = useCallback(() => {
    setChats([])
    setActiveChatId(null)
  }, [])

  const importData = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') throw new Error('Invalid backup file.')
    const hasChats = Array.isArray(payload.chats)
    const importedChats = hasChats
      ? payload.chats.map(normalizeChat).filter(Boolean)
      : []
    if (!hasChats && !payload.settings) {
      throw new Error('No OmniChat data was found in this file.')
    }
    if (payload.settings && typeof payload.settings === 'object') {
      setSettings(normalizeSettings(payload.settings))
    }
    if (hasChats) {
      setChats(importedChats)
      setActiveChatId(importedChats[0]?.id || null)
    }
  }, [])

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      chats,
      activeChat,
      activeChatId,
      setActiveChatId,
      createChat,
      deleteChat,
      updateChat,
      addMessage,
      updateMessage,
      deleteMessage,
      clearChats,
      importData,
      models,
      setModels,
      view,
      setView,
      storageWarning,
      setStorageWarning,
    }),
    [
      settings,
      chats,
      activeChat,
      activeChatId,
      createChat,
      deleteChat,
      updateChat,
      addMessage,
      updateMessage,
      deleteMessage,
      clearChats,
      importData,
      models,
      view,
      storageWarning,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
