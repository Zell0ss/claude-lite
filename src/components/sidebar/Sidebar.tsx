'use client'

import { useRouter } from 'next/navigation'
import { CirclePlus } from 'lucide-react'
import { ConversationList } from './ConversationList'

export function Sidebar() {
  const router = useRouter()

  return (
    <aside className="w-64 flex-shrink-0 h-full bg-sidebar flex flex-col border-r border-border">
      {/* Wordmark */}
      <div className="p-4">
        <span className="font-serif text-lg text-foreground tracking-[-0.01em]">
          Claude Lite
        </span>
      </div>

      {/* New conversation */}
      <div className="px-2">
        <button
          type="button"
          onClick={() => router.push('/chat')}
          className="w-full flex items-center gap-3 px-3 h-9 rounded-md text-foreground-muted hover:bg-muted-hover hover:text-foreground text-sm transition-colors"
          aria-label="Nueva conversación"
        >
          <CirclePlus className="size-4 shrink-0" />
          Nueva conversación
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto mt-6 scroll-thin">
        <ConversationList />
      </div>
    </aside>
  )
}
