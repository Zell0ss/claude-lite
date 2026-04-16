import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { conversations, messages } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { MODELS } from '@/lib/models'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const conv = db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .get()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const msgs = db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt))
    .all()

  return NextResponse.json({ ...conv, messages: msgs })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const update: Record<string, unknown> = { updatedAt: Date.now() }
  if (typeof body.title === 'string') update.title = body.title.slice(0, 100)
  if (typeof body.model === 'string') {
    if (!MODELS.some((m) => m.id === body.model)) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 })
    }
    update.model = body.model
  }

  db.update(conversations)
    .set(update)
    .where(eq(conversations.id, id))
    .run()

  const updated = db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .get()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  db.delete(conversations).where(eq(conversations.id, id)).run()
  return NextResponse.json({ ok: true })
}
