import { MessageSquare, Plus, Settings as SettingsIcon, Trash2, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

function Sidebar({ open, onClose }) {
  const { chats, activeChatId, setActiveChatId, createChat, deleteChat, setView, view } = useApp()

  const openChat = (id) => {
    setActiveChatId(id)
    setView('chat')
    onClose()
  }

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
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

        <button className="new-chat-button" type="button" onClick={createChat}>
          <Plus size={18} />
          New chat
        </button>

        <div className="sidebar-label">Conversations</div>
        <nav className="chat-list" aria-label="Chat history">
          {chats.length === 0 && <p className="empty-list">Your chats will appear here.</p>}
          {chats.map((chat) => (
            <div
              className={`chat-list-item ${view === 'chat' && chat.id === activeChatId ? 'active' : ''}`}
              key={chat.id}
            >
              <button type="button" className="chat-select" onClick={() => openChat(chat.id)}>
                <MessageSquare size={16} />
                <span>{chat.title}</span>
              </button>
              <button
                type="button"
                className="delete-chat"
                aria-label={`Delete ${chat.title}`}
                onClick={() => deleteChat(chat.id)}
              >
                <Trash2 size={15} />
              </button>
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
