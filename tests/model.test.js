import test from 'node:test'
import assert from 'node:assert/strict'
import { detectModelType, filterModels, normalizeModel } from '../src/utils/model.js'

test('detectModelType recognizes multimodal naming patterns', () => {
  assert.equal(detectModelType('gpt-4.1'), 'text')
  assert.equal(detectModelType('flux-pro-1.1'), 'image')
  assert.equal(detectModelType('dall-e-3'), 'image')
  assert.equal(detectModelType('tts-1-hd'), 'audio')
  assert.equal(detectModelType('whisper-large-v3'), 'audio')
  assert.equal(detectModelType('sora-2'), 'video')
  assert.equal(detectModelType('veo-3'), 'video')
})

test('normalizeModel rejects invalid entries and enriches valid entries', () => {
  assert.deepEqual(normalizeModel('flux-dev'), { id: 'flux-dev', type: 'image' })
  assert.equal(normalizeModel({ name: 'missing-id' }), null)
  assert.equal(normalizeModel(null), null)
})

test('filterModels filters by query/type and promotes favorites', () => {
  const models = [
    { id: 'gpt-4.1', type: 'text' },
    { id: 'flux-dev', type: 'image' },
    { id: 'dall-e-3', type: 'image' },
  ]
  assert.deepEqual(
    filterModels(models, '', 'image', ['flux-dev']).map((model) => model.id),
    ['flux-dev', 'dall-e-3'],
  )
  assert.deepEqual(filterModels(models, 'gpt').map((model) => model.id), ['gpt-4.1'])
})
