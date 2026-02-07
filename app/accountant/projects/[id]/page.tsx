'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Building2,
  Calendar,
  User,
  Users,
  Clock,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Archive,
  AlertCircle,
  Target,
  TrendingUp,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ListTodo,
  Edit,
  MoreHorizontal,
  DollarSign,
  History,
  Phone,
  Mail,
  FileText,
  StickyNote,
  Video,
  Lightbulb,
  MessageSquare,
  Play,
  Receipt,
  Banknote,
} from 'lucide-react'
import {
  getProjectById,
  getPhasesForProject,
  getTasksForPhase,
  getTasksForProject,
  getNextActionForProject,
  Project,
  Phase,
  Task,
  ProjectStatus,
  ProjectType,
  PhaseStatus,
} from '@/lib/mock-data'

// Status configuration
const STATUS_CONFIG: Record<ProjectStatus, { label: string; icon: typeof PlayCircle; color: string; bgColor: string }> = {
  planning: { label: 'Plánování', icon: Target, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  active: { label: 'Aktivní', icon: PlayCircle, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  on_hold: { label: 'Pozastaveno', icon: PauseCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
  review: { label: 'K review', icon: AlertCircle, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  completed: { label: 'Dokončeno', icon: CheckCircle2, color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' },
  cancelled: { label: 'Zrušeno', icon: Archive, color: 'text-red-500', bgColor: 'bg-red-50 border-red-200' },
}

const PHASE_STATUS_CONFIG: Record<PhaseStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Čeká', color: 'text-gray-600 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  active: { label: 'Aktivní', color: 'text-green-600', bgColor: 'bg-green-100' },
  completed: { label: 'Hotovo', color: 'text-blue-600', bgColor: 'bg-blue-100' },
}

const TYPE_CONFIG: Record<ProjectType, { label: string; icon: typeof RefreshCw; color: string }> = {
  recurring: { label: 'Opakující se', icon: RefreshCw, color: 'text-blue-600' },
  one_time: { label: 'Jednorázový', icon: Zap, color: 'text-orange-600' },
  ongoing: { label: 'Průběžný', icon: TrendingUp, color: 'text-green-600' },
}

// Helper functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short',
  })
}

function getDaysUntilDeadline(dateString: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(dateString)
  deadline.setHours(0, 0, 0, 0)
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getDeadlineColor(days: number): string {
  if (days < 0) return 'text-red-600 bg-red-50'
  if (days <= 3) return 'text-orange-600 bg-orange-50'
  if (days <= 7) return 'text-yellow-600 bg-yellow-50'
  return 'text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50'
}

function getTaskStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'text-green-600'
    case 'in_progress': return 'text-blue-600'
    case 'blocked': return 'text-red-600'
    default: return 'text-gray-500 dark:text-gray-400'
  }
}

// Timeline event type for project aggregation
type ProjectTimelineEventType =
  | 'created' | 'assigned' | 'accepted' | 'started' | 'completed' | 'delegated' | 'comment'
  | 'call' | 'email' | 'document' | 'note' | 'meeting' | 'decision' | 'phase_completed'

interface ProjectTimelineEvent {
  id: string
  task_id?: string
  task_title?: string
  phase_id?: string
  phase_title?: string
  event_type: ProjectTimelineEventType
  user_name: string
  description: string
  created_at: string
  duration_minutes?: number
}

