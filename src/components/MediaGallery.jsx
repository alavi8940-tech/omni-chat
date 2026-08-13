import { useMemo, useState } from 'react'
import { Download, ExternalLink, Image, Music2, Play, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

const filters = [
  ['all', 'All media'],
  ['image', 'Images'],
  ['audio', 'Audio'],
  ['video', 'Video'],
]

function MediaGallery() {
  const { chats, setActiveChatId, setView } = useApp()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const media = useMemo(
    () =>
      chats
        .flatMap((chat) =>
          (chat.messages || [])
            .filter((message) => message.url && ['image', 'audio', 'video'].includes(message.mediaType))
            .map((message) => ({ ...message, chatId: chat.id, chatTitle: chat.title })),
        )
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [chats],
  )
  const visible = filter === 'all' ? media : media.filter((item) => item.mediaType === filter)

  const openSource = (item) => {
    setActiveChatId(item.chatId)
    setView('chat')
  }

  return (
    <section className="tool-page">
      <div className="tool-container">
        <div className="tool-hero">
          <div>
            <span className="eyebrow">MEDIA VAULT</span>
            <h1>Everything you generated.</h1>
            <p>A single private gallery for images, speech, and videos across all conversations.</p>
          </div>
          <span className="gallery-count">{media.length} item{media.length === 1 ? '' : 's'}</span>
        </div>

        <div className="model-filters gallery-filters">
          {filters.map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
              {label} <span>{value === 'all' ? media.length : media.filter((item) => item.mediaType === value).length}</span>
            </button>
          ))}
        </div>

        <div className="media-grid">
          {visible.map((item) => (
            <article className="media-card" key={`${item.chatId}-${item.id}`}>
              <button className="media-preview" type="button" onClick={() => setSelected(item)}>
                {item.mediaType === 'image' && <img src={item.url} alt={item.prompt || 'Generated'} loading="lazy" />}
                {item.mediaType === 'video' && <><video src={item.url} preload="metadata" /><span><Play size={21} fill="currentColor" /></span></>}
                {item.mediaType === 'audio' && <div className="audio-art"><Music2 size={34} /></div>}
              </button>
              {item.mediaType === 'audio' && <audio src={item.url} controls preload="metadata" />}
              <div className="media-info">
                <span className={`media-kind ${item.mediaType}`}>
                  {item.mediaType === 'image' ? <Image size={12} /> : item.mediaType === 'audio' ? <Music2 size={12} /> : <Play size={12} />}
                  {item.mediaType}
                </span>
                <p>{item.prompt || 'Generated media'}</p>
                <button type="button" onClick={() => openSource(item)}>{item.chatTitle} <ExternalLink size={12} /></button>
              </div>
            </article>
          ))}
        </div>
        {!visible.length && <div className="empty-state">No generated {filter === 'all' ? 'media' : filter} yet.</div>}
      </div>

      {selected && (
        <div className="media-lightbox" onMouseDown={() => setSelected(null)}>
          <div className="lightbox-content" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lightbox-tools">
              <a href={selected.url} target="_blank" rel="noreferrer" download={`omnichat-${selected.mediaType}`}><Download size={17} /> Download</a>
              <button type="button" onClick={() => setSelected(null)}><X size={19} /></button>
            </div>
            {selected.mediaType === 'image' && <img src={selected.url} alt={selected.prompt || 'Generated'} />}
            {selected.mediaType === 'video' && <video src={selected.url} controls autoPlay playsInline />}
            {selected.mediaType === 'audio' && <audio src={selected.url} controls autoPlay />}
            <p>{selected.prompt}</p>
          </div>
        </div>
      )}
    </section>
  )
}

export default MediaGallery
