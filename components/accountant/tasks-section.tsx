'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
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
  Circle,
  ExternalLink,
  Briefcase,
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
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { GTDWizard } from '@/components/tasks/gtd-wizard'

type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

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
  critical: 'Kriticka',
  high: 'Vysoka',
  medium: 'Stredni',
  low: 'Nizka',
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
  pending: 'Ceka',
  clarifying: 'Upresnuje se',
  accepted: 'Prijato',
  in_progress: 'Rozpracovano',
  waiting_for: 'Ceka interne',
  waiting_client: 'Ceka na klienta',
  awaiting_approval: 'Ke schvaleni',
  completed: 'Dokonceno',
  invoiced: 'Vyfakturovano',
  cancelled: 'Zruseno',
  someday_maybe: 'Nekdy',
}

export function AccountantTasksSection({ companyId, companyName, tasks, onTasksChange }: AccountantTasksSectionProps) {
  const router = useRouter()
  const { userId, userName } = useAccountantUser()
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting' | 'completed'>('active')
  const [showGTDWizard, setShowGTDWizard] = useState(false)

  const filteredTasks = useMemo(() => {
    let filtered = tasks
    switch (filter) {
      case 'active':
        filtered = tasks.filter(t => t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress')
        break
      case 'waiting':
        filtered = tasks.filter(t => t.status === 'waiting_for' || t.status === 'waiting_client')
        break
      case 'completed':
        filtered = tasks.filter(t => t.status === 'completed')
        break
    }

    return [...filtered].sort((a, b) => {
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

  const counts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter(t => t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress').length,
    waiting: tasks.filter(t => t.status === 'waiting_for' || t.status === 'waiting_client').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }), [tasks])

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Dnes'
    if (isTomorrow(date)) return 'Zitra'
    if (isPast(date)) {
      const days = differenceInDays(new Date(), date)
      return `${days} ${days === 1 ? 'den' : days < 5 ? 'dny' : 'dni'} po terminu`
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

  const patchTask = async (taskId: string, changes: Record<string, any>) => {
    if (!userId) throw new Error('missing user')
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-user-name': userName || 'Ucetni',
      },
      body: JSON.stringify(changes),
    })
    if (!res.ok) throw new Error('patch failed')
    const data = await res.json()
    return data.task as Task
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updated = await patchTask(taskId, { status: newStatus })
      if (onTasksChange) onTasksChange(tasks.map(t => (t.id === taskId ? { ...t, ...updated } : t)))
      toast.success(newStatus === 'completed' ? 'Ukol dokoncen' : 'Status aktualizovan')
    } catch {
      toast.error('Chyba pri zmene statusu')
    }
  }

  const handleCancel = async (taskId: string) => {
    try {
      const updated = await patchTask(taskId, {
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      if (onTasksChange) onTasksChange(tasks.map(t => (t.id === taskId ? { ...t, ...updated } : t)))
      toast.success('Ukol oznacen jako zruseny')
    } catch {
      toast.error('Chyba pri ruseni ukolu')
    }
  }

  const handleGTDComplete = async (data: any) => {
    if (!userId) return
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-user-name': userName || 'Ucetni',
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description || undefined,
        due_date: data.dueDate || undefined,
        due_time: data.dueTime || undefined,
        company_id: companyId,
        company_name: companyName,
        status: 'pending',
        is_project: data.isProject || false,
        project_outcome: data.projectOutcome || undefined,
        contexts: data.contexts?.length ? data.contexts : undefined,
        energy_level: data.energyLevel || undefined,
        estimated_minutes: data.estimatedMinutes || undefined,
        is_billable: data.isBillable ?? true,
        billing_type: data.billingType || undefined,
        hourly_rate: data.hourlyRate || undefined,
        assigned_to: data.assignedTo || undefined,
        subtasks: data.subtasks?.length ? data.subtasks : undefined,
      }),
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || 'create failed')
    }

    const { task: created } = await res.json()
    if (onTasksChange) onTasksChange([created, ...tasks])
    setShowGTDWizard(false)
    toast.success('Ukol vytvoren')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          {([
            { key: 'active' as const, label: 'Aktivni', count: counts.active },
            { key: 'waiting' as const, label: 'Ceka', count: counts.waiting },
            { key: 'completed' as const, label: 'Hotovo', count: counts.completed },
            { key: 'all' as const, label: 'Vse', count: counts.all },
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
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant={showGTDWizard ? 'secondary' : 'default'}
          className={showGTDWizard ? '' : 'bg-purple-600 hover:bg-purple-700'}
          onClick={() => setShowGTDWizard(!showGTDWizard)}
        >
          {showGTDWizard ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showGTDWizard ? 'Zavrit' : 'Novy ukol'}
        </Button>
      </div>

      {/* GTD Wizard Dialog */}
      <Dialog open={showGTDWizard} onOpenChange={setShowGTDWizard}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <GTDWizard
            companyId={companyId}
            companyName={companyName}
            onComplete={handleGTDComplete}
            onCancel={() => setShowGTDWizard(false)}
          />
        </DialogContent>
      </Dialog>

      {filteredTasks.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          {filter === 'active' && 'Zadne aktivni ukoly'}
          {filter === 'waiting' && 'Zadne cekajici ukoly'}
          {filter === 'completed' && 'Zadne dokoncene ukoly'}
          {filter === 'all' && 'Zatim zadne ukoly'}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => {
            const priority = getTaskPriority(task.score_fire)
            return (
              <div
                key={task.id}
                onClick={() => router.push(`/accountant/tasks/${task.id}`)}
                className={`flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border bg-white dark:bg-gray-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/40 dark:hover:bg-purple-900/10 group transition-colors cursor-pointer ${
                  task.status === 'completed' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {task.status === 'in_progress' ? (
                    <Play className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  ) : task.status === 'waiting_for' || task.status === 'waiting_client' ? (
                    <Clock className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                  ) : task.status === 'completed' ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                  ) : task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) ? (
                    <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                  )}

                  <span
                    className={`text-sm truncate ${
                      task.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </span>

                  {task.is_project && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200">
                      <Briefcase className="h-2.5 w-2.5 mr-0.5" />
                      Projekt
                    </Badge>
                  )}

                  {(priority === 'critical' || priority === 'high') && (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${priorityColors[priority]}`}>
                      {priorityLabels[priority]}
                    </Badge>
                  )}

                  <Badge className={`text-[10px] px-1.5 py-0 border-0 hidden sm:inline-flex ${statusColors[task.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[task.status] || task.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  {task.due_date && (
                    <span className={`text-xs ${getDueDateColor(task.due_date, task.status)} hidden sm:inline`}>
                      {formatDueDate(task.due_date)}
                    </span>
                  )}

                  <Button asChild variant="ghost" size="sm" className="h-7 px-2 hidden md:inline-flex">
                    <Link href={`/accountant/tasks/${task.id}`}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Detail
                    </Link>
                  </Button>

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
                          Zacit pracovat
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
                          Dokoncit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => handleCancel(task.id)}>
                        <X className="h-4 w-4 mr-2" />
                        Oznacit jako zruseny
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
