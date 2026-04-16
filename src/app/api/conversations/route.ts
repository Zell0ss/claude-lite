import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { conversations } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  const rows = await db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt))
  return NextResponse.json(rows)
}
