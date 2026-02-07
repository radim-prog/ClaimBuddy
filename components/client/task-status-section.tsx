'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  CalendarClock
} from 'lucide-react'

interface ClientTask {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  due_date: string
  created_at: string
  status_label: string
  priority_label: string
}

interface TaskStats {
  total: number
  active: number
  waiting: number
  completed: number
}

interface TasksData {
  tasks: ClientTask[]
  byStatus: {
    active: ClientTask[]
    waiting: ClientTask[]
    completed: ClientTask[]
  }
  stats: TaskStats
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
  accepted: <PlayCircle className="h-4 w-4 text-blue-500" />,
  in_progress: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />,
  waiting_for: <PauseCircle className="h-4 w-4 text-amber-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  someday_maybe: <CalendarClock className="h-4 w-4 text-gray-400" />,
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700',
}

interface TaskStatusSectionProps {
  companyId: string
}

export function TaskStatusSection({ companyId }: TaskStatusSectionProps) {
  const [data, setData] = useState<TasksData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch(`/api/client/tasks?companyId=${companyId}`)
        if (response.ok) {
          const json = await response.json()
          setData(json)
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [companyId])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-muted-foreground">Načítám stav úkolů...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Stav zpracování
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-muted-foreground">Vše je v pořádku</p>
            <p className="text-sm text-muted-foreground">Žádné aktivní úkoly k řešení</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { byStatus, stats } = data

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Co účetní právě řeší
        </CardTitle>
        <CardDescription>
          Přehled aktivních úkolů pro vaši firmu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{stats.active}</div>
            <div className="text-xs text-blue-600">Aktivních</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-700">{stats.waiting}</div>
            <div className="text-xs text-amber-600">Čeká na vás</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
            <div className="text-xs text-green-600">Dokončeno</div>
          </div>
        </div>

        {/* Waiting for client - highlighted */}
        {byStatus.waiting.length > 0 && (
          <div className="border-l-4 border-amber-400 bg-amber-50 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h4 className="font-semibold text-amber-800">Čeká na vaše podklady</h4>
            </div>
            <ul className="space-y-2">
              {byStatus.waiting.map(task => (
                <li key={task.id} className="text-sm text-amber-700">
                  • {task.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Active tasks */}
        {byStatus.active.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">Právě se zpracovává</h4>
            <div className="space-y-2">
              {byStatus.active.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {statusIcons[task.status]}
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${priorityColors[task.priority]}`}
                    >
                      {task.priority_label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {task.status_label}
                    </span>
                  </div>
                </div>
              ))}
              {byStatus.active.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{byStatus.active.length - 5} dalších úkolů
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recently completed */}
        {byStatus.completed.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">Nedávno dokončeno</h4>
            <div className="space-y-1">
              {byStatus.completed.slice(0, 3).map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="line-through">{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
