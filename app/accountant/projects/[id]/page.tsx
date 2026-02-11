'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Target,
  Zap,
  ListTodo,
  Plus,
  Star,
  AlertCircle,
} from 'lucide-react'

type Project = {
  id: string
  title: string
  description: string | null
  outcome: string | null
  status: string
  company_id: string | null
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number
  progress_percentage: number
  created_at: string
}

type Phase = {
  id: string
  title: string
  description: string | null
  position: number
  status: string
}

type TaskItem = {
  id: string
  title: string
  status: string
  assigned_to_name: string | null
  due_date: string | null
  is_next_action: boolean
  phase_id: string | null
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof PlayCircle; color: string }> = {
  planning: { label: 'Plánování', icon: Target, color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Aktivní', icon: PlayCircle, color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'Pozastaveno', icon: PauseCircle, color: 'bg-yellow-100 text-yellow-700' },
  review: { label: 'K review', icon: AlertCircle, color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Dokončeno', icon: CheckCircle2, color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Zrušeno', icon: AlertCircle, color: 'bg-red-100 text-red-600' },
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setProject(data.project)
          setPhases(data.phases || [])
          setTasks(data.tasks || [])
        }
        setLoading(false)
      })
      .catch(() => { setError('Nepodařilo se načíst projekt'); setLoading(false) })
  }, [params.id])

  const toggleNextAction = async (taskId: string, current: boolean) => {
    // Unset previous next action
    if (!current) {
      const prevNext = tasks.find(t => t.is_next_action)
      if (prevNext) {
        await fetch(`/api/tasks/${prevNext.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_next_action: false }),
        })
      }
    }
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_next_action: !current }),
    })
    // Refresh
    setTasks(tasks.map(t => ({
      ...t,
      is_next_action: t.id === taskId ? !current : false,
    })))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Projekt nenalezen</h3>
        <Button onClick={() => router.push('/accountant/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Zpět na projekty
        </Button>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning
  const StatusIcon = statusCfg.icon
  const nextAction = tasks.find(t => t.is_next_action)

  const getTasksForPhase = (phaseId: string) => tasks.filter(t => t.phase_id === phaseId)
  const unassignedTasks = tasks.filter(t => !t.phase_id)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push('/accountant/projects')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Projekty
      </Button>

      {/* Project Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={statusCfg.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusCfg.label}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
              {project.outcome && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium text-sm mb-1">
                    <Target className="h-4 w-4" />
                    Cíl
                  </div>
                  <p className="text-purple-900 dark:text-purple-100">{project.outcome}</p>
                </div>
              )}
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 min-w-[180px]">
              {project.due_date && (
                <Card className="border">
                  <CardContent className="p-3 text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="font-bold">{new Date(project.due_date).toLocaleDateString('cs-CZ')}</div>
                    <div className="text-xs text-muted-foreground">Deadline</div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progres</span>
                    <span className="font-bold">{project.progress_percentage}%</span>
                  </div>
                  <Progress value={project.progress_percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    {tasks.filter(t => t.status === 'completed').length} / {tasks.length} úkolů
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {nextAction && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium mb-1">
                <Zap className="h-4 w-4" />
                Next Action
              </div>
              <span className="font-medium cursor-pointer hover:underline" onClick={() => router.push(`/accountant/tasks/${nextAction.id}`)}>
                {nextAction.title}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kanban Board - Phases as columns */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          Fáze a úkoly
        </h2>
      </div>

      {phases.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {phases.map(phase => {
            const phaseTasks = getTasksForPhase(phase.id)
            const completed = phaseTasks.filter(t => t.status === 'completed').length

            return (
              <div key={phase.id} className="min-w-[280px] max-w-[320px] flex-shrink-0">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{phase.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {completed}/{phaseTasks.length}
                      </Badge>
                    </div>
                    {phaseTasks.length > 0 && (
                      <Progress value={phaseTasks.length > 0 ? (completed / phaseTasks.length) * 100 : 0} className="h-1.5" />
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {phaseTasks.map(task => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          task.status === 'completed' ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60' : ''
                        } ${task.is_next_action ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1" onClick={() => router.push(`/accountant/tasks/${task.id}`)}>
                            <span className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {task.assigned_to_name && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" /> {task.assigned_to_name}
                                </span>
                              )}
                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> {new Date(task.due_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleNextAction(task.id, task.is_next_action)}
                            className={`p-1 rounded hover:bg-yellow-100 transition-colors ${task.is_next_action ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                            title={task.is_next_action ? 'Odebrat Next Action' : 'Nastavit jako Next Action'}
                          >
                            <Star className="h-4 w-4" fill={task.is_next_action ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {phaseTasks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Žádné úkoly</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <ListTodo className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Projekt nemá žádné fáze.</p>
        </Card>
      )}

      {/* Unassigned tasks */}
      {unassignedTasks.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Volné úkoly</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unassignedTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => router.push(`/accountant/tasks/${task.id}`)}
              >
                <span className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
