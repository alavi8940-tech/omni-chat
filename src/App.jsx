import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { useApp } from './contexts/AppContext'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import Settings from './components/Settings'

function App() {
  const { view } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    setSidebarOpen(false)
  }, [view])

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-panel">
        {!online && <div className="offline-banner" role="status">You’re offline. Saved chats are still available.</div>}
        <button
          className="mobile-menu icon-button"
          type="button"
          aria-label="Open chat menu"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={21} />
        </button>
        {view === 'settings' ? <Settings /> : <ChatArea />}
      </main>
    </div>
  )
}

export default App
