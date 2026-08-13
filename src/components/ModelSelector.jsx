import { useEffect, useMemo, useState } from 'react'
import { Check, RefreshCw, Search, X } from 'lucide-react'
import { detectModelType } from '../contexts/AppContext'

const labels = {
  all: 'All',
  text: 'Text',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
}

function ModelSelector({ models, selected, onSelect, onRefresh, onClose }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const counts = useMemo(
    () =>
      models.reduce(
        (result, model) => {
          result.all += 1
          result[detectModelType(model.id)] += 1
          return result
        },
        { all: 0, text: 0, image: 0, audio: 0, video: 0 },
      ),
    [models],
  )
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return models.filter((model) => {
      const matchesType = filter === 'all' || detectModelType(model.id) === filter
      return matchesType && model.id.toLowerCase().includes(normalizedQuery)
    })
  }, [models, query, filter])

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="model-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="model-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">MODEL LIBRARY</span>
            <h2 id="model-title">Choose a model</h2>
          </div>
          <div className="modal-tools">
            <button className="icon-button" type="button" onClick={onRefresh} aria-label="Refresh models">
              <RefreshCw size={18} />
            </button>
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close model selector">
              <X size={20} />
            </button>
          </div>
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

        <div className="model-filters" role="tablist" aria-label="Filter model type">
          {Object.entries(labels).map(([type, label]) => (
            <button
              key={type}
              type="button"
              className={filter === type ? 'active' : ''}
              onClick={() => setFilter(type)}
            >
              {label} <span>{counts[type]}</span>
            </button>
          ))}
        </div>

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
          {filtered.length === 0 && <p className="modal-empty">No matching models found.</p>}
        </div>
      </section>
    </div>
  )
}

export default ModelSelector
