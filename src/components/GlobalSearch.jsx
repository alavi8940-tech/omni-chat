import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Search, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

function GlobalSearch({ onClose }) {
  const { chats, setActiveChatId, setView } = useApp()
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return chats.flatMap((chat) => {
      const titleMatch = chat.title.toLowerCase().includes(needle)
      const messageMatches = (chat.messages || [])
        .filter((message) => message.content?.toLowerCase().includes(needle))
        .slice(0, 3)
      if (!titleMatch && !messageMatches.length) return []
      return [{ chat, excerpts: messageMatches }]
    }).slice(0, 30)
  }, [chats, query])

  useEffect(() => {
    const close = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  const openChat = (id) => {
    setActiveChatId(id)
    setView('chat')
    onClose()
  }

  return (
    <div className="modal-backdrop search-backdrop" onMouseDown={onClose}>
      <section className="global-search-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="global-search-input">
          <Search size={20} />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search every conversation..." />
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close search"><X size={19} /></button>
        </div>
        <div className="global-results">
          {!query && <div className="search-hint">Search chat titles and message content. Press Esc to close.</div>}
          {query && !results.length && <div className="search-hint">No matching conversations.</div>}
          {results.map(({ chat, excerpts }) => (
            <button key={chat.id} type="button" className="global-result" onClick={() => openChat(chat.id)}>
              <MessageSquare size={17} />
              <span>
                <strong>{chat.title}</strong>
                <small>{excerpts[0]?.content?.slice(0, 130) || chat.model || 'Conversation'}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default GlobalSearch
