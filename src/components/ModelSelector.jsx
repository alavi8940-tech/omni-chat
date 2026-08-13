import { useEffect, useMemo, useState } from 'react'
import { Check, RefreshCw, Search, Star, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { detectModelType, filterModels } from '../utils/model'

const labels = {
  all: 'All',
  text: 'Text',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
}

function ModelSelector({ models, selected, onSelect, onRefresh, onClose }) {
  const { favoriteModels, toggleFavoriteModel } = useApp()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [manualModel, setManualModel] = useState('')
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
  const filtered = useMemo(
    () => filterModels(models, query, filter, favoriteModels),
    [models, query, filter, favoriteModels],
  )

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
              <div
                className={`model-option ${selected === model.id ? 'selected' : ''}`}
                key={model.id}
              >
                <button
                  className="model-select-button"
                  type="button"
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
                <button
                  type="button"
                  className={`favorite-model ${favoriteModels.includes(model.id) ? 'active' : ''}`}
                  onClick={() => toggleFavoriteModel(model.id)}
                  aria-label={`${favoriteModels.includes(model.id) ? 'Remove' : 'Add'} ${model.id} ${favoriteModels.includes(model.id) ? 'from' : 'to'} favorites`}
                >
                  <Star size={15} fill={favoriteModels.includes(model.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            )
          })}
          {filtered.length === 0 && <p className="modal-empty">No matching models found.</p>}
        </div>
        <form
          className="manual-model-form"
          onSubmit={(event) => {
            event.preventDefault()
            const model = manualModel.trim()
            if (!model) return
            onSelect(model, detectModelType(model))
            onClose()
          }}
        >
          <input value={manualModel} onChange={(event) => setManualModel(event.target.value)} placeholder="Or enter a model ID manually" />
          <button type="submit" disabled={!manualModel.trim()}>Use model</button>
        </form>
      </section>
    </div>
  )
}

export default ModelSelector
