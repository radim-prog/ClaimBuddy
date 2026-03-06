'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CaseToggle } from '@/components/case/case-toggle'
import { CaseTimeline } from '@/components/case/case-timeline'
import { CaseDocuments } from '@/components/case/case-documents'
import { CaseBudgetCard } from '@/components/case/case-budget-card'
import { DocumentLinksPanel } from '@/components/documents/document-links-panel'
import { ScoringWizard } from '@/components/gtd/scoring-wizard'
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
  Plus,
  Star,
  AlertCircle,
  FileText,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Pencil,
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
  score_money?: number
  score_fire?: number
  score_time?: number
  score_distance?: number
  score_personal?: number
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

const calculateScore = (p: Project) =>
  (p.score_money || 0) + (p.score_fire || 0) + (p.score_time || 0) + (p.score_distance || 0) + (p.score_personal || 0)

const getPriority = (score: number) => {
  if (score >= 9) return { label: 'Vysoká', emoji: '🔴', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
  if (score >= 6) return { label: 'Střední', emoji: '🟡', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' }
  return { label: 'Nízká', emoji: '🟢', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof PlayCircle; color: string }> = {
  planning: { label: 'Plánování', icon: Target, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  active: { label: 'Aktivní', icon: PlayCircle, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  on_hold: { label: 'Pozastaveno', icon: PauseCircle, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  review: { label: 'K review', icon: AlertCircle, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  completed: { label: 'Dokončeno', icon: CheckCircle2, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  cancelled: { label: 'Zrušeno', icon: AlertCircle, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
}

// Collapsible section component
function Section({
  title,
  icon: Icon,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  icon: typeof FileText
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{title}</span>
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs">{count}</Badge>
          )}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeView, setActiveView] = useState<'summary' | 'tasks' | 'documents' | 'timeline' | 'budget' | 'case'>('summary')
  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showScoreDialog, setShowScoreDialog] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)

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
    setTasks(tasks.map(t => ({
      ...t,
      is_next_action: t.id === taskId ? !current : false,
    })))
  }

  const toggleTaskComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      }),
    })
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const handleScoreUpdate = async (result: { score_money: number; score_fire: number; score_time: number; score_distance: number; score_personal: number }) => {
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      })
      if (res.ok) {
        setProject(prev => prev ? { ...prev, ...result } : prev)
        toast.success('Priorita aktualizována')
      }
    } catch {
      toast.error('Chyba při ukládání')
    }
    setShowScoreDialog(false)
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    setAddingTask(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          status: 'pending',
          project_id: params.id,
          company_id: project?.company_id,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTasks(prev => [...prev, {
          id: data.task?.id || data.id,
          title: newTaskTitle.trim(),
          status: 'pending',
          assigned_to_name: null,
          due_date: null,
          is_next_action: false,
          phase_id: null,
        }])
        setNewTaskTitle('')
        toast.success('Úkol přidán')
      }
    } catch {
      toast.error('Chyba při přidávání úkolu')
    } finally {
      setAddingTask(false)
    }
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
        <h3 className="text-lg font-semibold font-display mb-2">Projekt nenalezen</h3>
        <Button onClick={() => router.push('/accountant/work')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Zpět na práci
        </Button>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning
  const StatusIcon = statusCfg.icon
  const score = calculateScore(project)
  const priority = getPriority(score)
  const nextAction = tasks.find(t => t.is_next_action)
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const activeTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasksList = tasks.filter(t => t.status === 'completed')

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/accountant/work')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Práce
      </Button>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Card className="rounded-xl shadow-soft-sm bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-3 text-center min-w-[100px]">
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Ukoly</div>
            <div className="text-2xl font-bold text-green-700">{completedTasks}/{tasks.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft-sm bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-3 text-center min-w-[110px]">
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Progress</div>
            <div className="text-2xl font-bold text-blue-700">{project.progress_percentage}%</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft-sm bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-3 text-center min-w-[110px]">
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Status</div>
            <div className="text-sm font-bold text-amber-700">{statusCfg.label}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 overflow-x-auto">
        <Button variant={activeView === 'summary' ? 'default' : 'ghost'} onClick={() => setActiveView('summary')} className={activeView === 'summary' ? 'bg-blue-600 hover:bg-blue-700' : ''}>📋 Souhrn spisu</Button>
        <Button variant={activeView === 'tasks' ? 'default' : 'ghost'} onClick={() => setActiveView('tasks')} className={activeView === 'tasks' ? 'bg-blue-600 hover:bg-blue-700' : ''}>✓ Ukoly ({completedTasks}/{tasks.length})</Button>
        {project.is_case && (
          <>
            <Button variant={activeView === 'documents' ? 'default' : 'ghost'} onClick={() => setActiveView('documents')} className={activeView === 'documents' ? 'bg-blue-600 hover:bg-blue-700' : ''}>📎 Dokumenty</Button>
            <Button variant={activeView === 'timeline' ? 'default' : 'ghost'} onClick={() => setActiveView('timeline')} className={activeView === 'timeline' ? 'bg-blue-600 hover:bg-blue-700' : ''}>🕐 Timeline</Button>
            <Button variant={activeView === 'budget' ? 'default' : 'ghost'} onClick={() => setActiveView('budget')} className={activeView === 'budget' ? 'bg-blue-600 hover:bg-blue-700' : ''}>💰 Rozpocet</Button>
          </>
        )}
        <Button variant={activeView === 'case' ? 'default' : 'ghost'} onClick={() => setActiveView('case')} className={activeView === 'case' ? 'bg-blue-600 hover:bg-blue-700' : ''}>⚙️ Spisovy system</Button>
      </div>

      {/* PROJECT HEADER — folder metafora */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 px-5 py-4 border-b border-purple-100 dark:border-purple-800/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={statusCfg.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusCfg.label}
                </Badge>
                {/* Compact R-Tasks Score Badge */}
                <Badge className={cn("text-xs", priority.color)}>
                  {priority.emoji} {score}/12 · {priority.label}
                </Badge>
                <button
                  onClick={() => setShowScoreDialog(true)}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                >
                  <Pencil className="h-3 w-3" /> Upravit
                </button>
              </div>
              <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">{project.title}</h1>
            </div>

            {/* Deadline + Progress */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {project.due_date && (
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(project.due_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })}
                </div>
              )}
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Progress value={project.progress_percentage} className="h-2 w-24" />
                  <span className="text-sm font-bold">{project.progress_percentage}%</span>
                </div>
                <span className="text-xs text-muted-foreground">{completedTasks}/{tasks.length} úkolů</span>
              </div>
            </div>
          </div>

          {/* Outcome */}
          {project.outcome && (
            <div className="mt-3 flex items-start gap-2">
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-purple-800 dark:text-purple-200">{project.outcome}</p>
            </div>
          )}

          {/* Next Action */}
          {nextAction && (
            <div className="mt-3 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Další krok:</span>
              <span
                className="text-sm cursor-pointer hover:underline text-blue-700 dark:text-blue-300"
                onClick={() => router.push(`/accountant/tasks/${nextAction.id}`)}
              >
                {nextAction.title}
              </span>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div>
          {/* TASKS SECTION */}
          {(activeView === 'tasks' || activeView === 'summary') && (
          <Section
            title="Úkoly"
            icon={CheckCircle2}
            count={tasks.length}
            defaultOpen={true}
          >
            <div className="space-y-1">
              {activeTasks.map(task => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group",
                    task.is_next_action && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                >
                  <button
                    onClick={() => toggleTaskComplete(task.id, task.status)}
                    className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 transition-colors flex items-center justify-center"
                  >
                    {task.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  </button>
                  <span
                    className="flex-1 text-sm font-medium cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    onClick={() => router.push(`/accountant/tasks/${task.id}`)}
                  >
                    {task.title}
                  </span>
                  {task.is_next_action && (
                    <Zap className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                  )}
                  {task.assigned_to_name && (
                    <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                      <User className="h-3 w-3" /> {task.assigned_to_name}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.due_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  <button
                    onClick={() => toggleNextAction(task.id, task.is_next_action)}
                    className={cn(
                      "p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                      task.is_next_action ? 'text-yellow-500 opacity-100' : 'text-gray-300 hover:text-yellow-400'
                    )}
                    title={task.is_next_action ? 'Odebrat Next Action' : 'Nastavit jako Next Action'}
                  >
                    <Star className="h-3.5 w-3.5" fill={task.is_next_action ? 'currentColor' : 'none'} />
                  </button>
                </div>
              ))}

              {/* Completed tasks (collapsed) */}
              {completedTasksList.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground py-1">
                    {completedTasksList.length} dokončených úkolů
                  </summary>
                  <div className="space-y-1 mt-1 opacity-60">
                    {completedTasksList.map(task => (
                      <div key={task.id} className="flex items-center gap-3 py-1.5 px-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm line-through text-muted-foreground">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Add task inline */}
              <div className="flex gap-2 mt-3 pt-2 border-t border-dashed">
                <Input
                  placeholder="Přidat úkol..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTaskTitle.trim()) {
                      e.preventDefault()
                      handleAddTask()
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim() || addingTask}
                  className="h-8 px-3"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Section>
          )}

          {/* DOCUMENTS SECTION */}
          {project.is_case && activeView === 'documents' && (
            <Section title="Dokumenty" icon={FileText} defaultOpen={true}>
              <CaseDocuments projectId={params.id} />
              {project.company_id && (
                <div className="mt-4">
                  <DocumentLinksPanel
                    entityType="project"
                    entityId={params.id}
                    companyId={project.company_id}
                    allowEdit
                  />
                </div>
              )}
            </Section>
          )}

          {/* TIMELINE SECTION */}
          {project.is_case && activeView === 'timeline' && (
            <Section title="Průběh" icon={Clock} defaultOpen={false}>
              <CaseTimeline projectId={params.id} />
            </Section>
          )}

          {/* BUDGET SECTION */}
          {project.is_case && activeView === 'budget' && (
            <Section title="Rozpočet" icon={TrendingUp} defaultOpen={false}>
              <CaseBudgetCard projectId={params.id} />
            </Section>
          )}

          {/* CASE TOGGLE */}
          {(activeView === 'case' || activeView === 'summary') && (
          <Section title="Spisový systém" icon={FileText} defaultOpen={false}>
            <CaseToggle
              projectId={params.id}
              project={project}
              onUpdate={(updated) => setProject(prev => prev ? { ...prev, ...updated } : prev)}
            />
          </Section>
          )}
        </div>
      </Card>

      {/* Score Dialog */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ohodnocení priority</DialogTitle>
          </DialogHeader>
          <ScoringWizard
            onComplete={handleScoreUpdate}
            onCancel={() => setShowScoreDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
