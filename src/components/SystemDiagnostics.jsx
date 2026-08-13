import { useEffect, useMemo, useState } from 'react'
import { Check, Clipboard, Database, ShieldCheck, Wifi } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}

function SystemDiagnostics() {
  const { chats, models } = useApp()
  const [storage, setStorage] = useState({ usage: 0, quota: 0 })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    navigator.storage?.estimate?.().then((value) => {
      setStorage({ usage: value.usage || 0, quota: value.quota || 0 })
    }).catch(() => {})
  }, [chats])

  const diagnostics = useMemo(() => ({
    app: 'OmniChat',
    appVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    online: navigator.onLine,
    secureContext: window.isSecureContext,
    serviceWorker: 'serviceWorker' in navigator,
    serviceWorkerController: Boolean(navigator.serviceWorker?.controller),
    language: navigator.language,
    platform: navigator.userAgentData?.platform || navigator.platform || 'unknown',
    userAgent: navigator.userAgent,
    conversations: chats.length,
    loadedModels: models.length,
    storageUsage: storage.usage,
    storageQuota: storage.quota,
  }), [chats.length, models.length, storage])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="settings-card diagnostics-card">
      <div className="card-heading compact">
        <div>
          <h2>System diagnostics</h2>
          <p>Safe runtime information for troubleshooting. API credentials are never included.</p>
        </div>
      </div>
      <div className="diagnostic-grid">
        <div><Wifi size={16} /><span>Network</span><strong>{diagnostics.online ? 'Online' : 'Offline'}</strong></div>
        <div><ShieldCheck size={16} /><span>Secure context</span><strong>{diagnostics.secureContext ? 'Yes' : 'No'}</strong></div>
        <div><Database size={16} /><span>Storage used</span><strong>{formatBytes(storage.usage)}</strong></div>
        <div><Database size={16} /><span>Storage quota</span><strong>{formatBytes(storage.quota)}</strong></div>
      </div>
      <button className="secondary-button diagnostics-copy" type="button" onClick={copy}>
        {copied ? <Check size={16} /> : <Clipboard size={16} />}
        {copied ? 'Copied' : 'Copy diagnostics'}
      </button>
    </section>
  )
}

export default SystemDiagnostics
