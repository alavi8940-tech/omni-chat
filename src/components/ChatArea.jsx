import { useApp } from '../contexts/AppContext'
import { useApi } from '../hooks/useApi'
import { useState, useRef, useEffect } from 'react'
import { Send, Menu, Image, Video, Music, MessageSquare } from 'lucide-react'
import Message from './Message'

export default function ChatArea() {
  const { state, dispatch } = useApp()
  const { sendMessage } = useApi()
  const [input, setInput] = useState('')
  const messagesRef = useRef(null)
  const textareaRef = useRef(null)

  const activeChat = state.chats.find(c => c.id === state.activeChatId)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [activeChat?.messages])

  function autoResize() {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }

  async function handleSend() {
    if (!input.trim() || state.isLoading || !activeChat) return

    const userMsg = { role: 'user', content: input.trim(), timestamp: Date.now() }
    dispatch({ type: 'ADD_MESSAGE', payload: { chatId: activeChat.id, message: userMsg } })
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const allMessages = [...activeChat.messages, userMsg]
    await sendMessage(activeChat.id, activeChat.modelId, allMessages, activeChat.modelType)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function getPlaceholder() {
    if (!activeChat) return 'Select a model to start...'
    switch (activeChat.modelType) {
      case 'image': return 'Describe the image you want to generate...'
      case 'video': return 'Describe the video you want to generate...'
      case 'audio': return 'Enter text for speech synthesis...'
      default: return 'Type a message...'
    }
  }

  function getTypeIcon(type) {
    switch (type) {
      case 'image': return <Image size={14} />
      case 'video': return <Video size={14} />
      case 'audio': return <Music size={14} />
      default: return <MessageSquare size={14} />
    }
  }

  if (!activeChat) {
    return (
      <div className="main-area">
        <div className="top-bar">
          <button className="menu-btn" onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}>
            <Menu size={20} />
          </button>
          <span className="model-name">OmniChat</span>
        </div>
        <div className="welcome">
          <div className="welcome-icon">💬</div>
          <h2>Welcome to OmniChat</h2>
          <p>Connect your API and start chatting with text, image, video, and audio models.</p>
          <div className="feature-cards">
            <div className="feature-card">
              <div className="fc-icon">💬</div>
              <div className="fc-title">Text Chat</div>
              <div className="fc-desc">Chat with LLMs</div>
            </div>
            <div className="feature-card">
              <div className="fc-icon">🖼️</div>
              <div className="fc-title">Image Gen</div>
              <div className="fc-desc">Create images</div>
            </div>
            <div className="feature-card">
              <div className="fc-icon">🎬</div>
              <div className="fc-title">Video Gen</div>
              <div className="fc-desc">Generate videos</div>
            </div>
            <div className="feature-card">
              <div className="fc-icon">🎵</div>
              <div className="fc-title">Audio Gen</div>
              <div className="fc-desc">Text to speech</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-area">
      <div className="top-bar">
        <button className="menu-btn" onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}>
          <Menu size={20} />
        </button>
        <span className="model-name">{activeChat.modelName}</span>
        <span className="model-badge">{getTypeIcon(activeChat.modelType)} {activeChat.modelType}</span>
        <div style={{ flex: 1 }} />
        <div className={`status-dot ${state.connected ? 'connected' : 'disconnected'}`} />
      </div>

      <div className="chat-messages" ref={messagesRef}>
        {activeChat.messages.length === 0 ? (
          <div className="welcome" style={{ padding: '48px 32px' }}>
            <div className="welcome-icon">
              {activeChat.modelType === 'image' ? '🖼️' :
               activeChat.modelType === 'video' ? '🎬' :
               activeChat.modelType === 'audio' ? '🎵' : '💬'}
            </div>
            <h2>{activeChat.modelName}</h2>
            <p>
              {activeChat.modelType === 'image' && 'Describe an image and the AI will generate it for you.'}
              {activeChat.modelType === 'video' && 'Describe a video and the AI will create it for you.'}
              {activeChat.modelType === 'audio' && 'Enter text and the AI will convert it to speech.'}
              {activeChat.modelType === 'text' && 'Start a conversation with this model.'}
            </p>
          </div>
        ) : (
          activeChat.messages.map((msg, i) => (
            <Message key={i} message={msg} />
          ))
        )}
        {state.isLoading && (
          <div className="message bot">
            <div className="message-avatar">AI</div>
            <div className="message-content">
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize() }}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            rows={1}
            disabled={state.isLoading}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || state.isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
