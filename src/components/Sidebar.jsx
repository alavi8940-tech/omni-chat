import { useMemo, useState } from 'react'
import {
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Settings as SettingsIcon,
  Trash2,
  X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'

function Sidebar({ open, onClose }) {
  const {
    chats,
    activeChat,
    activeChatId,
    setActiveChatId,
    createChat,
    deleteChat,
    updateChat,
    setView,
    view,
  } = useApp()
  const [query, setQuery] = useState('')
  const visibleChats = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return [...chats]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .filter((chat) => chat.title.toLowerCase().includes(normalized))
  }, [chats, query])

  const openChat = (id) => {
    setActiveChatId(id)
    setView('chat')
    onClose()
  }

  const removeChat = (chat) => {
    if (window.confirm(`Delete “${chat.title}”? This cannot be undone.`)) {
      deleteChat(chat.id)
    }
  }

  const renameChat = (chat) => {
    const nextTitle = window.prompt('Rename conversation', chat.title)?.trim()
    if (nextTitle) updateChat(chat.id, { title: nextTitle.slice(0, 80) })
  }

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="OmniChat sidebar">
        <div className="brand-row">
          <div className="brand-mark">O</div>
          <div>
            <strong>OmniChat</strong>
            <span>All models. One place.</span>
          </div>
          <button className="icon-button close-sidebar" type="button" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <button
          className="new-chat-button"
          type="button"
          onClick={() =>
            createChat(
              activeChat
                ? { model: activeChat.model, modelType: activeChat.modelType }
                : {},
            )
          }
        >
          <Plus size={18} />
          New chat
        </button>

        {chats.length > 4 && (
          <label className="sidebar-search">
            <Search size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats" />
          </label>
        )}

        <div className="sidebar-label">Conversations <span>{chats.length}</span></div>
        <nav className="chat-list" aria-label="Chat history">
          {visibleChats.length === 0 && (
            <p className="empty-list">{chats.length ? 'No matching conversations.' : 'Your chats will appear here.'}</p>
          )}
          {visibleChats.map((chat) => (
            <div
              className={`chat-list-item ${view === 'chat' && chat.id === activeChatId ? 'active' : ''}`}
              key={chat.id}
            >
              <button type="button" className="chat-select" onClick={() => openChat(chat.id)}>
                <MessageSquare size={16} />
                <span>
                  <strong>{chat.title}</strong>
                  <small>{chat.model || 'No model selected'}</small>
                </span>
              </button>
              <div className="chat-item-actions">
                <button
                  type="button"
                  className="edit-chat"
                  aria-label={`Rename ${chat.title}`}
                  onClick={() => renameChat(chat)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="delete-chat"
                  aria-label={`Delete ${chat.title}`}
                  onClick={() => removeChat(chat)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </nav>

        <button
          className={`settings-link ${view === 'settings' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            setView('settings')
            onClose()
          }}
        >
          <SettingsIcon size={18} />
          Settings
        </button>
      </aside>
      {open && <button className="sidebar-backdrop" type="button" aria-label="Close menu" onClick={onClose} />}
    </>
  )
}

export default Sidebar
