import { useEffect, useState } from 'react'
import { CheckCircle2, Eye, EyeOff, Loader2, Save, Server, XCircle } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useApi } from '../hooks/useApi'

function Settings() {
  const { settings, setSettings, setModels } = useApp()
  const { testConnection } = useApi()
  const [apiUrl, setApiUrl] = useState(settings.apiUrl)
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(false)
    setResult(null)
  }, [apiUrl, apiKey])

  const normalizedUrl = () => apiUrl.trim().replace(/\/+$/, '')

  const save = (event) => {
    event.preventDefault()
    setSettings({ apiUrl: normalizedUrl(), apiKey: apiKey.trim() })
    setModels([])
    setSaved(true)
  }

  const test = async () => {
    setTesting(true)
    setResult(null)
    try {
      // Deliberately pass the current form values directly, so testing never uses stale context state.
      const count = await testConnection(normalizedUrl(), apiKey.trim())
      setResult({ ok: true, message: `Connected successfully. Found ${count} model${count === 1 ? '' : 's'}.` })
    } catch (error) {
      setResult({ ok: false, message: error.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <section className="settings-page">
      <div className="settings-container">
        <span className="eyebrow">CONFIGURATION</span>
        <h1>API settings</h1>
        <p className="settings-intro">
          Connect OmniChat to any OpenAI-compatible endpoint. Your credentials stay on this device.
        </p>

        <form className="settings-card" onSubmit={save}>
          <div className="card-heading">
            <div className="settings-icon"><Server size={20} /></div>
            <div>
              <h2>Provider connection</h2>
              <p>Enter the base URL without the <code>/v1</code> path.</p>
            </div>
          </div>

          <label className="field">
            <span>API URL</span>
            <input
              type="url"
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              placeholder="https://api.openai.com"
              autoComplete="url"
              required
            />
            <small>Trailing slashes are removed automatically.</small>
          </label>

          <label className="field">
            <span>API Key</span>
            <div className="password-field">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                required
              />
              <button type="button" className="icon-button" onClick={() => setShowKey((value) => !value)} aria-label={showKey ? 'Hide API key' : 'Show API key'}>
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {result && (
            <div className={`test-result ${result.ok ? 'success' : 'failure'}`}>
              {result.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {result.message}
            </div>
          )}

          <div className="settings-actions">
            <button className="secondary-button" type="button" onClick={test} disabled={testing}>
              {testing ? <Loader2 className="spin" size={17} /> : <Server size={17} />}
              {testing ? 'Testing...' : 'Test connection'}
            </button>
            <button className="primary-button" type="submit">
              {saved ? <CheckCircle2 size={17} /> : <Save size={17} />}
              {saved ? 'Saved' : 'Save settings'}
            </button>
          </div>
        </form>

        <div className="privacy-note">
          <strong>Stored locally</strong>
          <span>Settings and conversations are saved in your browser’s LocalStorage.</span>
        </div>
      </div>
    </section>
  )
}

export default Settings
