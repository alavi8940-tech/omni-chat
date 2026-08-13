import { useApp } from '../contexts/AppContext'
import { X, Search } from 'lucide-react'
import { useState } from 'react'

export default function ModelSelector() {
  const { state, dispatch } = useApp()
  const [search, setSearch] = useState('')

  if (!state.showModelSelector) return null

  const filtered = state.models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  function selectModel(model) {
    const chatState = {
      modelId: model.id,
      modelName: model.name,
      modelType: model.type,
      title: model.name,
    }
    dispatch({ type: 'CREATE_CHAT', payload: chatState })
    dispatch({ type: 'TOGGLE_MODEL_SELECTOR' })
    setSearch('')
  }

  function getTypeIcon(type) {
    switch (type) {
      case 'image': return '🖼️'
      case 'video': return '🎬'
      case 'audio': return '🎵'
      default: return '💬'
    }
  }

  return (
    <div className="modal-overlay" onClick={() => dispatch({ type: 'TOGGLE_MODEL_SELECTOR' })}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Model</h2>
          <button className="back-btn" onClick={() => dispatch({ type: 'TOGGLE_MODEL_SELECTOR' })}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-search">
          <input
            type="text"
            placeholder="Search models..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-body">
          {filtered.length === 0 ? (
            <div className="empty-chats">
              {state.models.length === 0
                ? 'No models found. Configure your API in Settings first.'
                : 'No models match your search.'}
            </div>
          ) : (
            filtered.map(model => (
              <div key={model.id} className="model-item" onClick={() => selectModel(model)}>
                <div className="model-icon">{getTypeIcon(model.type)}</div>
                <div className="model-info">
                  <div className="model-name">{model.name}</div>
                  <div className="model-desc">{model.type} model</div>
                </div>
                <span className={`model-type ${model.type}`}>{model.type}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
