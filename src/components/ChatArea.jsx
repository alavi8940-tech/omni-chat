import { useEffect, useRef, useState } from 'react'
import { Bot, ChevronDown, Image, Mic2, Send, Sparkles, Video } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useApi } from '../hooks/useApi'
import Message from './Message'
import ModelSelector from './ModelSelector'

const modeMeta = {
  text: { label: 'Text', icon: Bot, placeholder: 'Message your model...' },
  image: { label: 'Image', icon: Image, placeholder: 'Describe the image you want...' },
  audio: { label: 'Audio', icon: Mic2, placeholder: 'Enter text to turn into speech...' },
  video: { label: 'Video', icon: Video, placeholder: 'Describe the video you want...' },
}

function ChatArea() {
  const {
    settings,
    activeChat,
    createChat,
    updateChat,
    addMessage,
    updateMessage,
    models,
    setModels,
    setView,
  } = useApp()
  const api = useApi()
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [modelError, setModelError] = useState('')
  const endRef = useRef(null)

  const mode = activeChat?.modelType || 'text'
  const meta = modeMeta[mode]
  const ModeIcon = meta.icon

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages])

  const loadModels = async () => {
    setModelError('')
    if (!settings.apiUrl || !settings.apiKey) {
      setView('settings')
      return
    }
    try {
      const found = await api.fetchModels(settings.apiUrl, settings.apiKey)
      setModels(found)
      setModelOpen(true)
    } catch (error) {
      setModelError(error.message)
    }
  }

  const selectModel = (model, modelType) => {
    if (!activeChat?.id) {
      createChat({ model, modelType })
      return
    }
    updateChat(activeChat.id, { model, modelType })
  }

  const submit = async (event) => {
    event.preventDefault()
    const content = prompt.trim()
    if (!content || busy) return
    if (!settings.apiUrl || !settings.apiKey) {
      setView('settings')
      return
    }
    if (!activeChat?.model) {
      await loadModels()
      return
    }

    const chatId = activeChat.id
    const userMessage = { id: crypto.randomUUID(), role: 'user', content }
    const assistantId = crypto.randomUUID()
    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      status: 'loading',
      mediaType: mode === 'text' ? null : mode,
      prompt: content,
    }
    const history = [...activeChat.messages, userMessage]
      .filter((message) => message.content && !message.mediaType)
      .map(({ role, content: messageContent }) => ({ role, content: messageContent }))

    setPrompt('')
    setBusy(true)
    addMessage(chatId, userMessage)
    addMessage(chatId, assistantMessage)

    try {
      if (mode === 'text') {
        let fullText = ''
        await api.streamChat({
          ...settings,
          model: activeChat.model,
          messages: history,
          onToken: (token) => {
            fullText += token
            updateMessage(chatId, assistantId, { content: fullText })
          },
        })
        updateMessage(chatId, assistantId, { content: fullText, status: 'done' })
      } else {
        const method = {
          image: api.generateImage,
          audio: api.generateAudio,
          video: api.generateVideo,
        }[mode]
        const url = await method({ ...settings, model: activeChat.model, prompt: content })
        updateMessage(chatId, assistantId, { url, status: 'done' })
      }
    } catch (error) {
      updateMessage(chatId, assistantId, { status: 'error', error: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="chat-page">
      <header className="chat-header">
        <div className="chat-heading">
          <span className={`mode-dot ${mode}`} />
          <div>
            <h1>{activeChat?.title || 'New conversation'}</h1>
            <span>{meta.label} mode</span>
          </div>
        </div>
        <button className="model-trigger" type="button" onClick={loadModels}>
          <ModeIcon size={17} />
          <span>{activeChat?.model || 'Select model'}</span>
          <ChevronDown size={16} />
        </button>
      </header>

      {modelError && (
        <button className="connection-error" type="button" onClick={() => setView('settings')}>
          {modelError} · Open settings
        </button>
      )}

      <div className="messages">
        {!activeChat || activeChat.messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-icon"><Sparkles size={29} /></div>
            <span className="eyebrow">WELCOME TO OMNICHAT</span>
            <h2>What will you create?</h2>
            <p>Connect your OpenAI-compatible API, choose any model, and start a conversation.</p>
            {!activeChat?.model && (
              <button className="primary-button" type="button" onClick={loadModels}>
                Choose your model
              </button>
            )}
          </div>
        ) : (
          activeChat.messages.map((message) => <Message message={message} key={message.id} />)
        )}
        <div ref={endRef} />
      </div>

      <form className="composer-wrap" onSubmit={submit}>
        <div className="composer">
          <textarea
            rows="1"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder={meta.placeholder}
            aria-label="Message"
          />
          <button className="send-button" type="submit" disabled={!prompt.trim() || busy} aria-label="Send">
            <Send size={18} />
          </button>
        </div>
        <p>AI can make mistakes. Check important information.</p>
      </form>

      {modelOpen && (
        <ModelSelector
          models={models}
          selected={activeChat?.model}
          onSelect={selectModel}
          onClose={() => setModelOpen(false)}
        />
      )}
    </section>
  )
}

export default ChatArea
