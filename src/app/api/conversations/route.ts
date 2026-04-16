import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { conversations } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export function GET() {
  const rows = db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt))
    .all()
  return NextResponse.json(rows)
}
