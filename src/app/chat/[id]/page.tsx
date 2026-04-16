import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { conversations, messages } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { ChatArea } from '@/components/chat/ChatArea'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params

  const conv = db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .get()

  if (!conv) notFound()

  const msgs = db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt))
    .all()

  return <ChatArea conversation={conv} initialMessages={msgs} />
}
