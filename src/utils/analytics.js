import { estimateTokens } from './text.js'

export function calculateInsights(chats = []) {
  const result = {
    chats: chats.length,
    messages: 0,
    userMessages: 0,
    assistantMessages: 0,
    estimatedTokens: 0,
    generated: { image: 0, audio: 0, video: 0 },
    modes: { text: 0, image: 0, audio: 0, video: 0 },
    models: {},
    activity: {},
  }

  for (const chat of chats) {
    const mode = chat.modelType || 'text'
    result.modes[mode] = (result.modes[mode] || 0) + 1
    if (chat.model) result.models[chat.model] = (result.models[chat.model] || 0) + 1
    const day = new Date(chat.updatedAt || chat.createdAt || Date.now()).toISOString().slice(0, 10)
    result.activity[day] = (result.activity[day] || 0) + 1

    for (const message of chat.messages || []) {
      result.messages += 1
      if (message.role === 'user') result.userMessages += 1
      else result.assistantMessages += 1
      result.estimatedTokens += estimateTokens(message.content)
      if (message.mediaType && message.url) {
        result.generated[message.mediaType] = (result.generated[message.mediaType] || 0) + 1
      }
    }
  }

  result.topModels = Object.entries(result.models)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  result.recentActivity = Object.entries(result.activity)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
  return result
}
