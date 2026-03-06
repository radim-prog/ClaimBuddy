'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus, Loader2, Play, Pause, Check, X, Trash2, MoreVertical, Clock,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'
import { cs } from 'date-fns/locale'
import type { Task, TaskStatus } from '@/lib/types/tasks'
import { toast } from 'sonner'

type FilterType = 'active' | 'waiting' | 'completed' | 'all'
type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

function getTaskPriority(scoreFire: number | undefined | null): TaskPriority {
  if (scoreFire === undefined || scoreFire === null) return 'low'
  if (scoreFire >= 4) return 'critical'
  if (scoreFire >= 3) return 'high'
  if (scoreFire >= 2) return 'medium'
  return 'low'
}

const priorityConfig: Record<TaskPriority, { dot: string; ring: string; border: string; bg: string; label: string }> = {
  critical: {
    dot: 'bg-red-500', ring: 'ring-red-200 dark:ring-red-800',
    border: 'border-red-200 dark:border-red-800', bg: 'bg-red-50 dark:bg-red-950/30', label: 'CRITICAL',
  },
  high: {
    dot: 'bg-orange-500', ring: 'ring-orange-200 dark:ring-orange-800',
    border: 'border-orange-200 dark:border-orange-800', bg: 'bg-orange-50 dark:bg-orange-950/30', label: 'HIGH',
  },
  medium: {
    dot: 'bg-blue-500', ring: 'ring-blue-200 dark:ring-blue-800',
    border: 'border-blue-200 dark:border-blue-800', bg: 'bg-blue-50 dark:bg-blue-950/30', label: 'MEDIUM',
  },
  low: {
    dot: 'bg-gray-400', ring: 'ring-gray-200 dark:ring-gray-700',
    border: 'border-gray-200 dark:border-gray-700', bg: 'bg-gray-50 dark:bg-gray-800/50', label: 'LOW',
  },
}

const statusLabels: Record<string, string> = {
  draft: 'Koncept', pending: 'Ceka', clarifying: 'Upresnuje se', accepted: 'Prijato',
  in_progress: 'Rozpracovano', waiting_for: 'Ceka interne', waiting_client: 'Ceka na klienta',
  awaiting_approval: 'Ke schvaleni', completed: 'Dokonceno', invoiced: 'Vyfakturovano',
  cancelled: 'Zruseno', someday_maybe: 'Nekdy',
}

interface TimelineTasksPanelProps {
  companyId: string
  companyName: string
}

