'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ListTodo, ArrowLeft, Loader2, Calendar, AlertCircle, Plus, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
type TaskPriority = 'high' | 'medium' | 'low'

type ClaimsTask = {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  due_date: string | null
  assigned_to: string | null
  assigned_to_name?: string | null
  priority: TaskPriority
  company_id: string
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Čeká',
  in_progress: 'Probíhá',
  completed: 'Dokončeno',
  cancelled: 'Zrušeno',
}

const STATUS_CLASS: Record<TaskStatus, string> = {
  pending: 'border-yellow-300 bg-yellow-50 text-yellow-800',
  in_progress: 'border-blue-300 bg-blue-50 text-blue-800',
  completed: 'border-green-300 bg-green-50 text-green-800',
  cancelled: 'border-gray-300 bg-gray-100 text-gray-600',
}

// ─── Priority helpers ─────────────────────────────────────────────────────────

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: 'Vysoká',
  medium: 'Střední',
  low: 'Nízká',
}

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
}

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClaimsClientTasksPage() {
  const params = useParams()
  const companyId = params?.companyId as string | undefined

  const [tasks, setTasks] = useState<ClaimsTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    due_date: '',
  })

  const fetchTasks = useCallback(async () => {
    if (!companyId) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/claims/tasks?company_id=${encodeURIComponent(companyId)}`)
      if (res.status === 404) {
        setTasks([])
        return
      }
      if (!res.ok) {
        throw new Error(`Chyba ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : (data.tasks ?? []))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se načíst úkoly'
      setError(message)
      toast.error('Chyba při načítání úkolů', { description: message })
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  async function handleCreateTask() {
    const title = newTask.title.trim()
    if (!title || !companyId || creating) return

    setCreating(true)
    try {
      const res = await fetch('/api/claims/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          title,
          description: newTask.description.trim() || null,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Chyba ${res.status}`)
      }

      setNewTask({ title: '', description: '', priority: 'medium', due_date: '' })
      setShowCreateForm(false)
      toast.success('Úkol byl vytvořen')
      await fetchTasks()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Úkol se nepodařilo vytvořit'
      toast.error('Chyba při vytváření úkolu', { description: message })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/claims/clients/${companyId}`}>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zpět na klienta
            </Button>
          </Link>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(prev => !prev)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {showCreateForm ? (
            <>
              <X className="h-4 w-4 mr-1" />
              Zavřít
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Nový úkol
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <ListTodo className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-semibold text-gray-900">Úkoly klienta</h1>
      </div>

      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="space-y-4 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Název úkolu</label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Např. ověřit protokol od pojišťovny"
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Popis</label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Volitelně doplňte detaily úkolu"
                rows={3}
                disabled={creating}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Priorita</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                  disabled={creating}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="high">Vysoká</option>
                  <option value="medium">Střední</option>
                  <option value="low">Nízká</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Termín</label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                  disabled={creating}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
              >
                Zrušit
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={!newTask.title.trim() || creating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vytvářím…
                  </>
                ) : (
                  'Vytvořit úkol'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-600" />
          <span>Načítám úkoly…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-5 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && tasks.length === 0 && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <ListTodo className="h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium">Žádné úkoly</p>
            <p className="text-xs text-gray-400">Pro tohoto klienta zatím nejsou evidovány žádné úkoly.</p>
          </CardContent>
        </Card>
      )}

      {/* Task list */}
      {!loading && !error && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="border border-gray-200 hover:border-blue-200 transition-colors">
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: priority dot + title */}
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
                      title={`Priorita: ${PRIORITY_LABEL[task.priority]}`}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                        {/* Due date */}
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(task.due_date)}
                          </span>
                        )}
                        {/* Assigned to */}
                        {(task.assigned_to_name || task.assigned_to) && (
                          <span className="text-gray-500">
                            Přiřazeno: <span className="text-gray-700">{task.assigned_to_name || task.assigned_to}</span>
                          </span>
                        )}
                        {/* Priority label */}
                        <span className="text-gray-400">
                          Priorita: <span className="text-gray-600">{PRIORITY_LABEL[task.priority]}</span>
                        </span>
                      </div>

                      {task.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: status badge */}
                  <Badge className={`shrink-0 text-xs font-medium border ${STATUS_CLASS[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
