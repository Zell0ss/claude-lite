import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { conversations, messages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    conversation_id,
    model,
    system_prompt,
    messages: msgs,
  } = body as {
    conversation_id: string
    model: string
    system_prompt?: string
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  if (!conversation_id || !model || !msgs?.length) {
    return new Response('Missing required fields', { status: 400 })
  }

  const now = Date.now()

  // Auto-create conversation if it doesn't exist
  const existing = db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversation_id))
    .get()

  const lastUserMsg = msgs[msgs.length - 1]

  if (!existing) {
    const title = lastUserMsg.content.slice(0, 60)
    db.insert(conversations).values({
      id: conversation_id,
      title,
      model,
      systemPrompt: system_prompt ?? null,
      createdAt: now,
      updatedAt: now,
    }).run()
    db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId: conversation_id,
      role: 'user',
      content: lastUserMsg.content,
      createdAt: now,
    }).run()
  } else {
    // Save only the new user message (last in array)
    db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId: conversation_id,
      role: 'user',
      content: lastUserMsg.content,
      createdAt: now,
    }).run()
    db.update(conversations)
      .set({ updatedAt: now, model })
      .where(eq(conversations.id, conversation_id))
      .run()
  }

  const systemPromptText = existing?.systemPrompt ?? system_prompt

  const result = streamText({
    model: anthropic(model),
    system: systemPromptText ?? undefined,
    messages: msgs,
    onFinish: ({ text }) => {
      if (!text) return
      db.insert(messages).values({
        id: crypto.randomUUID(),
        conversationId: conversation_id,
        role: 'assistant',
        content: text,
        model,
        createdAt: Date.now(),
      }).run()
      db.update(conversations)
        .set({ updatedAt: Date.now() })
        .where(eq(conversations.id, conversation_id))
        .run()
    },
  })

  return result.toTextStreamResponse()
}