const TIMELINE_EVENT_CONFIG: Record<ProjectTimelineEventType, {
  label: string;
  icon: typeof Phone;
  color: string;
  bgColor: string
}> = {
  created: { label: 'Vytvořeno', icon: Target, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  assigned: { label: 'Přiřazeno', icon: User, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  accepted: { label: 'Přijato', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100' },
  started: { label: 'Zahájeno', icon: Play, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  completed: { label: 'Dokončeno', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100' },
  delegated: { label: 'Delegováno', icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  comment: { label: 'Komentář', icon: MessageSquare, color: 'text-gray-600 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  call: { label: 'Hovor', icon: Phone, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  email: { label: 'Email', icon: Mail, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  document: { label: 'Dokument', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  note: { label: 'Poznámka', icon: StickyNote, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  meeting: { label: 'Schůzka', icon: Video, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  decision: { label: 'Rozhodnutí', icon: Lightbulb, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  phase_completed: { label: 'Fáze dokončena', icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-100' },
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const project = getProjectById(params.id)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [timelineExpanded, setTimelineExpanded] = useState(false)
  const [billingExpanded, setBillingExpanded] = useState(true)

  // Get phases and tasks
  const phases = useMemo(() => project ? getPhasesForProject(project.id) : [], [project])
  const allTasks = useMemo(() => project ? getTasksForProject(project.id) : [], [project])
  const nextAction = useMemo(() => project ? getNextActionForProject(project.id) : undefined, [project])

  // Tasks without phase (direct project tasks)
  const unassignedTasks = useMemo(() =>
    allTasks.filter(t => !t.phase_id),
    [allTasks]
  )

  // Generate project timeline from tasks
  const projectTimeline = useMemo((): ProjectTimelineEvent[] => {
    if (!project) return []

    const events: ProjectTimelineEvent[] = []

    // Project created event
    events.push({
      id: 'project-created',
      event_type: 'created',
      user_name: project.owner_name,
      description: `Projekt "${project.title}" vytvořen`,
      created_at: project.created_at,
    })

    // Add task-related events
    allTasks.forEach(task => {
      // Task created
      events.push({
        id: `task-${task.id}-created`,
        task_id: task.id,
        task_title: task.title,
        event_type: 'created',
        user_name: task.created_by_name,
        description: `Úkol: ${task.title}`,
        created_at: task.created_at,
      })

      // Task completed
      if (task.status === 'completed' && task.completed_at) {
        events.push({
          id: `task-${task.id}-completed`,
          task_id: task.id,
          task_title: task.title,
          event_type: 'completed',
          user_name: task.assigned_to_name || task.created_by_name,
          description: `Dokončeno: ${task.title}`,
          created_at: task.completed_at,
          duration_minutes: task.actual_minutes,
        })
      }
    })

    // Add phase completed events
    phases.filter(p => p.status === 'completed').forEach(phase => {
      events.push({
        id: `phase-${phase.id}-completed`,
        phase_id: phase.id,
        phase_title: phase.title,
        event_type: 'phase_completed',
        user_name: project.owner_name,
        description: `Fáze "${phase.title}" dokončena`,
        created_at: phase.updated_at || phase.created_at,
      })
    })

    // Sort by date descending (newest first)
    return events.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [project, allTasks, phases])

  // Calculate billing summary
  const billingSummary = useMemo(() => {
    if (!project) return null

    const billableTasks = allTasks.filter(t => t.is_billable)
    const totalEstimatedMinutes = allTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
    const totalActualMinutes = allTasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0)
    const billableMinutes = billableTasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0)

    const hourlyRate = project.hourly_rate || 1200 // Default rate
    const billableAmount = Math.round((billableMinutes / 60) * hourlyRate)
    const budgetAmount = project.budget_hours ? project.budget_hours * hourlyRate : 0
    const budgetUsedPercent = project.budget_hours
      ? Math.round((totalActualMinutes / 60 / project.budget_hours) * 100)
      : 0

    return {
      totalEstimatedHours: Math.round(totalEstimatedMinutes / 60 * 10) / 10,
      totalActualHours: Math.round(totalActualMinutes / 60 * 10) / 10,
      billableHours: Math.round(billableMinutes / 60 * 10) / 10,
      hourlyRate,
      billableAmount,
      budgetHours: project.budget_hours || 0,
      budgetAmount,
      budgetUsedPercent,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      totalTasks: allTasks.length,
    }
  }, [project, allTasks])

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
    } else {
      newExpanded.add(phaseId)
    }
    setExpandedPhases(newExpanded)
  }

  // Expand all active phases by default
  useMemo(() => {
    const activePhaseIds = phases.filter(p => p.status === 'active').map(p => p.id)
    setExpandedPhases(new Set(activePhaseIds))
  }, [phases])

  if (!project) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Projekt nenalezen</h3>
          <p className="text-muted-foreground mb-4">
            Projekt s ID "{params.id}" neexistuje.
          </p>
          <Button onClick={() => router.push('/accountant/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět na projekty
          </Button>
        </Card>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[project.status]
  const typeConfig = TYPE_CONFIG[project.project_type]
  const StatusIcon = statusConfig.icon
  const TypeIcon = typeConfig.icon
  const daysUntil = getDaysUntilDeadline(project.target_date)

  const TaskItem = ({ task, isNextAction = false }: { task: Task; isNextAction?: boolean }) => {
    const isCompleted = task.status === 'completed'
    const isBlocked = task.is_blocked

    return (
      <div
        className={`
          flex items-center gap-3 p-3 rounded-lg border cursor-pointer
          hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 transition-colors
          ${isNextAction ? 'bg-blue-50 border-blue-200' : 'bg-white dark:bg-gray-800'}
          ${isBlocked ? 'opacity-60' : ''}
        `}
        onClick={() => router.push(`/accountant/tasks/${task.id}`)}
      >
        <Checkbox checked={isCompleted} disabled className="pointer-events-none" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isNextAction && (
              <Badge className="bg-blue-500 text-white text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Next
              </Badge>
            )}
            {isBlocked && (
              <Badge variant="destructive" className="text-xs">
                Blokováno
              </Badge>
            )}
            <span className={`font-medium ${isCompleted ? 'line-through text-gray-400' : ''}`}>
              {task.title}
            </span>
          </div>

          {task.assigned_to_name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <User className="h-3 w-3" />
              <span>{task.assigned_to_name}</span>
              {task.due_date && (
                <>
                  <span className="mx-1">•</span>
                  <Calendar className="h-3 w-3" />
                  <span>{formatShortDate(task.due_date)}</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.score_fire !== undefined && task.score_fire > 0 && (
            <Badge
              variant="outline"
              className={`text-xs ${
                task.score_fire === 3 ? 'border-red-300 text-red-600' :
                task.score_fire === 2 ? 'border-orange-300 text-orange-600' :
                'border-gray-300 text-gray-600 dark:text-gray-300'
              }`}
            >
              {task.score_fire === 3 ? 'Kritické' : task.score_fire === 2 ? 'Vysoká' : 'Normální'}
            </Badge>
          )}
          <span className={`text-sm ${getTaskStatusColor(task.status)}`}>
            {task.status === 'completed' ? '✓' : task.status === 'in_progress' ? '⏳' : '○'}
          </span>
        </div>
      </div>
    )
  }

  const PhaseSection = ({ phase }: { phase: Phase }) => {
    const phaseTasks = getTasksForPhase(phase.id)
    const isExpanded = expandedPhases.has(phase.id)
    const phaseStatusConfig = PHASE_STATUS_CONFIG[phase.status]
    const completedCount = phaseTasks.filter(t => t.status === 'completed').length
    const progressPercent = phaseTasks.length > 0 ? Math.round((completedCount / phaseTasks.length) * 100) : 0

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Phase Header */}
        <div
          className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 ${
            phase.status === 'active' ? 'bg-green-50/50' :
            phase.status === 'completed' ? 'bg-gray-50 dark:bg-gray-800/50' : ''
          }`}
          onClick={() => togglePhase(phase.id)}
        >
          <button className="text-gray-400 hover:text-gray-600 dark:text-gray-300">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{phase.title}</h3>
              <Badge className={`${phaseStatusConfig.bgColor} ${phaseStatusConfig.color} text-xs`}>
                {phaseStatusConfig.label}
              </Badge>
            </div>
            {phase.description && (
              <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ListTodo className="h-4 w-4" />
              <span>{completedCount}/{phaseTasks.length}</span>
            </div>
            {phase.target_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatShortDate(phase.target_date)}</span>
              </div>
            )}
            <div className="w-24">
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </div>

        {/* Phase Tasks */}
        {isExpanded && (
          <div className="border-t bg-gray-50/50 p-4 space-y-2">
            {phaseTasks.length > 0 ? (
              phaseTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isNextAction={nextAction?.id === task.id}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žádné úkoly v této fázi
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push('/accountant/projects')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Zpět na projekty
      </Button>

      {/* Project Header */}
      <div className="grid gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              {/* Left side - Title and info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  <Badge variant="outline" className={typeConfig.color}>
                    <TypeIcon className="h-3 w-3 mr-1" />
                    {typeConfig.label}
                  </Badge>
                  {project.recurrence && (
                    <Badge variant="secondary">
                      {project.recurrence.period_label}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2">{project.title}</h1>

                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{project.company_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{project.owner_name}</span>
                  </div>
                  {project.team_names.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{project.team_names.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Outcome (GTD) */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-purple-700 font-medium text-sm mb-1">
                    <Target className="h-4 w-4" />
                    Požadovaný výsledek (GTD)
                  </div>
                  <p className="text-purple-900">{project.outcome}</p>
                </div>

                {project.description && (
                  <p className="text-muted-foreground">{project.description}</p>
                )}
              </div>

              {/* Right side - Key metrics */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                {/* Deadline */}
                <Card className={`${getDeadlineColor(daysUntil)} border`}>
                  <CardContent className="p-3 text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-1" />
                    <div className="font-bold">
                      {daysUntil < 0
                        ? `${Math.abs(daysUntil)} dní po termínu`
                        : daysUntil === 0
                        ? 'Dnes!'
                        : `${daysUntil} dní`
                      }
                    </div>
                    <div className="text-xs">{formatDate(project.target_date)}</div>
                  </CardContent>
                </Card>

                {/* Progress */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progres</span>
                      <span className="font-bold">{project.progress_percent || 0}%</span>
                    </div>
                    <Progress value={project.progress_percent || 0} className="h-2 mb-2" />
                    <div className="text-xs text-muted-foreground text-center">
                      {project.completed_tasks || 0} / {project.total_tasks || 0} úkolů
                    </div>
                  </CardContent>
                </Card>

                {/* Budget if billable */}
                {project.is_billable && project.budget_hours && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-3 text-center">
                      <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <div className="font-bold text-green-700">{project.budget_hours}h</div>
                      <div className="text-xs text-green-600">
                        {project.hourly_rate && `@ ${project.hourly_rate} Kč/h`}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Next Action highlight */}
            {nextAction && project.status === 'active' && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                  <Zap className="h-5 w-5" />
                  Next Action
                </div>
                <div
                  className="flex items-center gap-3 cursor-pointer hover:bg-blue-100 rounded p-2 -m-2"
                  onClick={() => router.push(`/accountant/tasks/${nextAction.id}`)}
                >
                  <Checkbox checked={false} disabled className="pointer-events-none" />
                  <span className="font-medium">{nextAction.title}</span>
                  {nextAction.assigned_to_name && (
                    <span className="text-sm text-blue-600">
                      → {nextAction.assigned_to_name}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing Summary & Timeline Row */}
      {project.is_billable && billingSummary && (
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Billing Summary */}
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Banknote className="h-5 w-5" />
                  Fakturace projektu
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBillingExpanded(!billingExpanded)}
                >
                  {billingExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {billingExpanded && (
              <CardContent className="space-y-4">
                {/* Time Summary */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="text-2xl font-bold">{billingSummary.totalEstimatedHours}h</div>
                    <div className="text-xs text-muted-foreground">Odhad</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{billingSummary.totalActualHours}h</div>
                    <div className="text-xs text-blue-600">Odpracováno</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{billingSummary.billableHours}h</div>
                    <div className="text-xs text-green-600">K fakturaci</div>
                  </div>
                </div>

                <Separator />

                {/* Billing Details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hodinová sazba:</span>
                    <span className="font-medium">{billingSummary.hourlyRate.toLocaleString()} Kč/h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">K fakturaci:</span>
                    <span className="font-bold text-green-600">{billingSummary.billableAmount.toLocaleString()} Kč</span>
                  </div>
                  {billingSummary.budgetHours > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rozpočet:</span>
                        <span className="font-medium">{billingSummary.budgetHours}h ({billingSummary.budgetAmount.toLocaleString()} Kč)</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Využito z rozpočtu</span>
                          <span className={cn(
                            "font-medium",
                            billingSummary.budgetUsedPercent > 100 ? "text-red-600" :
                            billingSummary.budgetUsedPercent > 80 ? "text-orange-600" : "text-green-600"
                          )}>
                            {billingSummary.budgetUsedPercent}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(billingSummary.budgetUsedPercent, 100)}
                          className={cn(
                            "h-2",
                            billingSummary.budgetUsedPercent > 100 && "[&>div]:bg-red-500"
                          )}
                        />
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                    <Receipt className="h-4 w-4 mr-2" />
                    Vytvořit fakturu
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Export hodin
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Project Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Timeline projektu ({projectTimeline.length})
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setTimelineExpanded(!timelineExpanded)}
                >
                  {timelineExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              <CardDescription>Historie aktivit na projektu</CardDescription>
            </CardHeader>
            {timelineExpanded && (
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {projectTimeline.slice(0, 10).map((event) => {
                    const config = TIMELINE_EVENT_CONFIG[event.event_type]
                    const EventIcon = config.icon
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 transition-colors",
                          event.task_id && "cursor-pointer"
                        )}
                        onClick={() => event.task_id && router.push(`/accountant/tasks/${event.task_id}`)}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          config.bgColor
                        )}>
                          <EventIcon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{event.user_name}</span>
                            <span>•</span>
                            <span>{new Date(event.created_at).toLocaleDateString('cs-CZ')}</span>
                            {event.duration_minutes && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.duration_minutes} min
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {projectTimeline.length > 10 && (
                    <p className="text-sm text-center text-muted-foreground py-2">
                      + dalších {projectTimeline.length - 10} událostí
                    </p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Timeline only (if not billable) */}
      {!project.is_billable && projectTimeline.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Timeline projektu ({projectTimeline.length})
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTimelineExpanded(!timelineExpanded)}
              >
                {timelineExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {timelineExpanded && (
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {projectTimeline.slice(0, 10).map((event) => {
                  const config = TIMELINE_EVENT_CONFIG[event.event_type]
                  const EventIcon = config.icon
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 transition-colors",
                        event.task_id && "cursor-pointer"
                      )}
                      onClick={() => event.task_id && router.push(`/accountant/tasks/${event.task_id}`)}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        config.bgColor
                      )}>
                        <EventIcon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.user_name} • {new Date(event.created_at).toLocaleDateString('cs-CZ')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Phases and Tasks */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Fáze a úkoly
          </h2>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Upravit strukturu
          </Button>
        </div>

        {/* Phases */}
        {phases.length > 0 && (
          <div className="space-y-3">
            {phases.map(phase => (
              <PhaseSection key={phase.id} phase={phase} />
            ))}
          </div>
        )}

        {/* Unassigned tasks (not in any phase) */}
        {unassignedTasks.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Volné úkoly projektu
              </CardTitle>
              <CardDescription>
                Úkoly které nejsou přiřazeny k žádné fázi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {unassignedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isNextAction={nextAction?.id === task.id}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {phases.length === 0 && unassignedTasks.length === 0 && (
          <Card className="p-12 text-center">
            <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Žádné fáze ani úkoly</h3>
            <p className="text-muted-foreground mb-4">
              Tento projekt zatím nemá definované fáze ani úkoly.
            </p>
            <Button>
              Přidat fázi
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
