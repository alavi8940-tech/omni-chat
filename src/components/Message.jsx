import { useState } from 'react'
import { Bot, Check, Copy, Download, Pencil, RefreshCw, Trash2, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { detectTextDirection, formatRelativeTime } from '../utils/text'

function Message({ message, onRetry, onEdit, onDelete }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const direction = detectTextDirection(message.content || message.prompt)

  const copyMessage = async () => {
    if (!message.content) return
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // Clipboard access can be disabled by the WebView or browser permissions.
    }
  }

  return (
    <article className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-avatar" aria-hidden="true">
        {isUser ? <User size={17} /> : <Bot size={17} />}
      </div>
      <div className="message-body">
        <div className="message-meta">
          <div className="message-role">
            {isUser ? 'You' : 'OmniChat'}
            {message.createdAt && <time dateTime={new Date(message.createdAt).toISOString()}>{formatRelativeTime(message.createdAt)}</time>}
          </div>
          <div className="message-actions">
            {message.content && (
              <button type="button" className="message-action" onClick={copyMessage} aria-label="Copy message">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )}
            {message.url && (
              <a
                className="message-action"
                href={message.url}
                download={`omnichat-${message.mediaType || 'media'}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Download generated media"
              >
                <Download size={14} />
              </a>
            )}
            {message.status === 'error' && onRetry && (
              <button type="button" className="message-action" onClick={onRetry} aria-label="Retry request">
                <RefreshCw size={14} />
              </button>
            )}
            {onEdit && (
              <button type="button" className="message-action" onClick={onEdit} aria-label="Edit and continue from this message">
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button type="button" className="message-action danger" onClick={onDelete} aria-label="Delete message">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {message.status === 'loading' && !message.content && (
          <div className="typing-dots" aria-label="Generating" role="status">
            <span />
            <span />
            <span />
          </div>
        )}
        {message.content && (
          <div className="markdown" dir={direction}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ children, ...props }) => (
                  <a {...props} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {message.mediaType === 'image' && message.url && (
          <img
            className="generated-media generated-image"
            src={message.url}
            alt={message.prompt || 'Generated'}
            loading="lazy"
          />
        )}
        {message.mediaType === 'audio' && message.url && (
          <audio className="generated-media" src={message.url} controls preload="metadata" />
        )}
        {message.mediaType === 'video' && message.url && (
          <video className="generated-media generated-video" src={message.url} controls playsInline preload="metadata" />
        )}
        {(message.status === 'error' || message.status === 'cancelled') && (
          <div className={`message-error ${message.status}`} role="alert">{message.error}</div>
        )}
      </div>
    </article>
  )
}

export default Message
