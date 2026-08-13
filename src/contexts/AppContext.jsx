import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppContext = createContext(null)

const SETTINGS_KEY = 'omnichat-settings'
const CHATS_KEY = 'omnichat-chats'
const ACTIVE_CHAT_KEY = 'omnichat-active-chat'

const defaultSettings = {
  apiUrl: '',
  apiKey: '',
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
  } catch {
    // Storage can be unavailable or full (for example, after a large media response).
  }
}

function makeChat(initial = {}) {
  return {
    id: crypto.randomUUID(),
    title: 'New conversation',
    model: '',
    modelType: 'text',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...initial,
  }
}

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(() => readStorage(SETTINGS_KEY, defaultSettings))
  const [chats, setChats] = useState(() => readStorage(CHATS_KEY, []))
  const [activeChatId, setActiveChatId] = useState(() => readStorage(ACTIVE_CHAT_KEY, null))
  const [models, setModels] = useState([])
  const [view, setView] = useState('chat')

  useEffect(() => {
    writeStorage(SETTINGS_KEY, settings)
  }, [settings])

  useEffect(() => {
    writeStorage(CHATS_KEY, chats)
  }, [chats])

  useEffect(() => {
    writeStorage(ACTIVE_CHAT_KEY, activeChatId)
  }, [activeChatId])

  useEffect(() => {
    if (chats.length && !chats.some((chat) => chat.id === activeChatId)) {
      setActiveChatId(chats[0].id)
    }
  }, [chats, activeChatId])

  const activeChat = chats.find((chat) => chat.id === activeChatId) || null

  const createChat = (initial = {}) => {
    const chat = makeChat(initial)
    setChats((current) => [chat, ...current])
    setActiveChatId(chat.id)
    setView('chat')
    return chat.id
  }

  const deleteChat = (id) => {
    setChats((current) => current.filter((chat) => chat.id !== id))
  }

  const updateChat = (id, updates) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === id ? { ...chat, ...updates, updatedAt: Date.now() } : chat,
      ),
    )
  }

  const addMessage = (chatId, message) => {
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
  }

  const updateMessage = (chatId, messageId, updates) => {
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
  }

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
      models,
      setModels,
      view,
      setView,
    }),
    [settings, chats, activeChat, activeChatId, models, view],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
