import { useState } from 'react'
import { Archive, Braces, Copy, Download, Pin, Share2, Tag, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { chatToMarkdown, downloadJson, exportChatMarkdown } from '../utils/export'
import { sanitizeFilename } from '../utils/text'

function ChatInspector({ chat, onClose }) {
  const { updateChat, duplicateChat } = useApp()
  const [tag, setTag] = useState('')

  const addTag = (event) => {
    event.preventDefault()
    const value = tag.trim().slice(0, 24)
    if (!value || chat.tags.includes(value)) return
    updateChat(chat.id, { tags: [...chat.tags, value].slice(0, 12) })
    setTag('')
  }

  return (
    <div className="inspector-backdrop" onMouseDown={onClose}>
      <aside className="chat-inspector" onMouseDown={(event) => event.stopPropagation()} aria-label="Conversation details">
        <div className="inspector-header">
          <div><span className="eyebrow">CONVERSATION</span><h2>Details & tools</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close details"><X size={19} /></button>
        </div>

        <label className="field">
          <span>Title</span>
          <input value={chat.title} maxLength="80" onChange={(event) => updateChat(chat.id, { title: event.target.value })} />
        </label>

        <div className="inspector-facts">
          <div><span>Model</span><strong>{chat.model || 'None'}</strong></div>
          <div><span>Mode</span><strong>{chat.modelType}</strong></div>
          <div><span>Messages</span><strong>{chat.messages.length}</strong></div>
          <div><span>Updated</span><strong>{new Date(chat.updatedAt).toLocaleString()}</strong></div>
        </div>

        <div className="inspector-actions">
          <button type="button" className={chat.pinned ? 'active' : ''} onClick={() => updateChat(chat.id, { pinned: !chat.pinned })}>
            <Pin size={16} /> {chat.pinned ? 'Unpin' : 'Pin'}
          </button>
          <button type="button" className={chat.archived ? 'active' : ''} onClick={() => updateChat(chat.id, { archived: !chat.archived })}>
            <Archive size={16} /> {chat.archived ? 'Unarchive' : 'Archive'}
          </button>
          <button type="button" onClick={() => duplicateChat(chat.id)}><Copy size={16} /> Duplicate</button>
          <button type="button" onClick={() => exportChatMarkdown(chat)}><Download size={16} /> Markdown</button>
          <button type="button" onClick={() => downloadJson(chat, `${sanitizeFilename(chat.title)}.json`)}><Braces size={16} /> JSON</button>
          <button
            type="button"
            onClick={async () => {
              try {
                const text = chatToMarkdown(chat)
                if (navigator.share) await navigator.share({ title: chat.title, text })
                else await navigator.clipboard.writeText(text)
              } catch {
                // Share sheets may be dismissed and clipboard access may be blocked.
              }
            }}
          >
            <Share2 size={16} /> Share
          </button>
        </div>

        <label className="field">
          <span>Private note</span>
          <textarea rows="5" value={chat.note} onChange={(event) => updateChat(chat.id, { note: event.target.value })} placeholder="Add context that is not sent to the model..." />
        </label>

        <div className="tag-section">
          <span className="field-label">Tags</span>
          <div className="tag-list">
            {chat.tags.map((item) => (
              <button key={item} type="button" onClick={() => updateChat(chat.id, { tags: chat.tags.filter((value) => value !== item) })}>
                {item} <X size={11} />
              </button>
            ))}
          </div>
          <form className="tag-form" onSubmit={addTag}>
            <Tag size={15} />
            <input value={tag} onChange={(event) => setTag(event.target.value)} placeholder="Add tag" maxLength="24" />
            <button type="submit">Add</button>
          </form>
        </div>
      </aside>
    </div>
  )
}

export default ChatInspector
