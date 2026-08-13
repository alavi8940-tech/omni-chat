import test from 'node:test'
import assert from 'node:assert/strict'
import {
  detectTextDirection,
  estimateTokens,
  formatRelativeTime,
  makeTitle,
  sanitizeFilename,
} from '../src/utils/text.js'

test('detectTextDirection recognizes Persian and English', () => {
  assert.equal(detectTextDirection('سلام دنیا'), 'rtl')
  assert.equal(detectTextDirection('Hello world'), 'ltr')
})

test('makeTitle trims whitespace and enforces a limit', () => {
  assert.equal(makeTitle('  Hello   world  '), 'Hello world')
  assert.equal(makeTitle('', 'Fallback'), 'Fallback')
  assert.equal(makeTitle('123456', 'Fallback', 4), '1234')
})

test('estimateTokens returns stable positive estimates', () => {
  assert.equal(estimateTokens(''), 0)
  assert.ok(estimateTokens('Hello world') >= 2)
  assert.ok(estimateTokens('سلام دنیا') >= 2)
})

test('formatRelativeTime handles recent ranges', () => {
  const now = Date.UTC(2026, 7, 13, 12)
  assert.equal(formatRelativeTime(now - 30_000, now), 'now')
  assert.equal(formatRelativeTime(now - 5 * 60_000, now), '5m')
  assert.equal(formatRelativeTime(now - 2 * 3_600_000, now), '2h')
})

test('sanitizeFilename removes unsafe filename characters', () => {
  assert.equal(sanitizeFilename('My / Chat: 01?'), 'My-Chat-01')
  assert.equal(sanitizeFilename(''), 'omnichat')
})
