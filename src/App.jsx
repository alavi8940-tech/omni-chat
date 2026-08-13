import { useEffect, useState } from 'react'
import { Menu, Search } from 'lucide-react'
import { useApp } from './contexts/AppContext'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import Settings from './components/Settings'
import PromptLibrary from './components/PromptLibrary'
import Insights from './components/Insights'
import GlobalSearch from './components/GlobalSearch'
import MediaGallery from './components/MediaGallery'
import { useI18n } from './i18n'

function App() {
  const { view } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [searchOpen, setSearchOpen] = useState(false)
  const { language, direction, t } = useI18n()

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

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = direction
  }, [language, direction])

  useEffect(() => {
    const openSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', openSearch)
    return () => window.removeEventListener('keydown', openSearch)
  }, [])

  const renderView = () => {
    if (view === 'settings') return <Settings />
    if (view === 'prompts') return <PromptLibrary />
    if (view === 'insights') return <Insights />
    if (view === 'gallery') return <MediaGallery />
    return <ChatArea />
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-panel">
        {!online && <div className="offline-banner" role="status">{t('offline')}</div>}
        <button
          className="mobile-menu icon-button"
          type="button"
          aria-label="Open chat menu"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={21} />
        </button>
        <button className="global-search-button icon-button" type="button" onClick={() => setSearchOpen(true)} aria-label="Search all chats">
          <Search size={19} />
        </button>
        {renderView()}
      </main>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  )
}

export default App
