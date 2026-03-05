'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProgressNote {
  id: string
  created_at: string
  author_name: string
  current_status: string
  problems?: string | null
  next_steps?: string | null
  note?: string | null
}

interface ProgressNotesPanelProps {
  projectId: string
}

export function ProgressNotesPanel({ projectId }: ProgressNotesPanelProps) {
  const [notes, setNotes] = useState<ProgressNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentStatus, setCurrentStatus] = useState('')
  const [problems, setProblems] = useState('')
  const [nextSteps, setNextSteps] = useState('')
  const [freeNote, setFreeNote] = useState('')

  useEffect(() => {
    fetch(`/api/projects/${projectId}/progress-notes`, {
      headers: { 'x-user-id': 'radim', 'x-user-name': 'Radim Zajíček' },
    })
      .then(r => r.json())
      .then(data => setNotes(data.notes || []))
      .catch(() => toast.error('Nepodařilo se načíst poznámky'))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleAdd = async () => {
    if (!currentStatus.trim()) {
      toast.error('Aktuální stav je povinný')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/progress-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'radim', 'x-user-name': 'Radim Zajíček' },
        body: JSON.stringify({
          current_status: currentStatus,
          problems: problems || null,
          next_steps: nextSteps || null,
          note: freeNote || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setNotes(prev => [data.note, ...prev])
        setCurrentStatus('')
        setProblems('')
        setNextSteps('')
        setFreeNote('')
        setShowForm(false)
        toast.success('Poznámka přidána')
      } else {
        toast.error(data.error || 'Chyba při ukládání')
      }
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/progress-notes?noteId=${noteId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'radim' },
      })
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId))
        toast.success('Poznámka smazána')
      }
    } catch {
      toast.error('Chyba při mazání')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-6">
      <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
        <Plus className="h-4 w-4 mr-2" />
        Přidat poznámku o průběhu
      </Button>

      {showForm && (
        <Card className="rounded-xl shadow-soft border-green-200">
          <CardContent className="p-6">
            <h3 className="font-bold font-display mb-4">Nova poznámka o průběhu</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Aktuální stav *</label>
                <Textarea value={currentStatus} onChange={e => setCurrentStatus(e.target.value)} placeholder="Co je aktuální situace? Co jsme udělali?" rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Problémy</label>
                <Textarea value={problems} onChange={e => setProblems(e.target.value)} placeholder="Narazili jsme na nějaký problém?" rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Další kroky</label>
                <Textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)} placeholder="Co je potřeba udělat dál?" rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Volná poznámka</label>
                <Textarea value={freeNote} onChange={e => setFreeNote(e.target.value)} placeholder="Další informace..." rows={2} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={saving} className="bg-green-600">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Uložit
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Zrušit</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Zatím žádné poznámky o průběhu
        </div>
      )}

      {notes.map(note => (
        <Card key={note.id} className="rounded-xl shadow-soft-sm border-l-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-300" suppressHydrationWarning>
                {new Date(note.created_at).toLocaleString('cs-CZ')} &bull; {note.author_name}
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(note.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Aktuální stav:</div>
                <div className="text-gray-700 dark:text-gray-200">{note.current_status}</div>
              </div>
              {note.problems && (
                <div>
                  <div className="font-semibold text-red-700 mb-1">Problémy:</div>
                  <div className="text-gray-700 dark:text-gray-200">{note.problems}</div>
                </div>
              )}
              {note.next_steps && (
                <div>
                  <div className="font-semibold text-blue-700 mb-1">Další kroky:</div>
                  <div className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{note.next_steps}</div>
                </div>
              )}
              {note.note && (
                <div className="text-sm text-gray-600 dark:text-gray-300 italic mt-2">{note.note}</div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
