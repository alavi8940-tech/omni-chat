import { sanitizeFilename } from './text.js'

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadJson(data, filename) {
  downloadBlob(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }),
    filename,
  )
}

export function chatToMarkdown(chat) {
  const lines = [
    `# ${chat.title}`,
    '',
    `- Model: ${chat.model || 'Not selected'}`,
    `- Mode: ${chat.modelType || 'text'}`,
    `- Exported: ${new Date().toISOString()}`,
    '',
  ]
  for (const message of chat.messages || []) {
    lines.push(`## ${message.role === 'user' ? 'You' : 'OmniChat'}`, '')
    if (message.content) lines.push(message.content, '')
    if (message.prompt && !message.content) lines.push(`Prompt: ${message.prompt}`, '')
    if (message.url) lines.push(`[Generated ${message.mediaType || 'media'}](${message.url})`, '')
    if (message.error) lines.push(`> Error: ${message.error}`, '')
  }
  return lines.join('\n')
}

export function exportChatMarkdown(chat) {
  downloadBlob(
    new Blob([chatToMarkdown(chat)], { type: 'text/markdown;charset=utf-8' }),
    `${sanitizeFilename(chat.title)}.md`,
  )
}
