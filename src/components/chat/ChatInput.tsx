'use client'

import { useRef, KeyboardEvent } from 'react'
import { ArrowUp, Square } from 'lucide-react'

interface Props {
  input: string
  isStreaming: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onStop?: () => void
}

export function ChatInput({ input, isStreaming, onChange, onSubmit, onStop }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming && input.trim()) {
        onSubmit()
      }
    }
  }

  function handleInput(e: { currentTarget: HTMLTextAreaElement }) {
    const t = e.currentTarget
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 192) + 'px' // max ~8 lines ≈ 192px
  }

  const canSend = !isStreaming && input.trim().length > 0

  return (
    <div className="px-4 pb-4 pt-2 flex-shrink-0">
      <div className="max-w-3xl mx-auto">
        <div className="bg-muted rounded-2xl px-4 pt-4 pb-2">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Responder…"
            rows={1}
            className="w-full bg-transparent text-foreground text-base resize-none outline-none placeholder:text-foreground-muted overflow-y-auto leading-relaxed"
            style={{ height: 'auto', maxHeight: '192px' }}
            aria-label="Escribe un mensaje"
          />

          {/* Action row */}
          <div className="flex items-center justify-end mt-2 h-9">
            {isStreaming ? (
              // Stop button during streaming
              <button
                type="button"
                onClick={onStop}
                className="w-8 h-8 rounded-full bg-muted border border-border hover:border-foreground-muted flex items-center justify-center transition-colors"
                aria-label="Detener respuesta"
              >
                <Square size={12} className="text-foreground fill-foreground" />
              </button>
            ) : (
              // Send button
              <button
                type="button"
                onClick={() => { if (canSend) onSubmit() }}
                disabled={!canSend}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  canSend
                    ? 'bg-accent hover:bg-accent-brand-hover cursor-pointer'
                    : 'bg-muted cursor-not-allowed'
                }`}
                aria-label="Enviar mensaje"
              >
                <ArrowUp
                  size={14}
                  className={canSend ? 'text-accent-foreground' : 'text-foreground-subtle'}
                />
              </button>
            )}
          </div>
        </div>

        <p className="text-foreground-subtle text-xs text-center mt-2">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}
