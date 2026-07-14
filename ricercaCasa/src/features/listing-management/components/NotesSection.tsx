import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { NoteIcon, PencilIcon, TrashIcon } from '../../../components/ui/Icons'
import { formatDate } from '../../../lib/formatters'
import type { ListingNote } from '../types/listingManagement.types'

type NotesSectionProps = {
  notes: ListingNote[]
  onDelete: (noteId: number) => Promise<void>
  onSave: (body: string, noteId?: number) => Promise<void>
}

export function NotesSection({ notes, onDelete, onSave }: NotesSectionProps) {
  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState<number | undefined>()

  function startEdit(note: ListingNote) {
    setBody(note.body)
    setEditingId(note.id)
  }

  async function handleSubmit() {
    if (!body.trim()) {
      return
    }

    await onSave(body, editingId)
    setBody('')
    setEditingId(undefined)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <NoteIcon className="h-5 w-5 text-blue-600" />
        <h4 className="text-lg font-semibold text-slate-950">Note</h4>
      </div>

      <textarea
        className="min-h-28 w-full rounded-[1.4rem] border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => setBody(event.target.value)}
        placeholder="Scrivi una nota locale"
        value={body}
      />

      <div className="flex gap-3">
        <Button onClick={handleSubmit}>{editingId ? 'Aggiorna nota' : 'Salva nota'}</Button>
        {editingId ? (
          <Button
            onClick={() => {
              setBody('')
              setEditingId(undefined)
            }}
            variant="ghost"
          >
            Annulla
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-500">Nessuna nota salvata.</p>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-[1.4rem] border border-slate-200 px-4 py-4"
            >
              <p className="text-sm leading-7 text-slate-700">{note.body}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                  {formatDate(note.updatedAt)}
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => startEdit(note)} variant="ghost">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => onDelete(note.id)} variant="danger">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
