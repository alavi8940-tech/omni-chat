import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { makeId, makeTitle } from '../utils/text'
import {
  DEFAULT_SETTINGS,
  makeChat,
  normalizeChat,
  normalizeCustomPrompts,
  normalizeProviderProfiles,
  normalizeSettings,
} from '../utils/schema'

const AppContext = createContext(null)

const SETTINGS_KEY = 'omnichat-settings'
const CHATS_KEY = 'omnichat-chats'
const ACTIVE_CHAT_KEY = 'omnichat-active-chat'
const FAVORITES_KEY = 'omnichat-favorite-models'
const CUSTOM_PROMPTS_KEY = 'omnichat-custom-prompts'
const PROVIDERS_KEY = 'omnichat-provider-profiles'

export const defaultSettings = DEFAULT_SETTINGS

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
  const [favoriteModels, setFavoriteModels] = useState(() => readStorage(FAVORITES_KEY, []))
  const [customPrompts, setCustomPrompts] = useState(() =>
    normalizeCustomPrompts(readStorage(CUSTOM_PROMPTS_KEY, [])),
  )
  const [providerProfiles, setProviderProfiles] = useState(() =>
    normalizeProviderProfiles(readStorage(PROVIDERS_KEY, [])),
  )
  const [view, setView] = useState('chat')
  const [draft, setDraft] = useState('')
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
    writeStorage(FAVORITES_KEY, favoriteModels)
  }, [favoriteModels])

  useEffect(() => {
    writeStorage(CUSTOM_PROMPTS_KEY, customPrompts)
  }, [customPrompts])

  useEffect(() => {
    writeStorage(PROVIDERS_KEY, providerProfiles)
  }, [providerProfiles])

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
            ? makeTitle(message.content)
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

  const duplicateChat = useCallback((id) => {
    const source = chatsRef.current.find((chat) => chat.id === id)
    if (!source) return null
    const copy = normalizeChat({
      ...source,
      id: makeId(),
      title: `${source.title} (copy)`,
      pinned: false,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: source.messages.map((message) => ({ ...message, id: makeId() })),
    })
    setChats((current) => [copy, ...current])
    setActiveChatId(copy.id)
    setView('chat')
    return copy.id
  }, [])

  const clearChats = useCallback(() => {
    setChats([])
    setActiveChatId(null)
  }, [])

  const toggleFavoriteModel = useCallback((modelId) => {
    setFavoriteModels((current) =>
      current.includes(modelId)
        ? current.filter((item) => item !== modelId)
        : [modelId, ...current],
    )
  }, [])

  const addCustomPrompt = useCallback((prompt) => {
    const item = {
      id: makeId(),
      category: prompt.category?.trim() || 'Custom',
      title: prompt.title?.trim() || 'Untitled prompt',
      description: prompt.description?.trim() || '',
      prompt: prompt.prompt?.trim() || '',
      custom: true,
      createdAt: Date.now(),
    }
    if (!item.prompt) throw new Error('Prompt text is required.')
    setCustomPrompts((current) => [item, ...current])
    return item
  }, [])

  const deleteCustomPrompt = useCallback((id) => {
    setCustomPrompts((current) => current.filter((item) => item.id !== id))
  }, [])

  const saveProviderProfile = useCallback((profile) => {
    const item = {
      id: profile.id || makeId(),
      name: profile.name?.trim() || 'API provider',
      apiUrl: profile.apiUrl?.trim() || '',
      apiKey: profile.apiKey?.trim() || '',
      createdAt: profile.createdAt || Date.now(),
      updatedAt: Date.now(),
    }
    if (!item.apiUrl) throw new Error('Provider URL is required.')
    setProviderProfiles((current) => {
      const exists = current.some((provider) => provider.id === item.id)
      return exists
        ? current.map((provider) => (provider.id === item.id ? item : provider))
        : [item, ...current]
    })
    return item
  }, [])

  const deleteProviderProfile = useCallback((id) => {
    setProviderProfiles((current) => current.filter((provider) => provider.id !== id))
  }, [])

  const activateProviderProfile = useCallback((id) => {
    const profile = providerProfiles.find((provider) => provider.id === id)
    if (!profile) return
    setSettings((current) => ({
      ...current,
      apiUrl: profile.apiUrl,
      apiKey: profile.apiKey,
      activeProviderId: profile.id,
    }))
    setModels([])
  }, [providerProfiles])

  const importData = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') throw new Error('Invalid backup file.')
    const isSingleChat = Array.isArray(payload.messages)
    const hasChats = Array.isArray(payload.chats) || isSingleChat
    const importedChats = hasChats
      ? (isSingleChat ? [payload] : payload.chats).map(normalizeChat).filter(Boolean)
      : []
    if (!hasChats && !payload.settings) {
      throw new Error('No OmniChat data was found in this file.')
    }
    if (payload.settings && typeof payload.settings === 'object') {
      setSettings(normalizeSettings(payload.settings))
    }
    if (Array.isArray(payload.providerProfiles)) {
      setProviderProfiles(normalizeProviderProfiles(payload.providerProfiles))
    }
    if (Array.isArray(payload.customPrompts)) {
      setCustomPrompts(normalizeCustomPrompts(payload.customPrompts))
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
      duplicateChat,
      clearChats,
      importData,
      models,
      setModels,
      favoriteModels,
      toggleFavoriteModel,
      customPrompts,
      addCustomPrompt,
      deleteCustomPrompt,
      providerProfiles,
      saveProviderProfile,
      deleteProviderProfile,
      activateProviderProfile,
      view,
      setView,
      draft,
      setDraft,
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
      duplicateChat,
      clearChats,
      importData,
      models,
      favoriteModels,
      toggleFavoriteModel,
      customPrompts,
      addCustomPrompt,
      deleteCustomPrompt,
      providerProfiles,
      saveProviderProfile,
      deleteProviderProfile,
      activateProviderProfile,
      view,
      draft,
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
