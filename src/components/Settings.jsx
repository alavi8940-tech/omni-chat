import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Server,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import { defaultSettings, useApp } from '../contexts/AppContext'
import { cleanApiUrl, useApi } from '../hooks/useApi'

const voices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer']
const imageSizes = ['1024x1024', '1792x1024', '1024x1792']

function Settings() {
  const {
    settings,
    setSettings,
    chats,
    clearChats,
    importData,
    setModels,
  } = useApp()
  const { testConnection } = useApi()
  const [form, setForm] = useState(settings)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)
  const [includeKey, setIncludeKey] = useState(false)
  const importRef = useRef(null)
  const testAbortRef = useRef(null)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  useEffect(() => () => testAbortRef.current?.abort(), [])

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setSaved(false)
    setResult(null)
  }

  const normalizedSettings = () => ({
    ...defaultSettings,
    ...form,
    apiUrl: cleanApiUrl(form.apiUrl),
    apiKey: form.apiKey.trim(),
    temperature: Number.isFinite(Number(form.temperature))
      ? Math.min(2, Math.max(0, Number(form.temperature)))
      : defaultSettings.temperature,
  })

  const save = (event) => {
    event.preventDefault()
    setSettings(normalizedSettings())
    setModels([])
    setSaved(true)
  }

  const test = async () => {
    testAbortRef.current?.abort()
    const controller = new AbortController()
    testAbortRef.current = controller
    setTesting(true)
    setResult(null)
    try {
      // Pass current form values directly so testing never reads stale context state.
      const count = await testConnection(
        cleanApiUrl(form.apiUrl),
        form.apiKey.trim(),
        controller.signal,
      )
      setResult({
        ok: true,
        message: `Connected successfully. Found ${count} model${count === 1 ? '' : 's'}.`,
      })
    } catch (error) {
      if (!controller.signal.aborted) setResult({ ok: false, message: error.message })
    } finally {
      if (testAbortRef.current === controller) {
        testAbortRef.current = null
        setTesting(false)
      }
    }
  }

  const exportBackup = () => {
    const safeSettings = { ...settings, apiKey: includeKey ? settings.apiKey : '' }
    const payload = {
      app: 'OmniChat',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: safeSettings,
      chats,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `omnichat-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const importBackup = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('Backup file is larger than 20 MB.')
      const payload = JSON.parse(await file.text())
      if (!window.confirm('Import this backup? Existing conversations will be replaced.')) return
      importData(payload)
      setModels([])
      setResult({ ok: true, message: 'Backup imported successfully.' })
    } catch (error) {
      setResult({ ok: false, message: error.message || 'Could not import this backup.' })
    }
  }

  const eraseChats = () => {
    if (window.confirm('Delete every conversation on this device? This cannot be undone.')) {
      clearChats()
      setResult({ ok: true, message: 'All conversations were deleted.' })
    }
  }

  return (
    <section className="settings-page">
      <div className="settings-container">
        <span className="eyebrow">CONFIGURATION</span>
        <h1>Control center</h1>
        <p className="settings-intro">
          Connect any OpenAI-compatible provider and fine-tune how OmniChat creates.
        </p>

        <form onSubmit={save}>
          <section className="settings-card">
            <div className="card-heading">
              <div className="settings-icon"><Server size={20} /></div>
              <div>
                <h2>Provider connection</h2>
                <p>Use a base URL with or without the <code>/v1</code> suffix.</p>
              </div>
            </div>

            <label className="field">
              <span>API URL</span>
              <input
                type="url"
                value={form.apiUrl}
                onChange={(event) => updateField('apiUrl', event.target.value)}
                placeholder="https://api.openai.com"
                inputMode="url"
                autoCapitalize="none"
                spellCheck="false"
                autoComplete="url"
                required
              />
              <small>Trailing slashes and a final /v1 are normalized automatically.</small>
            </label>

            <label className="field">
              <span>API Key</span>
              <div className="password-field">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={form.apiKey}
                  onChange={(event) => updateField('apiKey', event.target.value)}
                  placeholder="sk-..."
                  autoCapitalize="none"
                  spellCheck="false"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowKey((value) => !value)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <small>Some local providers do not require a key; the field may be left empty.</small>
            </label>

            <div className="security-strip">
              <ShieldCheck size={17} />
              Credentials are stored locally and sent only to the API URL you enter.
            </div>
          </section>

          <section className="settings-card">
            <div className="card-heading compact">
              <div>
                <h2>Generation defaults</h2>
                <p>These options apply to new requests.</p>
              </div>
            </div>

            <label className="field">
              <span>System prompt</span>
              <textarea
                rows="4"
                value={form.systemPrompt}
                onChange={(event) => updateField('systemPrompt', event.target.value)}
                placeholder="Tell the assistant how to behave..."
              />
            </label>

            <div className="settings-grid">
              <label className="field">
                <span>Temperature: {Number(form.temperature).toFixed(1)}</span>
                <input
                  className="range-input"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={form.temperature}
                  onChange={(event) => updateField('temperature', event.target.value)}
                />
                <small>Lower is focused; higher is more creative.</small>
              </label>

              <label className="field">
                <span>Speech voice</span>
                <select value={form.voice} onChange={(event) => updateField('voice', event.target.value)}>
                  {voices.map((voice) => <option key={voice}>{voice}</option>)}
                </select>
              </label>

              <label className="field">
                <span>Image size</span>
                <select value={form.imageSize} onChange={(event) => updateField('imageSize', event.target.value)}>
                  {imageSizes.map((size) => <option key={size}>{size}</option>)}
                </select>
              </label>
            </div>
          </section>

          {result && (
            <div className={`test-result ${result.ok ? 'success' : 'failure'}`} role="status">
              {result.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {result.message}
            </div>
          )}

          <div className="settings-actions sticky-actions">
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

        <section className="settings-card data-card">
          <div className="card-heading compact">
            <div>
              <h2>Data & backups</h2>
              <p>{chats.length} conversation{chats.length === 1 ? '' : 's'} stored on this device.</p>
            </div>
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={includeKey}
              onChange={(event) => setIncludeKey(event.target.checked)}
            />
            Include API key in exported backup
          </label>

          <div className="data-actions">
            <button className="secondary-button" type="button" onClick={exportBackup}>
              <Download size={17} /> Export backup
            </button>
            <button className="secondary-button" type="button" onClick={() => importRef.current?.click()}>
              <Upload size={17} /> Import backup
            </button>
            <button className="danger-button" type="button" onClick={eraseChats} disabled={!chats.length}>
              <Trash2 size={17} /> Delete all chats
            </button>
            <input
              ref={importRef}
              className="visually-hidden"
              type="file"
              accept="application/json,.json"
              onChange={importBackup}
            />
          </div>
        </section>

        <div className="privacy-note">
          <strong>Local-first by design</strong>
          <span>OmniChat has no analytics server and no account system. Browser storage can still be cleared by the OS, so export regular backups.</span>
        </div>
      </div>
    </section>
  )
}

export default Settings
