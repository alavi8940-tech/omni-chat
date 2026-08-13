import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

function PwaInstall() {
  const [event, setEvent] = useState(null)

  useEffect(() => {
    const capture = (installEvent) => {
      installEvent.preventDefault()
      setEvent(installEvent)
    }
    const clear = () => setEvent(null)
    window.addEventListener('beforeinstallprompt', capture)
    window.addEventListener('appinstalled', clear)
    return () => {
      window.removeEventListener('beforeinstallprompt', capture)
      window.removeEventListener('appinstalled', clear)
    }
  }, [])

  if (!event) return null

  return (
    <button
      className="install-button"
      type="button"
      onClick={async () => {
        await event.prompt()
        await event.userChoice
        setEvent(null)
      }}
    >
      <Download size={16} /> Install OmniChat
    </button>
  )
}

export default PwaInstall