export function TimelineTasksPanel({ companyId, companyName }: TimelineTasksPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('active')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/tasks?company_id=${companyId}&page_size=100`, {
      headers: { 'x-user-id': 'radim' },
    })
      .then(r => r.json())
      .then(data => setTasks(data.tasks || []))
      .catch(() => toast.error('Nepodařilo se načíst úkoly'))
      .finally(() => setLoading(false))
  }, [companyId])

  const filteredTasks = useMemo(() => {
    let filtered = tasks
    switch (filter) {
      case 'active':
        filtered = tasks.filter(t =>
          ['pending', 'accepted', 'in_progress', 'clarifying'].includes(t.status)
        )
        break
      case 'waiting':
        filtered = tasks.filter(t =>
          ['waiting_for', 'waiting_client'].includes(t.status)
        )
        break
      case 'completed':
        filtered = tasks.filter(t => t.status === 'completed')
        break
    }
    return filtered.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      const ap = getTaskPriority(a.score_fire)
      const bp = getTaskPriority(b.score_fire)
      if (order[ap] !== order[bp]) return order[ap] - order[bp]
      const at = a.due_date ? new Date(a.due_date).getTime() : Infinity
      const bt = b.due_date ? new Date(b.due_date).getTime() : Infinity
      return at - bt
    })
  }, [tasks, filter])

  const counts = useMemo(() => ({
    active: tasks.filter(t => ['pending', 'accepted', 'in_progress', 'clarifying'].includes(t.status)).length,
    waiting: tasks.filter(t => ['waiting_for', 'waiting_client'].includes(t.status)).length,
    completed: tasks.filter(t => t.status === 'completed').length,
    all: tasks.length,
  }), [tasks])

  const formatDueDate = (d: string) => {
    const date = new Date(d)
    if (isToday(date)) return 'Dnes'
    if (isTomorrow(date)) return 'Zitra'
    if (isPast(date)) {
      const days = differenceInDays(new Date(), date)
      return `${days} ${days === 1 ? 'den' : days < 5 ? 'dny' : 'dni'} po terminu`
    }
    return format(date, 'd. M.', { locale: cs })
  }

  const getDueDateColor = (d: string, status: TaskStatus) => {
    if (status === 'completed') return 'text-gray-400'
    const date = new Date(d)
    if (isPast(date) && !isToday(date)) return 'text-red-600 font-semibold'
    if (isToday(date)) return 'text-orange-600 font-medium'
    if (isTomorrow(date)) return 'text-yellow-600'
    return 'text-gray-500'
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'radim' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      const { task: updated } = await res.json()
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t))
      toast.success(newStatus === 'completed' ? 'Ukol dokoncen' : 'Status aktualizovan')
    } catch {
      toast.error('Chyba pri zmene statusu')
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Smazat ukol?')) return
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'radim' },
      })
      setTasks(prev => prev.filter(t => t.id !== taskId))
      toast.success('Ukol smazan')
    } catch {
      toast.error('Chyba pri mazani')
    }
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'radim' },
        body: JSON.stringify({
          title: newTitle.trim(),
          company_id: companyId,
          company_name: companyName,
          status: 'pending',
          due_date: newDueDate || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      const { task: created } = await res.json()
      setTasks(prev => [created, ...prev])
      setNewTitle('')
      setNewDueDate('')
      setShowNewForm(false)
      toast.success('Ukol vytvoren')
    } catch {
      toast.error('Chyba pri vytvareni')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const pending = filteredTasks.filter(t => t.status !== 'completed')
  const completed = filteredTasks.filter(t => t.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Filter tabs + add button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg">
          {([
            { key: 'active' as const, label: 'Aktivni', count: counts.active },
            { key: 'waiting' as const, label: 'Ceka', count: counts.waiting },
            { key: 'completed' as const, label: 'Hotovo', count: counts.completed },
            { key: 'all' as const, label: 'Vse', count: counts.all },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filter === tab.key
                  ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 font-medium shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant={showNewForm ? 'secondary' : 'default'}
          className={showNewForm ? '' : 'bg-blue-600 hover:bg-blue-700'}
          onClick={() => setShowNewForm(!showNewForm)}
        >
          {showNewForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showNewForm ? 'Zavrit' : 'Novy ukol'}
        </Button>
      </div>

      {/* New task form */}
      {showNewForm && (
        <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 space-y-2">
          <Input
            placeholder="Nazev ukolu *"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="px-2 py-1.5 border rounded text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <Button
              onClick={handleCreate}
              disabled={saving || !newTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Pridat
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {filter === 'active' && 'Zadne aktivni ukoly'}
          {filter === 'waiting' && 'Zadne cekajici ukoly'}
          {filter === 'completed' && 'Zadne dokoncene ukoly'}
          {filter === 'all' && 'Zatim zadne ukoly pro tohoto klienta'}
        </div>
      )}

      {/* Pending tasks — timeline visual */}
      {pending.length > 0 && (
        <div>
          {filter !== 'completed' && filter !== 'all' && (
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Nedokoncene ({pending.length})
            </h3>
          )}
          <div className="space-y-0">
            {pending.map((task, index) => {
              const priority = getTaskPriority(task.score_fire)
              const config = priorityConfig[priority]
              const isLast = index === pending.length - 1 && completed.length === 0

              return (
                <div key={task.id} className="flex gap-3 group">
                  {/* Timeline dot + connector */}
                  <div className="flex flex-col items-center pt-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${config.dot} ring-2 ${config.ring}`} />
                    {!isLast && (
                      <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 min-h-[20px]" />
                    )}
                  </div>

                  {/* Task content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {task.title}
                          </span>
                          {(priority === 'critical' || priority === 'high') && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${config.border} ${config.bg}`}
                            >
                              {config.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {statusLabels[task.status] || task.status}
                          </Badge>
                          {task.due_date && (
                            <span className={getDueDateColor(task.due_date, task.status)} suppressHydrationWarning>
                              termin: {formatDueDate(task.due_date)}
                            </span>
                          )}
                          {task.assigned_to_name && (
                            <span>* {task.assigned_to_name}</span>
                          )}
                        </div>
                      </div>

                      {/* Inline actions */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {task.status !== 'in_progress' && task.status !== 'completed' && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                          >
                            <Play className="h-3 w-3 mr-1" /> Zacit
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleStatusChange(task.id, 'pending')}
                          >
                            <Pause className="h-3 w-3 mr-1" /> Pozastavit
                          </Button>
                        )}
                        {task.status !== 'completed' && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 px-2 text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleStatusChange(task.id, 'completed')}
                          >
                            <Check className="h-3 w-3 mr-1" /> Dokoncit
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {task.status !== 'waiting_for' && task.status !== 'completed' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'waiting_for')}>
                                <Clock className="h-4 w-4 mr-2" /> Ceka na...
                              </DropdownMenuItem>
                            )}
                            {task.status === 'completed' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'pending')}>
                                <Play className="h-4 w-4 mr-2" /> Znovu otevrit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleDelete(task.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Smazat
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed tasks — muted timeline */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
            Dokoncene ({completed.length})
          </h3>
          <div className="space-y-0">
            {completed.map((task, index) => {
              const isLast = index === completed.length - 1

              return (
                <div key={task.id} className="flex gap-3 group opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex flex-col items-center pt-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <Check className="h-2 w-2 text-white" />
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 min-h-[12px]" />
                    )}
                  </div>
                  <div className="flex-1 pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm line-through text-gray-500 dark:text-gray-400">
                        {task.title}
                      </span>
                      {task.completed_at && (
                        <span className="text-xs text-gray-400 ml-2" suppressHydrationWarning>
                          {new Date(task.completed_at).toLocaleDateString('cs-CZ')}
                        </span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'pending')}>
                          <Play className="h-4 w-4 mr-2" /> Znovu otevrit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Smazat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
