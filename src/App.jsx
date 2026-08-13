import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { useApp } from './contexts/AppContext'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import Settings from './components/Settings'

function App() {
  const { view } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [view])

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-panel">
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
