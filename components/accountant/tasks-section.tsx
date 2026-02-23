'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  MoreVertical,
  Play,
  Pause,
  Check,
  X,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'
import { cs } from 'date-fns/locale'
import type { Task, TaskStatus } from '@/lib/types/tasks'
import { toast } from 'sonner'

// Priority derived from R-Tasks score_fire
type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

// Helper function to derive priority from score_fire
function getTaskPriority(scoreFire: number | undefined | null): TaskPriority {
  if (scoreFire === undefined || scoreFire === null) return 'low'
  if (scoreFire >= 4) return 'critical'
  if (scoreFire >= 3) return 'high'
  if (scoreFire >= 2) return 'medium'
  return 'low'
}

interface AccountantTasksSectionProps {
  companyId: string
  companyName: string
  tasks: Task[]
  onTasksChange?: (tasks: Task[]) => void
}

const priorityColors: Record<TaskPriority, string> = {
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200',
  medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200',
  low: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
}

const priorityLabels: Record<TaskPriority, string> = {
  critical: 'Kritické',
  high: 'Vysoká',
  medium: 'Střední',
  low: 'Nízká',
}

const statusColors: Record<TaskStatus, string> = {
  draft: 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
  pending: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  clarifying: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  accepted: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  in_progress: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  waiting_for: 'bg-yellow-100 text-yellow-700 dark:text-yellow-400',
  waiting_client: 'bg-amber-100 text-amber-700',
  awaiting_approval: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  invoiced: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  someday_maybe: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

const statusLabels: Record<TaskStatus, string> = {
  draft: 'Koncept',
  pending: 'Čeká',
  clarifying: 'Upřesňuje se',
  accepted: 'Přijato',
  in_progress: 'Rozpracováno',
  waiting_for: 'Čeká interně',
  waiting_client: 'Čeká na klienta',
  awaiting_approval: 'Ke schválení',
  completed: 'Dokončeno',
  invoiced: 'Vyfakturováno',
  cancelled: 'Zrušeno',
  someday_maybe: 'Někdy',
}

export function AccountantTasksSection({
  companyId,
  companyName,
  tasks,
  onTasksChange
}: AccountantTasksSectionProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting' | 'completed'>('active')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks

    switch (filter) {
      case 'active':
        filtered = tasks.filter(t =>
          t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress'
        )
        break
      case 'waiting':
        filtered = tasks.filter(t => t.status === 'waiting_for')
        break
      case 'completed':
        filtered = tasks.filter(t => t.status === 'completed')
        break
    }

    // Sort by priority and due date
    return filtered.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const aPriority = getTaskPriority(a.score_fire)
      const bPriority = getTaskPriority(b.score_fire)
      if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
        return priorityOrder[aPriority] - priorityOrder[bPriority]
      }
      const aTime = a.due_date ? new Date(a.due_date).getTime() : Infinity
      const bTime = b.due_date ? new Date(b.due_date).getTime() : Infinity
      return aTime - bTime
    })
  }, [tasks, filter])

  // Task counts by status
  const counts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter(t =>
      t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress'
    ).length,
    waiting: tasks.filter(t => t.status === 'waiting_for').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }), [tasks])

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Dnes'
    if (isTomorrow(date)) return 'Zítra'
    if (isPast(date)) {
      const days = differenceInDays(new Date(), date)
      return `${days} ${days === 1 ? 'den' : days < 5 ? 'dny' : 'dní'} po termínu`
    }
    return format(date, 'd. MMMM', { locale: cs })
  }

  const getDueDateColor = (dateString: string, status: TaskStatus) => {
    if (status === 'completed') return 'text-gray-400'
    const date = new Date(dateString)
    if (isPast(date) && !isToday(date)) return 'text-red-600 font-medium'
    if (isToday(date)) return 'text-orange-600 font-medium'
    if (isTomorrow(date)) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-500 dark:text-gray-400'
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed')
      const { task: updated } = await res.json()
      if (onTasksChange) {
        onTasksChange(tasks.map(t => t.id === taskId ? { ...t, ...updated } : t))
      }
      toast.success(newStatus === 'completed' ? 'Úkol dokončen' : 'Status aktualizován')
    } catch {
      toast.error('Chyba při změně statusu')
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Opravdu smazat tento úkol?')) return
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      if (onTasksChange) {
        onTasksChange(tasks.filter(t => t.id !== taskId))
      }
      toast.success('Úkol smazán')
    } catch {
      toast.error('Chyba při mazání úkolu')
    }
  }

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      toast.error('Zadejte název úkolu')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          due_date: newDueDate || undefined,
          company_id: companyId,
          company_name: companyName,
          status: 'pending',
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      const { task: created } = await res.json()
      if (onTasksChange) {
        onTasksChange([created, ...tasks])
      }
      setNewTitle('')
      setNewDescription('')
      setNewDueDate('')
      setShowNewForm(false)
      toast.success('Úkol vytvořen')
    } catch (err: any) {
      toast.error(err.message || 'Chyba při vytváření úkolu')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs and add button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg">
          {([
            { key: 'active' as const, label: 'Aktivní', count: counts.active },
            { key: 'waiting' as const, label: 'Čeká', count: counts.waiting },
            { key: 'completed' as const, label: 'Hotovo', count: counts.completed },
            { key: 'all' as const, label: 'Vše', count: counts.all },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                filter === tab.key
                  ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-400 font-medium shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}({tab.count})
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant={showNewForm ? 'secondary' : 'default'}
          className={showNewForm ? '' : 'bg-purple-600 hover:bg-purple-700'}
          onClick={() => setShowNewForm(!showNewForm)}
        >
          {showNewForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showNewForm ? 'Zavřít' : 'Nový úkol'}
        </Button>
      </div>

      {/* Inline new task form */}
      {showNewForm && (
        <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 space-y-2">
          <Input
            placeholder="Název úkolu *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCreateTask()}
            className="h-8 text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Input
              placeholder="Popis (volitelné)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 h-8"
            />
            <Button
              size="sm"
              onClick={handleCreateTask}
              disabled={saving || !newTitle.trim()}
              className="bg-purple-600 hover:bg-purple-700 h-8"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          {filter === 'active' && 'Žádné aktivní úkoly'}
          {filter === 'waiting' && 'Žádné čekající úkoly'}
          {filter === 'completed' && 'Žádné dokončené úkoly'}
          {filter === 'all' && 'Zatím žádné úkoly'}
        </p>
      ) : (
        <div className="space-y-1">
          {filteredTasks.map((task) => {
            const priority = getTaskPriority(task.score_fire)
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 group ${
                  task.status === 'completed' ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Status icon */}
                  {task.status === 'in_progress' ? (
                    <Loader2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 animate-spin shrink-0" />
                  ) : task.status === 'waiting_for' ? (
                    <Clock className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                  ) : task.status === 'completed' ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                  ) : task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) ? (
                    <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                  )}

                  {/* Title */}
                  <span className={`text-sm truncate ${
                    task.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                  }`}>
                    {task.title}
                  </span>

                  {/* Priority badge (only for high+) */}
                  {(priority === 'critical' || priority === 'high') && (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${priorityColors[priority]}`}>
                      {priorityLabels[priority]}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Due date */}
                  {task.due_date && (
                    <span className={`text-xs ${getDueDateColor(task.due_date, task.status)}`}>
                      {formatDueDate(task.due_date)}
                    </span>
                  )}

                  {/* Waiting for */}
                  {task.status === 'waiting_for' && task.waiting_for_who && (
                    <span className="text-xs text-yellow-700 dark:text-yellow-400 truncate max-w-[100px]">
                      {task.waiting_for_who}
                    </span>
                  )}

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {task.status !== 'in_progress' && task.status !== 'completed' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                          <Play className="h-4 w-4 mr-2" />
                          Začít pracovat
                        </DropdownMenuItem>
                      )}
                      {task.status === 'in_progress' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'pending')}>
                          <Pause className="h-4 w-4 mr-2" />
                          Pozastavit
                        </DropdownMenuItem>
                      )}
                      {task.status !== 'completed' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'completed')}>
                          <Check className="h-4 w-4 mr-2" />
                          Dokončit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Smazat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
