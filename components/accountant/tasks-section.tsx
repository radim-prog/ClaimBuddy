'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  User,
  MoreVertical,
  Play,
  Pause,
  Check,
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
import { Task, TaskStatus } from '@/lib/mock-data'

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
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}

const priorityLabels: Record<TaskPriority, string> = {
  critical: 'Kritické',
  high: 'Vysoká',
  medium: 'Střední',
  low: 'Nízká',
}

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  clarifying: 'bg-orange-100 text-orange-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  waiting_for: 'bg-yellow-100 text-yellow-700',
  waiting_client: 'bg-amber-100 text-amber-700',
  awaiting_approval: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  invoiced: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  someday_maybe: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<TaskStatus, string> = {
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
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
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
    if (isTomorrow(date)) return 'text-yellow-600'
    return 'text-gray-500'
  }

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (!onTasksChange) return
    const updatedTasks = tasks.map(t =>
      t.id === taskId
        ? { ...t, status: newStatus, updated_at: new Date().toISOString() }
        : t
    )
    onTasksChange(updatedTasks)
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs and add button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'active'
                ? 'bg-white text-purple-700 font-medium shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Aktivní ({counts.active})
          </button>
          <button
            onClick={() => setFilter('waiting')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'waiting'
                ? 'bg-white text-purple-700 font-medium shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Čeká na... ({counts.waiting})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'completed'
                ? 'bg-white text-purple-700 font-medium shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Hotovo ({counts.completed})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white text-purple-700 font-medium shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vše ({counts.all})
          </button>
        </div>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Nový úkol
        </Button>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>
            {filter === 'active' && 'Žádné aktivní úkoly'}
            {filter === 'waiting' && 'Žádné čekající úkoly'}
            {filter === 'completed' && 'Žádné dokončené úkoly'}
            {filter === 'all' && 'Zatím žádné úkoly u tohoto klienta'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Status indicator */}
                <div className="pt-1">
                  {task.status === 'in_progress' ? (
                    <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                  ) : task.status === 'waiting_for' ? (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  ) : task.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                </div>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${
                      task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${priorityColors[getTaskPriority(task.score_fire)]}`}
                    >
                      {priorityLabels[getTaskPriority(task.score_fire)]}
                    </Badge>
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs">
                    {/* Due date */}
                    <span className={`flex items-center gap-1 ${getDueDateColor(task.due_date, task.status)}`}>
                      <Calendar className="h-3 w-3" />
                      {formatDueDate(task.due_date)}
                      {task.due_time && ` ${task.due_time}`}
                    </span>

                    {/* Assigned to */}
                    {task.assigned_to_name && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <User className="h-3 w-3" />
                        {task.assigned_to_name}
                      </span>
                    )}

                    {/* Waiting for info */}
                    {task.status === 'waiting_for' && task.waiting_for_who && (
                      <span className="text-yellow-700">
                        Čeká na: {task.waiting_for_who}
                      </span>
                    )}

                    {/* Progress */}
                    {task.progress_percentage !== undefined && task.progress_percentage > 0 && (
                      <span className="text-purple-600">
                        {task.progress_percentage}% hotovo
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
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
                        Označit jako hotové
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Upravit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Smazat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
