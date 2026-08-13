import { useApp } from '../contexts/AppContext'
import { useApi } from '../hooks/useApi'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Settings() {
  const { state, dispatch } = useApp()
  const { fetchModels } = useApi()
  const [apiUrl, setApiUrl] = useState(state.settings.apiUrl)
  const [apiKey, setApiKey] = useState(state.settings.apiKey)
  const [testing, setTesting] = useState(false)
  const [modelCount, setModelCount] = useState(0)

  useEffect(() => {
    setApiUrl(state.settings.apiUrl)
    setApiKey(state.settings.apiKey)
  }, [state.settings.apiUrl, state.settings.apiKey])

  function save() {
    dispatch({ type: 'SET_SETTINGS', payload: { apiUrl: apiUrl.trim(), apiKey: apiKey.trim() } })
    dispatch({ type: 'TOGGLE_SETTINGS' })
  }

  async function testConnection() {
    setTesting(true)
    setModelCount(0)
    dispatch({ type: 'SET_SETTINGS', payload: { apiUrl: apiUrl.trim(), apiKey: apiKey.trim() } })
    const models = await fetchModels(apiUrl.trim(), apiKey.trim())
    if (models) setModelCount(models.length)
    setTesting(false)
  }

  if (!state.showSettings) return null

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <button className="back-btn" onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}>
          <ArrowLeft size={20} />
        </button>
        <h2>Settings</h2>
      </div>
      <div className="settings-body">
        <div className="settings-section">
          <h3>API Configuration</h3>
          <div className="settings-field">
            <label>API Base URL</label>
            <input
              type="url"
              placeholder="https://api.openai.com"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
            />
            <div className="hint">OpenAI-compatible base URL (without /v1)</div>
          </div>
          <div className="settings-field">
            <label>API Key</label>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <div className="hint">Your API key for authentication</div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Connection</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 16 }}>
            <div className={`status-dot ${state.connected ? 'connected' : 'disconnected'}`} />
            <span style={{ fontSize: 13, color: state.connected ? 'var(--success)' : 'var(--error)' }}>
              {state.connected ? `Connected (${modelCount} models)` : 'Disconnected'}
            </span>
          </div>
          <button
            className="save-btn"
            onClick={testConnection}
            disabled={testing || !apiUrl}
            style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <RefreshCw size={16} className={testing ? 'spinning' : ''} />
            {testing ? 'Testing...' : 'Test Connection & Fetch Models'}
          </button>
        </div>

        <div className="settings-section">
          <h3>About</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            OmniChat supports text, image, video, and audio models via any OpenAI-compatible API.
            Models are auto-detected by their name patterns.
          </p>
        </div>

        <button className="save-btn" onClick={save}>Save Settings</button>
      </div>
    </div>
  )
}
