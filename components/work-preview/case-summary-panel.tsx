'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface ProgressNote {
  id: string
  created_at: string
  author_name: string
  current_status: string
  problems?: string | null
  next_steps?: string | null
}

interface TaskItem {
  id: string
  title: string
  status: string
  priority?: string
  due_date?: string | null
}

interface CaseSummaryPanelProps {
  projectId: string
}

export function CaseSummaryPanel({ projectId }: CaseSummaryPanelProps) {
  const [latestNote, setLatestNote] = useState<ProgressNote | null>(null)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [docCount, setDocCount] = useState(0)
  const [budget, setBudget] = useState<{ total_hours: number; total_cost: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const headers = { 'x-user-id': 'radim', 'x-user-name': 'Radim Zajíček' }

    Promise.all([
      fetch(`/api/projects/${projectId}/progress-notes`, { headers }).then(r => r.json()).catch(() => ({ notes: [] })),
      fetch(`/api/projects/${projectId}/tasks`, { headers }).then(r => r.json()).catch(() => ({ tasks: [] })),
      fetch(`/api/projects/${projectId}/documents`, { headers }).then(r => r.json()).catch(() => ({ documents: [] })),
      fetch(`/api/projects/${projectId}/budget`, { headers }).then(r => r.json()).catch(() => null),
    ]).then(([notesData, tasksData, docsData, budgetData]) => {
      if (notesData.notes?.length > 0) setLatestNote(notesData.notes[0])
      setTasks(tasksData.tasks || [])
      setDocCount((docsData.documents || []).length)
      if (budgetData) setBudget({ total_hours: budgetData.total_hours || 0, total_cost: budgetData.total_cost || 0 })
    }).finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'someday_maybe')

  return (
    <div className="space-y-6">
      {/* Latest progress note */}
      {latestNote && (
        <Card className="rounded-xl shadow-soft border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-3">Kde jsme skončili</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2" suppressHydrationWarning>
                {new Date(latestNote.created_at).toLocaleString('cs-CZ')} &bull; {latestNote.author_name}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">Aktuální stav:</div>
                  <div className="text-gray-700 dark:text-gray-200">{latestNote.current_status}</div>
                </div>
                {latestNote.problems && (
                  <div>
                    <div className="font-semibold text-red-700 mb-1">Problémy:</div>
                    <div className="text-gray-700 dark:text-gray-200">{latestNote.problems}</div>
                  </div>
                )}
                {latestNote.next_steps && (
                  <div>
                    <div className="font-semibold text-blue-700 mb-1">Další kroky:</div>
                    <div className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{latestNote.next_steps}</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick stats grid */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-soft-sm">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Úkoly</div>
            <div className="text-3xl font-bold">{completedTasks}/{totalTasks}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% dokončeno` : 'Žádné úkoly'}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft-sm">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Dokumenty</div>
            <div className="text-3xl font-bold">{docCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Připojeno ke spisu</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft-sm">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Fakturace</div>
            <div className="text-2xl font-bold">{budget ? `${budget.total_cost.toLocaleString()} Kč` : '—'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{budget ? `${budget.total_hours.toFixed(1)} hod` : 'Není k dispozici'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <Card className="rounded-xl shadow-soft-sm">
          <CardContent className="p-6">
            <h3 className="font-bold font-display text-gray-900 dark:text-white mb-4">Nedokončené úkoly</h3>
            <div className="space-y-2">
              {pendingTasks.slice(0, 10).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Badge className={task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-gray-400'}>
                    {task.priority?.toUpperCase() || 'N/A'}
                  </Badge>
                  <div className="flex-1">{task.title}</div>
                  {task.due_date && (
                    <div className="text-sm text-gray-600 dark:text-gray-300" suppressHydrationWarning>
                      {new Date(task.due_date).toLocaleDateString('cs-CZ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!latestNote && totalTasks === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Tento projekt zatím nemá žádné poznámky ani úkoly
        </div>
      )}
    </div>
  )
}
