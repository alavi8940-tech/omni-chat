import { useMemo } from 'react'
import { BarChart3, Bot, Image, MessageSquare, Sparkles } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { calculateInsights } from '../utils/analytics'

function Insights() {
  const { chats } = useApp()
  const insights = useMemo(() => calculateInsights(chats), [chats])
  const maxActivity = Math.max(1, ...insights.recentActivity.map(([, count]) => count))

  return (
    <section className="tool-page">
      <div className="tool-container">
        <div className="tool-hero">
          <div>
            <span className="eyebrow">LOCAL INSIGHTS</span>
            <h1>Your creative footprint.</h1>
            <p>Private usage statistics calculated entirely from conversations stored on this device.</p>
          </div>
        </div>

        <div className="stat-grid">
          <article className="stat-card"><MessageSquare size={19} /><strong>{insights.chats}</strong><span>Conversations</span></article>
          <article className="stat-card"><Bot size={19} /><strong>{insights.messages}</strong><span>Messages</span></article>
          <article className="stat-card"><Sparkles size={19} /><strong>{insights.estimatedTokens.toLocaleString()}</strong><span>Estimated tokens</span></article>
          <article className="stat-card"><Image size={19} /><strong>{Object.values(insights.generated).reduce((sum, value) => sum + value, 0)}</strong><span>Media outputs</span></article>
        </div>

        <div className="insight-grid">
          <section className="insight-card">
            <div className="insight-heading"><BarChart3 size={18} /><h2>Recent activity</h2></div>
            {insights.recentActivity.length ? (
              <div className="activity-chart">
                {insights.recentActivity.map(([day, count]) => (
                  <div className="activity-column" key={day} title={`${day}: ${count}`}>
                    <span style={{ height: `${Math.max(8, (count / maxActivity) * 100)}%` }} />
                    <small>{day.slice(5)}</small>
                  </div>
                ))}
              </div>
            ) : <p className="empty-list">Start a conversation to see activity.</p>}
          </section>

          <section className="insight-card">
            <div className="insight-heading"><Bot size={18} /><h2>Most used models</h2></div>
            <div className="ranking-list">
              {insights.topModels.map(([model, count], index) => (
                <div key={model}><span>{index + 1}</span><strong>{model}</strong><small>{count} chat{count === 1 ? '' : 's'}</small></div>
              ))}
              {!insights.topModels.length && <p className="empty-list">No model usage yet.</p>}
            </div>
          </section>

          <section className="insight-card">
            <div className="insight-heading"><Sparkles size={18} /><h2>Modes</h2></div>
            <div className="mode-breakdown">
              {Object.entries(insights.modes).map(([mode, count]) => {
                const percent = insights.chats ? Math.round((count / insights.chats) * 100) : 0
                return (
                  <div key={mode}>
                    <div><span>{mode}</span><small>{count} · {percent}%</small></div>
                    <progress value={count} max={Math.max(1, insights.chats)} />
                  </div>
                )
              })}
            </div>
          </section>

          <section className="insight-card">
            <div className="insight-heading"><MessageSquare size={18} /><h2>Conversation balance</h2></div>
            <div className="balance-display">
              <div><strong>{insights.userMessages}</strong><span>Your messages</span></div>
              <div><strong>{insights.assistantMessages}</strong><span>AI messages</span></div>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default Insights
