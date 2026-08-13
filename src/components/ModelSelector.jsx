import { useMemo, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { detectModelType } from '../contexts/AppContext'

const labels = {
  text: 'Text',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
}

function ModelSelector({ models, selected, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => models.filter((model) => model.id.toLowerCase().includes(query.trim().toLowerCase())),
    [models, query],
  )

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="model-modal" role="dialog" aria-modal="true" aria-labelledby="model-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">MODEL LIBRARY</span>
            <h2 id="model-title">Choose a model</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close model selector">
            <X size={20} />
          </button>
        </div>

        <label className="search-field">
          <Search size={18} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search models..."
          />
        </label>

        <div className="model-list">
          {filtered.map((model) => {
            const type = detectModelType(model.id)
            return (
              <button
                className={`model-option ${selected === model.id ? 'selected' : ''}`}
                type="button"
                key={model.id}
                onClick={() => {
                  onSelect(model.id, type)
                  onClose()
                }}
              >
                <span className={`type-icon ${type}`}>{labels[type][0]}</span>
                <span className="model-name">
                  <strong>{model.id}</strong>
                  <small>{labels[type]} model</small>
                </span>
                {selected === model.id && <Check size={18} />}
              </button>
            )
          })}
          {filtered.length === 0 && <p className="modal-empty">No models found.</p>}
        </div>
      </section>
    </div>
  )
}

export default ModelSelector
