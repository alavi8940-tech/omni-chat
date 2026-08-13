import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanApiUrl, isSafeMediaUrl } from '../src/hooks/useApi.js'

test('cleanApiUrl removes trailing slashes and a final v1 path', () => {
  assert.equal(cleanApiUrl('https://api.example.com///'), 'https://api.example.com')
  assert.equal(cleanApiUrl('https://api.example.com/v1'), 'https://api.example.com')
  assert.equal(cleanApiUrl(' https://api.example.com/base/v1/ '), 'https://api.example.com/base')
  assert.equal(cleanApiUrl(null), '')
})

test('isSafeMediaUrl blocks executable URL schemes', () => {
  globalThis.window = { location: { origin: 'https://omnichat.example' } }
  assert.equal(isSafeMediaUrl('https://cdn.example/image.png'), true)
  assert.equal(isSafeMediaUrl('data:image/png;base64,a'), true)
  assert.equal(isSafeMediaUrl('javascript:alert(1)'), false)
  assert.equal(isSafeMediaUrl('file:///etc/passwd'), false)
  delete globalThis.window
})
