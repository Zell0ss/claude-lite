import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { conversations, messages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { MODELS } from '@/lib/models'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function extractText(msg: UIMessage): string {
  for (const part of msg.parts) {
    if (part.type === 'text') return part.text
  }
  return ''
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY not configured', { status: 500 })
  }

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
    messages: UIMessage[]
  }

  if (!conversation_id || !model || !msgs?.length) {
    return new Response('Missing required fields', { status: 400 })
  }

  const validModel = MODELS.find((m) => m.id === model)
  if (!validModel) {
    return new Response('Invalid model', { status: 400 })
  }

  const now = Date.now()

  const existing = db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversation_id))
    .get()

  const lastUserMsg = msgs[msgs.length - 1]
  const lastUserText = extractText(lastUserMsg)

  if (!existing) {
    db.insert(conversations).values({
      id: conversation_id,
      title: lastUserText.slice(0, 60),
      model,
      systemPrompt: system_prompt ?? null,
      createdAt: now,
      updatedAt: now,
    }).run()
  } else {
    db.update(conversations)
      .set({ updatedAt: now, model })
      .where(eq(conversations.id, conversation_id))
      .run()
  }

  db.insert(messages).values({
    id: crypto.randomUUID(),
    conversationId: conversation_id,
    role: 'user',
    content: lastUserText,
    createdAt: now,
  }).run()

  const systemPromptText = existing?.systemPrompt ?? system_prompt

  const result = streamText({
    model: anthropic(model),
    system: systemPromptText ?? undefined,
    messages: await convertToModelMessages(msgs),
    onFinish: ({ text }) => {
      if (!text) return
      try {
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
      } catch (err) {
        console.error('[chat] Failed to persist assistant message:', err)
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
