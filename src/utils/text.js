export function detectTextDirection(value = '') {
  return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(String(value)) ? 'rtl' : 'ltr'
}

export function makeId() {
  return globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function makeTitle(value = '', fallback = 'New conversation', maxLength = 42) {
  const title = String(value).replace(/\s+/g, ' ').trim()
  return title ? title.slice(0, maxLength) : fallback
}

export function estimateTokens(value = '') {
  const text = String(value).trim()
  if (!text) return 0
  const latin = (text.match(/[A-Za-z0-9]+/g) || []).length
  const nonLatin = (text.match(/[\u0600-\u06ff\u4e00-\u9fff\u3040-\u30ff]/g) || []).length
  const punctuation = (text.match(/[^\s\p{L}\p{N}]/gu) || []).length
  return Math.max(1, Math.ceil(latin * 1.3 + nonLatin * 0.8 + punctuation * 0.25))
}

export function formatRelativeTime(timestamp, now = Date.now()) {
  const delta = Math.max(0, now - Number(timestamp || 0))
  const minutes = Math.floor(delta / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(timestamp).toLocaleDateString()
}

export function sanitizeFilename(value = 'omnichat') {
  return String(value)
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\-_ ]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'omnichat'
}
