import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_SETTINGS,
  normalizeChat,
  normalizeCustomPrompts,
  normalizeProviderProfiles,
  normalizeSettings,
} from '../src/utils/schema.js'

test('normalizeSettings clamps numeric fields and repairs types', () => {
  const value = normalizeSettings({
    apiUrl: 42,
    language: 'fa',
    temperature: 99,
    maxContextMessages: 0,
  })
  assert.equal(value.apiUrl, '')
  assert.equal(value.language, 'fa')
  assert.equal(value.temperature, 2)
  assert.equal(value.maxContextMessages, 2)
  assert.equal(normalizeSettings(null).voice, DEFAULT_SETTINGS.voice)
})

test('normalizeChat migrates incomplete chats safely', () => {
  const chat = normalizeChat({
    title: 99,
    model: 'flux-dev',
    tags: [' art ', 'art', null],
    messages: [{ role: 'user', content: 'hello' }, null],
  })
  assert.equal(chat.title, 'Imported conversation')
  assert.equal(chat.modelType, 'image')
  assert.deepEqual(chat.tags, ['art'])
  assert.equal(chat.messages.length, 1)
  assert.equal(chat.messages[0].role, 'user')
})

test('provider and prompt normalization rejects unusable records', () => {
  assert.equal(normalizeProviderProfiles([{ name: 'Missing URL' }]).length, 0)
  assert.equal(normalizeProviderProfiles([{ apiUrl: ' https://api.example ' }])[0].apiUrl, 'https://api.example')
  assert.equal(normalizeCustomPrompts([{ prompt: '' }, { prompt: 'Use me' }]).length, 1)
})
