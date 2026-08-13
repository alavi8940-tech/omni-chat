import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, details) {
    console.error('OmniChat render error', error, details)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="fatal-error">
        <div className="fatal-error-icon"><AlertTriangle size={28} /></div>
        <span className="eyebrow">RECOVERY MODE</span>
        <h1>OmniChat hit an unexpected error.</h1>
        <p>Your conversations remain stored locally. Reload the app to recover.</p>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>
          <RefreshCw size={17} /> Reload OmniChat
        </button>
        <details>
          <summary>Technical details</summary>
          <code>{this.state.error.message}</code>
        </details>
      </main>
    )
  }
}

export default ErrorBoundary
