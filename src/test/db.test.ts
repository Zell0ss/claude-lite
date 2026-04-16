import { describe, it, expect } from 'vitest'
import { conversations, messages } from '@/lib/db/schema'

describe('DB schema', () => {
  it('conversations table has required columns', () => {
    const cols = Object.keys(conversations)
    expect(cols).toContain('id')
    expect(cols).toContain('title')
    expect(cols).toContain('model')
    expect(cols).toContain('systemPrompt')
    expect(cols).toContain('createdAt')
    expect(cols).toContain('updatedAt')
  })

  it('messages table has required columns', () => {
    const cols = Object.keys(messages)
    expect(cols).toContain('id')
    expect(cols).toContain('conversationId')
    expect(cols).toContain('role')
    expect(cols).toContain('content')
    expect(cols).toContain('model')
    expect(cols).toContain('createdAt')
  })
})
