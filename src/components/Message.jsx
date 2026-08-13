import { Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function Message({ message }) {
  const isUser = message.role === 'user'

  return (
    <article className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-avatar">{isUser ? <User size={17} /> : <Bot size={17} />}</div>
      <div className="message-body">
        <div className="message-role">{isUser ? 'You' : 'OmniChat'}</div>
        {message.status === 'loading' && !message.content && (
          <div className="typing-dots" aria-label="Generating">
            <span />
            <span />
            <span />
          </div>
        )}
        {message.content && (
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.mediaType === 'image' && message.url && (
          <img className="generated-media generated-image" src={message.url} alt={message.prompt || 'Generated'} />
        )}
        {message.mediaType === 'audio' && message.url && (
          <audio className="generated-media" src={message.url} controls />
        )}
        {message.mediaType === 'video' && message.url && (
          <video className="generated-media generated-video" src={message.url} controls playsInline />
        )}
        {message.status === 'error' && <div className="message-error">{message.error}</div>}
      </div>
    </article>
  )
}

export default Message
