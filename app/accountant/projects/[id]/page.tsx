'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CaseToggle } from '@/components/case/case-toggle'
import { CaseTimeline } from '@/components/case/case-timeline'
import { CaseDocuments } from '@/components/case/case-documents'
import { CaseBudgetCard } from '@/components/case/case-budget-card'
import { DocumentLinksPanel } from '@/components/documents/document-links-panel'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
  Briefcase,
  TrendingUp,
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
  is_case?: boolean
  case_number?: string
  case_type_id?: string
  case_opposing_party?: string
  case_reference?: string
  hourly_rate?: number
  // R-Tasks scoring
  score_money?: number
  score_fire?: number
  score_time?: number
  score_distance?: number
  score_personal?: number
}

// R-Tasks Scoring Configuration
const SCORE_OPTIONS = {
  money: [
    { value: 0, label: '0 - <5k Kč', color: 'text-red-600' },
    { value: 1, label: '1 - 5k+ Kč', color: 'text-purple-600' },
    { value: 2, label: '2 - 15k+ Kč', color: 'text-blue-600' },
    { value: 3, label: '3 - 50k+ Kč', color: 'text-green-600' },
  ],
  fire: [
    { value: 0, label: '0 - Easy', color: 'text-green-600' },
    { value: 1, label: '1 - Normal', color: 'text-blue-600' },
    { value: 2, label: '2 - High', color: 'text-purple-600' },
    { value: 3, label: '3 - Critical', color: 'text-red-600' },
  ],
  time: [
    { value: 0, label: '0 - den+', color: 'text-red-600' },
    { value: 1, label: '1 - 2-4h', color: 'text-purple-600' },
    { value: 2, label: '2 - <1h', color: 'text-blue-600' },
    { value: 3, label: '3 - <30min', color: 'text-green-600' },
  ],
  distance: [
    { value: 0, label: '0 - Daleko', color: 'text-red-600' },
    { value: 1, label: '1 - Lokálně', color: 'text-blue-600' },
    { value: 2, label: '2 - PC', color: 'text-green-600' },
  ],
  personal: [
    { value: 0, label: '0 - Poor', color: 'text-red-600' },
    { value: 1, label: '1 - Good', color: 'text-green-600' },
  ],
}

const calculateProjectTotalScore = (p: Project): number => {
  return (p.score_money || 0) + (p.score_fire || 0) + (p.score_time || 0) + (p.score_distance || 0) + (p.score_personal || 0)
}

