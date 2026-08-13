import test from 'node:test'
import assert from 'node:assert/strict'
import { chatToMarkdown } from '../src/utils/export.js'

test('chatToMarkdown serializes conversation content and media', () => {
  const output = chatToMarkdown({
    title: 'Launch plan',
    model: 'gpt-4.1',
    modelType: 'text',
    messages: [
      { role: 'user', content: 'Create a plan.' },
      { role: 'assistant', content: 'Here is the plan.' },
      { role: 'assistant', prompt: 'A logo', mediaType: 'image', url: 'https://example.com/a.png' },
    ],
  })
  assert.match(output, /^# Launch plan/)
  assert.match(output, /## You/)
  assert.match(output, /Here is the plan/)
  assert.match(output, /\[Generated image\]/)
})
