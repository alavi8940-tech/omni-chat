import { useMemo, useState } from 'react'
import { BookOpen, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import { builtInPrompts } from '../data/prompts'
import { useApp } from '../contexts/AppContext'

function PromptLibrary() {
  const { customPrompts, addCustomPrompt, deleteCustomPrompt, setDraft, setView } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Custom', description: '', prompt: '' })
  const allPrompts = useMemo(() => [...customPrompts, ...builtInPrompts], [customPrompts])
  const categories = useMemo(
    () => ['All', ...new Set(allPrompts.map((item) => item.category))],
    [allPrompts],
  )
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return allPrompts.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category
      const haystack = `${item.title} ${item.description} ${item.prompt}`.toLowerCase()
      return matchesCategory && haystack.includes(needle)
    })
  }, [allPrompts, category, query])

  const usePrompt = (prompt) => {
    setDraft(prompt.prompt)
    setView('chat')
  }

  const submit = (event) => {
    event.preventDefault()
    addCustomPrompt(form)
    setForm({ title: '', category: 'Custom', description: '', prompt: '' })
    setCreating(false)
  }

  return (
    <section className="tool-page">
      <div className="tool-container">
        <div className="tool-hero">
          <div>
            <span className="eyebrow">PROMPT STUDIO</span>
            <h1>Start with a better prompt.</h1>
            <p>Reusable, editable starting points for writing, development, imagery, learning, and video.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => setCreating((value) => !value)}>
            <Plus size={17} /> New prompt
          </button>
        </div>

        {creating && (
          <form className="prompt-editor" onSubmit={submit}>
            <div className="prompt-editor-grid">
              <label className="field">
                <span>Title</span>
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>
              <label className="field">
                <span>Category</span>
                <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              </label>
            </div>
            <label className="field">
              <span>Description</span>
              <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <label className="field">
              <span>Prompt</span>
              <textarea required rows="5" value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} />
            </label>
            <div className="settings-actions">
              <button className="secondary-button" type="button" onClick={() => setCreating(false)}>Cancel</button>
              <button className="primary-button" type="submit"><Sparkles size={16} /> Save prompt</button>
            </div>
          </form>
        )}

        <div className="library-controls">
          <label className="search-field">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your prompt library..." />
          </label>
          <div className="model-filters">
            {categories.map((item) => (
              <button key={item} type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="prompt-grid">
          {visible.map((item) => (
            <article className="prompt-card" key={item.id}>
              <div className="prompt-card-top">
                <span className="prompt-category">{item.category}</span>
                {item.custom && (
                  <button className="message-action danger" type="button" onClick={() => deleteCustomPrompt(item.id)} aria-label={`Delete ${item.title}`}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="prompt-card-icon"><BookOpen size={19} /></div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <pre>{item.prompt}</pre>
              <button className="secondary-button" type="button" onClick={() => usePrompt(item)}>
                Use prompt
              </button>
            </article>
          ))}
        </div>
        {!visible.length && <div className="empty-state">No prompts match your search.</div>}
      </div>
    </section>
  )
}

export default PromptLibrary
