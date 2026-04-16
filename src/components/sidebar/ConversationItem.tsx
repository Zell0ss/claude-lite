'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Sparkles, Trash2, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MODELS, type ModelId } from '@/lib/models'
import type { Conversation } from '@/lib/db/schema'

interface Props {
  conversation: Conversation
  isActive: boolean
  onUpdate: () => void
}

/** Dot colour per model — per design system §8-1 */
function ModelDot({ model }: { model: string }) {
  const dotClass =
    model === 'claude-opus-4-7'
      ? 'bg-[hsl(14_56%_52%)]'           /* accent coral — Opus */
      : model === 'claude-sonnet-4-6'
        ? 'bg-[hsl(0_0%_64%)]'            /* foreground-muted — Sonnet */
        : 'bg-[hsl(0_0%_55%)]'            /* slightly up from subtle — Haiku */

  const label = MODELS.find((m) => m.id === model)?.label ?? model

  return (
    <span
      title={label}
      className={`inline-block size-2 rounded-full shrink-0 ml-1.5 ${dotClass}`}
      aria-label={label}
    />
  )
}

export function ConversationItem({ conversation, isActive, onUpdate }: Props) {
  const router = useRouter()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [newTitle, setNewTitle] = useState(conversation.title)

  async function handleRename() {
    await fetch(`/api/conversations/${conversation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    setRenameOpen(false)
    onUpdate()
  }

  async function handleModelChange(modelId: ModelId) {
    await fetch(`/api/conversations/${conversation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId }),
    })
    onUpdate()
  }

  async function handleDelete() {
    await fetch(`/api/conversations/${conversation.id}`, { method: 'DELETE' })
    setDeleteOpen(false)
    onUpdate()
    if (isActive) router.push('/chat')
  }

  return (
    <>
      {/* Conversation row */}
      <div
        role="button"
        tabIndex={0}
        aria-current={isActive ? 'page' : undefined}
        className={`group flex items-center h-9 px-3 rounded-md cursor-pointer transition-colors ${
          isActive
            ? 'bg-muted text-foreground'
            : 'text-foreground-muted hover:bg-muted-hover hover:text-foreground'
        }`}
        onClick={() => router.push(`/chat/${conversation.id}`)}
        onKeyDown={(e) => e.key === 'Enter' && router.push(`/chat/${conversation.id}`)}
      >
        {/* Title + model dot */}
        <span
          className={`flex-1 min-w-0 text-sm truncate ${isActive ? 'font-semibold' : ''}`}
        >
          {conversation.title}
        </span>
        <ModelDot model={conversation.model} />

        {/* 3-dot menu trigger — always visible when active, hover otherwise */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Conversation actions"
            onClick={(e: { stopPropagation(): void }) => e.stopPropagation()}
            className={`ml-1.5 p-1 rounded-md transition-opacity shrink-0 hover:bg-[hsl(0_0%_22%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <MoreHorizontal className="size-4 text-foreground-muted" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={4}
            className="min-w-[180px]"
          >
            {/* Rename */}
            <DropdownMenuItem
              onClick={(e: { stopPropagation(): void }) => {
                e.stopPropagation()
                setNewTitle(conversation.title)
                setRenameOpen(true)
              }}
            >
              <Pencil className="size-4" />
              Renombrar
            </DropdownMenuItem>

            {/* Change model — submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sparkles className="size-4" />
                Cambiar modelo
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {MODELS.map((m) => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={(e: { stopPropagation(): void }) => {
                      e.stopPropagation()
                      handleModelChange(m.id)
                    }}
                    className="justify-between"
                  >
                    <span>{m.label}</span>
                    {conversation.model === m.id && (
                      <Check className="size-4 text-[hsl(14_56%_52%)]" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Spacer — no separator line, just margin */}
            <div className="my-1" />

            {/* Delete — destructive */}
            <DropdownMenuItem
              variant="destructive"
              onClick={(e: { stopPropagation(): void }) => {
                e.stopPropagation()
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rename dialog */}
      <Dialog
        open={renameOpen}
        onOpenChange={(open: boolean) => setRenameOpen(open)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Renombrar conversación</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRenameOpen(false)}
              className="px-4 py-2 rounded-md bg-muted hover:bg-muted-hover text-foreground text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleRename}
              className="px-4 py-2 rounded-md bg-[hsl(14_56%_52%)] hover:bg-[hsl(14_56%_58%)] text-white text-sm font-medium transition-colors"
            >
              Guardar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open: boolean) => setDeleteOpen(open)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>¿Eliminar esta conversación?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground-muted">
            Esta acción no se puede deshacer. Se eliminarán todos los mensajes.
          </p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="px-4 py-2 rounded-md bg-muted hover:bg-muted-hover text-foreground text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 rounded-md bg-destructive hover:bg-[hsl(0_70%_55%)] text-white text-sm font-medium transition-colors"
            >
              Eliminar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
