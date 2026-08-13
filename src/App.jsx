import { AppProvider } from './contexts/AppContext'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import Settings from './components/Settings'
import ModelSelector from './components/ModelSelector'
import './styles/global.css'

export default function App() {
  return (
    <AppProvider>
      <div className="app">
        <Sidebar />
        <ChatArea />
        <Settings />
        <ModelSelector />
      </div>
    </AppProvider>
  )
}
