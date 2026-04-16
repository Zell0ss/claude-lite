'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { v4 as uuidv4 } from 'uuid'
import { MODELS, DEFAULT_MODEL, type ModelId } from '@/lib/models'
import { ChatInput } from './ChatInput'
import { getTextContent } from './utils'

export function BlankChat() {
  const router = useRouter()
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [input, setInput] = useState('')

  // Stable conversation ID for the new chat
  const [conversationId] = useState(() => uuidv4())

  const { messages, sendMessage, status, error, stop } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        conversation_id: conversationId,
        model,
        system_prompt: systemPrompt || undefined,
      },
    }),
    onFinish: () => {
      router.push(`/chat/${conversationId}`)
    },
  })

  const isStreaming = status === 'submitted' || status === 'streaming'

  function handleSubmit() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    sendMessage({ text })
  }

  // Map UIMessages to a flat display shape
  const displayMessages = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: getTextContent(m),
  }))

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Centered greeting area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-full max-w-3xl">
          {messages.length === 0 ? (
            // Greeting shown when no messages yet
            <div className="text-center mb-8">
              <h2 className="font-serif text-display text-foreground tracking-[-0.01em] flex items-center justify-center gap-4">
                {/* Coral asterisk (static) */}
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="hsl(14 56% 52%)"
                  aria-hidden="true"
                  className="flex-shrink-0"
                >
                  <path d="M12 2 L13.2 9.5 L19.5 4.5 L14.5 10.8 L22 12 L14.5 13.2 L19.5 19.5 L13.2 14.5 L12 22 L10.8 14.5 L4.5 19.5 L9.5 13.2 L2 12 L9.5 10.8 L4.5 4.5 L10.8 9.5 Z" />
                </svg>
                ¿En qué puedo ayudarte?
              </h2>
            </div>
          ) : (
            // Show messages if any (e.g. while streaming before redirect)
            <div className="mb-4">
              {displayMessages.map((msg) => (
                <div key={msg.id} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'user' ? (
                    <span className="inline-block bg-muted text-foreground rounded-2xl rounded-br-sm px-4 py-3 text-base max-w-[70%]">
                      {msg.content}
                    </span>
                  ) : (
                    <span className="text-foreground text-base">{msg.content}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Model selector and system prompt toggle */}
          <div className="flex flex-col gap-3">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ModelId)}
              className="w-full bg-muted border border-border text-foreground text-sm rounded-lg px-3 py-2 outline-none focus:border-accent transition-colors"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className="text-foreground-muted hover:text-foreground text-xs text-left transition-colors"
            >
              {showSystemPrompt ? '▼' : '▶'} System prompt (opcional)
            </button>

            {showSystemPrompt && (
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Instrucciones del sistema (opcional)…"
                rows={3}
                className="w-full bg-muted border border-border text-foreground text-sm rounded-lg px-3 py-2 outline-none focus:border-accent resize-none transition-colors"
              />
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-3 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded text-destructive text-xs">
          Error: {error.message}
        </div>
      )}

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