const getScorePriority = (score: number): { label: string; emoji: string; color: string } => {
  if (score >= 9) return { label: 'Vysoká', emoji: '🔥', color: 'text-white bg-red-500' }
  if (score >= 6) return { label: 'Střední', emoji: '⚠️', color: 'text-white bg-orange-500' }
  return { label: 'Nízká', emoji: '☑️', color: 'text-white bg-green-600' }
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

  const updateProjectScore = async (field: string, value: number) => {
    const prevValue = project?.[field as keyof Project]
    setProject(prev => prev ? { ...prev, [field]: value } : prev)
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Score aktualizováno')
    } catch {
      setProject(prev => prev ? { ...prev, [field]: prevValue } : prev)
      toast.error('Nepodařilo se uložit score')
    }
  }

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

      {/* R-Tasks Score Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              R-Tasks Score
            </div>
            <Badge className={cn("text-lg px-3 py-1", getScorePriority(calculateProjectTotalScore(project)).color)}>
              {getScorePriority(calculateProjectTotalScore(project)).emoji} {calculateProjectTotalScore(project)}/12
            </Badge>
          </CardTitle>
          <CardDescription>
            Priorita: {getScorePriority(calculateProjectTotalScore(project)).label}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Money Value */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <span>💰</span> Money Value
            </Label>
            <Select
              value={project.score_money?.toString() || '0'}
              onValueChange={(v) => updateProjectScore('score_money', parseInt(v))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCORE_OPTIONS.money.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    <span className={opt.color}>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fire Fire (Urgency) */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <span>🔥</span> Fire Fire (Urgence)
            </Label>
            <Select
              value={project.score_fire?.toString() || '0'}
              onValueChange={(v) => updateProjectScore('score_fire', parseInt(v))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCORE_OPTIONS.fire.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    <span className={opt.color}>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Value */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <span>⏱️</span> Time Value
            </Label>
            <Select
              value={project.score_time?.toString() || '0'}
              onValueChange={(v) => updateProjectScore('score_time', parseInt(v))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCORE_OPTIONS.time.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    <span className={opt.color}>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Distance Value */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <span>📍</span> Distance Value
            </Label>
            <Select
              value={project.score_distance?.toString() || '0'}
              onValueChange={(v) => updateProjectScore('score_distance', parseInt(v))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCORE_OPTIONS.distance.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    <span className={opt.color}>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Personal Rating */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <span>❤️</span> Personal Rating
            </Label>
            <Select
              value={project.score_personal?.toString() || '0'}
              onValueChange={(v) => updateProjectScore('score_personal', parseInt(v))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCORE_OPTIONS.personal.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    <span className={opt.color}>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Score breakdown */}
          <Separator className="my-2" />
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>💰 Money:</span>
              <span className="font-semibold">{project.score_money || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>🔥 Fire:</span>
              <span className="font-semibold">{project.score_fire || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>⏱️ Time:</span>
              <span className="font-semibold">{project.score_time || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>📍 Distance:</span>
              <span className="font-semibold">{project.score_distance || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>❤️ Personal:</span>
              <span className="font-semibold">{project.score_personal || 0}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-sm font-bold">
              <span>Total:</span>
              <span>{calculateProjectTotalScore(project)}/12</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Toggle */}
      <CaseToggle
        projectId={params.id}
        project={project}
        onUpdate={(updated) => setProject(prev => prev ? { ...prev, ...updated } : prev)}
      />

      {/* Content - Tabs if case, otherwise just phases */}
      {project.is_case ? (
        <Tabs defaultValue="phases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="phases">
              <ListTodo className="h-4 w-4 mr-1" /> Fáze
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Calendar className="h-4 w-4 mr-1" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="documents">
              <Briefcase className="h-4 w-4 mr-1" /> Dokumenty
            </TabsTrigger>
            <TabsTrigger value="budget">
              <Target className="h-4 w-4 mr-1" /> Rozpočet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phases">
            <PhasesAndTasks phases={phases} tasks={tasks} getTasksForPhase={getTasksForPhase} unassignedTasks={unassignedTasks} toggleNextAction={toggleNextAction} router={router} />
          </TabsContent>
          <TabsContent value="timeline">
            <CaseTimeline projectId={params.id} />
          </TabsContent>
          <TabsContent value="documents">
            <CaseDocuments projectId={params.id} />
            {project.company_id && (
              <div className="mt-6">
                <DocumentLinksPanel
                  entityType="project"
                  entityId={params.id}
                  companyId={project.company_id}
                  allowEdit
                />
              </div>
            )}
          </TabsContent>
          <TabsContent value="budget">
            <CaseBudgetCard projectId={params.id} />
          </TabsContent>
        </Tabs>
      ) : (
        <PhasesAndTasks phases={phases} tasks={tasks} getTasksForPhase={getTasksForPhase} unassignedTasks={unassignedTasks} toggleNextAction={toggleNextAction} router={router} />
      )}
    </div>
  )
}

function PhasesAndTasks({
  phases,
  tasks,
  getTasksForPhase,
  unassignedTasks,
  toggleNextAction,
  router,
}: {
  phases: Phase[]
  tasks: TaskItem[]
  getTasksForPhase: (phaseId: string) => TaskItem[]
  unassignedTasks: TaskItem[]
  toggleNextAction: (taskId: string, current: boolean) => void
  router: ReturnType<typeof useRouter>
}) {
  return (
    <div className="space-y-4">
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
                      <Progress value={(completed / phaseTasks.length) * 100} className="h-1.5" />
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
