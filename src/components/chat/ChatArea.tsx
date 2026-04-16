'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { MODELS } from '@/lib/models'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import type { Conversation, Message } from '@/lib/db/schema'

interface Props {
  conversation: Conversation
  initialMessages: Message[]
}

// Convert DB Message to UIMessage shape expected by ai@6 useChat
function dbMessageToUIMessage(m: Message): UIMessage {
  return {
    id: m.id,
    role: m.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: m.content }],
  }
}

// Extract text content from a UIMessage (ai@6 uses parts array)
function getTextContent(msg: UIMessage): string {
  for (const part of msg.parts) {
    if (part.type === 'text') return part.text
  }
  return ''
}

export function ChatArea({ conversation, initialMessages }: Props) {
  const [input, setInput] = useState('')

  const { messages, sendMessage, status, error, stop } = useChat({
    id: conversation.id,
    messages: initialMessages.map(dbMessageToUIMessage),
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        conversation_id: conversation.id,
        model: conversation.model,
      },
    }),
  })

  const isStreaming = status === 'submitted' || status === 'streaming'

  function handleSubmit() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    sendMessage({ text })
  }

  const modelLabel = MODELS.find((m) => m.id === conversation.model)?.label ?? conversation.model

  // Map UIMessages to flat display shape for MessageList
  const displayMessages = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: getTextContent(m),
  }))

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-0 h-14 flex-shrink-0">
        <h1 className="flex-1 text-foreground text-xl font-semibold truncate">
          {conversation.title}
        </h1>
        <span className="text-foreground-muted text-xs bg-muted px-2 py-1 rounded-full flex-shrink-0">
          {modelLabel}
        </span>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mb-0 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded text-destructive text-xs flex-shrink-0">
          Error en el stream. El mensaje no se ha guardado. {error.message}
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={displayMessages}
        isStreaming={isStreaming}
      />

      {/* Input */}
      <ChatInput
        input={input}
        isStreaming={isStreaming}
        onChange={setInput}
        onSubmit={handleSubmit}
        onStop={stop}
      />
    </div>
  )
}
