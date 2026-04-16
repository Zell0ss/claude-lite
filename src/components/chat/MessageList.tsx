'use client'

import { useEffect, useRef } from 'react'
import { Message } from './Message'

interface MessageItem {
  id: string
  role: string
  content: string
}

interface Props {
  messages: MessageItem[]
  isStreaming: boolean
}

export function MessageList({ messages, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  return (
    <div aria-live="polite" className="flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:var(--border)_transparent]">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg) => (
          <Message
            key={msg.id}
            role={msg.role as 'user' | 'assistant'}
            content={msg.content}
          />
        ))}

        {isStreaming && (
          <div className="flex justify-start mb-6">
            {/* Pulsing asterisk placeholder while waiting for first token */}
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
