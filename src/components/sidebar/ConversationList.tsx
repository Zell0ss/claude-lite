'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { ConversationItem } from './ConversationItem'
import type { Conversation } from '@/lib/db/schema'

export function ConversationList() {
  const [convs, setConvs] = useState<Conversation[]>([])
  const pathname = usePathname()

  const load = useCallback(async () => {
    const res = await fetch('/api/conversations')
    if (res.ok) setConvs(await res.json())
  }, [])

  useEffect(() => {
    load()
  }, [load, pathname])

  const activeId = pathname.startsWith('/chat/')
    ? pathname.split('/chat/')[1]
    : null

  if (convs.length === 0) {
    return (
      <p className="text-foreground-subtle text-xs px-3 mt-4">
        No hay conversaciones todavía
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-0.5 px-2">
      {convs.map((c) => (
        <ConversationItem
          key={c.id}
          conversation={c}
          isActive={c.id === activeId}
          onUpdate={load}
        />
      ))}
    </div>
  )
}
