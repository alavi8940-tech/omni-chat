import { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext(null)

const STORAGE_KEY = 'omnichat-data'

const defaultSettings = {
  apiUrl: '',
  apiKey: '',
}

const defaultState = {
  settings: defaultSettings,
  models: [],
  chats: [],
  activeChatId: null,
  isLoading: false,
  showSettings: false,
  showModelSelector: false,
  sidebarOpen: false,
  connected: false,
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      return { ...defaultState, ...saved }
    }
  } catch {}
  return defaultState
}

function saveState(state) {
  try {
    const { settings, chats, activeChatId } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, chats, activeChatId }))
  } catch {}
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case 'SET_MODELS':
      return { ...state, models: action.payload, connected: true }
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload }
    case 'CREATE_CHAT': {
      const chat = {
        id: Date.now().toString(),
        modelId: action.payload.modelId,
        modelName: action.payload.modelName,
        modelType: action.payload.modelType || 'text',
        title: action.payload.title || 'New Chat',
        messages: [],
        createdAt: Date.now(),
      }
      return { ...state, chats: [chat, ...state.chats], activeChatId: chat.id }
    }
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChatId: action.payload }
    case 'DELETE_CHAT': {
      const chats = state.chats.filter(c => c.id !== action.payload)
      const activeChatId = state.activeChatId === action.payload
        ? (chats[0]?.id || null)
        : state.activeChatId
      return { ...state, chats, activeChatId }
    }
    case 'ADD_MESSAGE': {
      const { chatId, message } = action.payload
      return {
        ...state,
        chats: state.chats.map(c =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, message] }
            : c
        ),
      }
    }
    case 'UPDATE_LAST_MESSAGE': {
      const { chatId, content } = action.payload
      return {
        ...state,
        chats: state.chats.map(c => {
          if (c.id !== chatId) return c
          const msgs = [...c.messages]
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
          }
          return { ...c, messages: msgs }
        }),
      }
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings }
    case 'TOGGLE_MODEL_SELECTOR':
      return { ...state, showModelSelector: !state.showModelSelector }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'CLOSE_SIDEBAR':
      return { ...state, sidebarOpen: false }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)

  useEffect(() => {
    saveState(state)
  }, [state.settings, state.chats, state.activeChatId])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
