import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateInsights } from '../src/utils/analytics.js'

test('calculateInsights aggregates chats, messages, models, and media', () => {
  const insights = calculateInsights([
    {
      model: 'gpt-4.1',
      modelType: 'text',
      updatedAt: Date.UTC(2026, 7, 13),
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
    },
    {
      model: 'flux-dev',
      modelType: 'image',
      updatedAt: Date.UTC(2026, 7, 13),
      messages: [
        { role: 'user', content: 'A mountain' },
        { role: 'assistant', mediaType: 'image', url: 'data:image/png;base64,a' },
      ],
    },
  ])
  assert.equal(insights.chats, 2)
  assert.equal(insights.messages, 4)
  assert.equal(insights.userMessages, 2)
  assert.equal(insights.assistantMessages, 2)
  assert.equal(insights.generated.image, 1)
  assert.deepEqual(insights.topModels[0], ['gpt-4.1', 1])
})
