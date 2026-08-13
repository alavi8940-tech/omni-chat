import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  ChevronDown,
  Image,
  Mic2,
  Send,
  Sparkles,
  Square,
  Video,
} from 'lucide-react'
import { detectTextDirection, makeId, useApp } from '../contexts/AppContext'
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
    deleteMessage,
    models,
    setModels,
    setView,
    storageWarning,
    setStorageWarning,
  } = useApp()
  const api = useApi()
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [modelError, setModelError] = useState('')
  const [stickToBottom, setStickToBottom] = useState(true)
  const abortRef = useRef(null)
  const endRef = useRef(null)
  const textareaRef = useRef(null)

  const mode = activeChat?.modelType || 'text'
  const meta = modeMeta[mode]
  const ModeIcon = meta.icon

  useEffect(() => {
    if (stickToBottom) endRef.current?.scrollIntoView({ behavior: busy ? 'auto' : 'smooth' })
  }, [activeChat?.messages, busy, stickToBottom])

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 130)}px`
  }, [prompt])

  const loadModels = async (force = false) => {
    setModelError('')
    if (!settings.apiUrl) {
      setView('settings')
      return
    }
    if (models.length && !force) {
      setModelOpen(true)
      return
    }
    setLoadingModels(true)
    try {
      const found = await api.fetchModels(settings.apiUrl, settings.apiKey)
      setModels(found)
      setModelOpen(true)
    } catch (error) {
      setModelError(error.message)
    } finally {
      setLoadingModels(false)
    }
  }

  const selectModel = (model, modelType) => {
    if (!activeChat?.id) {
      createChat({ model, modelType })
      return
    }
    updateChat(activeChat.id, { model, modelType })
  }

  const runRequest = async (content, sourceChat = activeChat, { appendUser = true } = {}) => {
    if (!content || busy || !sourceChat?.model) return
    const chatId = sourceChat.id
    const modeAtStart = sourceChat.modelType || 'text'
    const userMessage = { id: makeId(), role: 'user', content, createdAt: Date.now() }
    const assistantId = makeId()
    const assistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      status: 'loading',
      mediaType: modeAtStart === 'text' ? null : modeAtStart,
      prompt: content,
      createdAt: Date.now(),
    }
    const previous = sourceChat.messages.filter((message) => message.status !== 'error')
    const history = [...previous, ...(appendUser ? [userMessage] : [])]
      .filter((message) => message.content && !message.mediaType)
      .map(({ role, content: messageContent }) => ({ role, content: messageContent }))
    const systemPrompt = String(settings.systemPrompt || '').trim()
    if (systemPrompt) {
      history.unshift({ role: 'system', content: systemPrompt })
    }

    const controller = new AbortController()
    abortRef.current = controller
    setPrompt('')
    setBusy(true)
    setStickToBottom(true)
    if (appendUser) addMessage(chatId, userMessage)
    addMessage(chatId, assistantMessage)

    try {
      if (modeAtStart === 'text') {
        let fullText = ''
        let frame = 0
        const flushText = () => {
          frame = 0
          updateMessage(chatId, assistantId, { content: fullText })
        }
        await api.streamChat({
          ...settings,
          model: sourceChat.model,
          messages: history,
          signal: controller.signal,
          onToken: (token) => {
            fullText += token
            if (!frame) frame = window.requestAnimationFrame(flushText)
          },
        })
        if (frame) window.cancelAnimationFrame(frame)
        updateMessage(chatId, assistantId, { content: fullText, status: 'done' })
      } else {
        const method = {
          image: api.generateImage,
          audio: api.generateAudio,
          video: api.generateVideo,
        }[modeAtStart]
        const url = await method({
          ...settings,
          model: sourceChat.model,
          prompt: content,
          signal: controller.signal,
        })
        updateMessage(chatId, assistantId, { url, status: 'done' })
      }
    } catch (error) {
      updateMessage(chatId, assistantId, {
        status: controller.signal.aborted ? 'cancelled' : 'error',
        error: controller.signal.aborted ? 'Generation stopped.' : error.message,
      })
    } finally {
      abortRef.current = null
      setBusy(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    const content = prompt.trim()
    if (!content || busy) return
    if (!settings.apiUrl) {
      setView('settings')
      return
    }
    if (!activeChat?.model) {
      await loadModels()
      return
    }
    await runRequest(content)
  }

  const retryMessage = (message) => {
    const promptToRetry = message.prompt
    if (!promptToRetry || !activeChat) return
    deleteMessage(activeChat.id, message.id)
    runRequest(promptToRetry, activeChat, { appendUser: false })
  }

  const stopGeneration = () => abortRef.current?.abort()

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
        <div className="header-controls">
          <label className="mode-select-wrap" title="Override detected model type">
            <ModeIcon size={15} />
            <select
              aria-label="Chat mode"
              value={mode}
              onChange={(event) => {
                const modelType = event.target.value
                if (activeChat?.id) updateChat(activeChat.id, { modelType })
                else createChat({ modelType })
              }}
            >
              {Object.entries(modeMeta).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
              ))}
            </select>
          </label>
          <button className="model-trigger" type="button" onClick={() => loadModels()} disabled={loadingModels}>
            <span>{loadingModels ? 'Loading models...' : activeChat?.model || 'Select model'}</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </header>

      {(modelError || storageWarning) && (
        <div className="notice-stack">
          {modelError && (
            <button className="connection-error" type="button" onClick={() => setView('settings')}>
              {modelError} · Open settings
            </button>
          )}
          {storageWarning && (
            <button className="storage-warning" type="button" onClick={() => setStorageWarning('')}>
              {storageWarning} · Dismiss
            </button>
          )}
        </div>
      )}

      <div
        className="messages"
        onScroll={(event) => {
          const element = event.currentTarget
          setStickToBottom(element.scrollHeight - element.scrollTop - element.clientHeight < 100)
        }}
      >
        {!activeChat || activeChat.messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-icon"><Sparkles size={29} /></div>
            <span className="eyebrow">WELCOME TO OMNICHAT</span>
            <h2>One app. Every medium.</h2>
            <p>Chat, illustrate, narrate, and create video through any OpenAI-compatible provider.</p>
            <div className="mode-pills" aria-label="Supported modes">
              {Object.entries(modeMeta).map(([key, item]) => {
                const Icon = item.icon
                return <span key={key}><Icon size={13} />{item.label}</span>
              })}
            </div>
            {!activeChat?.model && (
              <button className="primary-button" type="button" onClick={() => loadModels()}>
                Choose your model
              </button>
            )}
          </div>
        ) : (
          activeChat.messages.map((message) => (
            <Message
              message={message}
              key={message.id}
              onRetry={!busy && message.status === 'error' ? () => retryMessage(message) : null}
              onDelete={!busy ? () => deleteMessage(activeChat.id, message.id) : null}
            />
          ))
        )}
        <div ref={endRef} />
      </div>

      <form className="composer-wrap" onSubmit={submit}>
        <div className="composer">
          <textarea
            ref={textareaRef}
            rows="1"
            value={prompt}
            dir={detectTextDirection(prompt)}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder={meta.placeholder}
            aria-label="Message"
          />
          {busy ? (
            <button className="send-button stop-button" type="button" onClick={stopGeneration} aria-label="Stop generation">
              <Square size={15} fill="currentColor" />
            </button>
          ) : (
            <button className="send-button" type="submit" disabled={!prompt.trim()} aria-label="Send">
              <Send size={18} />
            </button>
          )}
        </div>
        <p>Enter to send · Shift + Enter for a new line</p>
      </form>

      {modelOpen && (
        <ModelSelector
          models={models}
          selected={activeChat?.model}
          onSelect={selectModel}
          onRefresh={() => {
            setModels([])
            setModelOpen(false)
            window.setTimeout(() => loadModels(true), 0)
          }}
          onClose={() => setModelOpen(false)}
        />
      )}
    </section>
  )
}

export default ChatArea
