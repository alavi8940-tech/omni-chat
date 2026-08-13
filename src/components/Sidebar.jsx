import { useApp } from '../contexts/AppContext'
import { Plus, Settings, Trash2, MessageSquare, Image, Video, Music, X } from 'lucide-react'

export default function Sidebar() {
  const { state, dispatch } = useApp()

  function getChatIcon(type) {
    switch (type) {
      case 'image': return <Image size={16} />
      case 'video': return <Video size={16} />
      case 'audio': return <Music size={16} />
      default: return <MessageSquare size={16} />
    }
  }

  function getPreview(chat) {
    const last = chat.messages[chat.messages.length - 1]
    if (!last) return 'Empty chat'
    if (last.type === 'image') return '🖼️ Image'
    if (last.type === 'video') return '🎬 Video'
    if (last.type === 'audio') return '🎵 Audio'
    return last.content?.slice(0, 40) || '...'
  }

  return (
    <>
      {state.sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })} />
      )}
      <aside className={`sidebar ${state.sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">O</div>
          <h1>OmniChat</h1>
          <button
            className="back-btn"
            style={{ marginLeft: 'auto', display: 'none' }}
            onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
          >
            <X size={20} />
          </button>
        </div>

        <button className="new-chat-btn" onClick={() => dispatch({ type: 'TOGGLE_MODEL_SELECTOR' })}>
          <Plus size={18} />
          New Chat
        </button>

        <div className="chat-list">
          {state.chats.length === 0 ? (
            <div className="empty-chats">No conversations yet</div>
          ) : (
            state.chats.map(chat => (
              <div
                key={chat.id}
                className={`chat-item ${chat.id === state.activeChatId ? 'active' : ''}`}
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_CHAT', payload: chat.id })
                  dispatch({ type: 'CLOSE_SIDEBAR' })
                }}
              >
                <div className="chat-icon">{getChatIcon(chat.modelType)}</div>
                <div className="chat-info">
                  <div className="chat-title">{chat.title}</div>
                  <div className="chat-preview">{getPreview(chat)}</div>
                </div>
                <button
                  className="delete-btn"
                  onClick={e => {
                    e.stopPropagation()
                    dispatch({ type: 'DELETE_CHAT', payload: chat.id })
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <button className="settings-btn" onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}>
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>
    </>
  )
}
