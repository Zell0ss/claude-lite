import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { conversations } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    db.select({ count: sql<number>`count(*)` }).from(conversations).get()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
