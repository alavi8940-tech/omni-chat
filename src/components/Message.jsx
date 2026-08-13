import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function Message({ message }) {
  const [playing, setPlaying] = useState(false)
  const isUser = message.role === 'user'
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  function renderContent() {
    if (message.type === 'image') {
      return (
        <img
          src={message.content}
          alt="Generated"
          className="message-image"
          onClick={() => window.open(message.content, '_blank')}
        />
      )
    }

    if (message.type === 'video') {
      return (
        <div className="video-container">
          <video controls src={message.content} />
        </div>
      )
    }

    if (message.type === 'audio') {
      return (
        <div className="audio-player">
          <button className="play-btn" onClick={() => {
            const audio = new Audio(message.content)
            audio.play()
            setPlaying(true)
            audio.onended = () => setPlaying(false)
          }}>
            {playing ? '⏸' : '▶'}
          </button>
          <div className="audio-info">
            <div className="audio-name">Audio response</div>
            <div className="audio-wave">
              {Array.from({ length: 20 }, (_, i) => (
                <span key={i} style={{ height: `${Math.random() * 16 + 4}px` }} />
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="message-bubble">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    )
  }

  return (
    <div className={`message ${isUser ? 'user' : 'bot'}`}>
      <div className="message-avatar">
        {isUser ? 'U' : 'AI'}
      </div>
      <div className="message-content">
        {renderContent()}
        <div className="message-time">{time}</div>
      </div>
    </div>
  )
}
