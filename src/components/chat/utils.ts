import type { UIMessage } from 'ai'

export function getTextContent(msg: UIMessage): string {
  for (const part of msg.parts) {
    if (part.type === 'text') return part.text
  }
  return ''
}
