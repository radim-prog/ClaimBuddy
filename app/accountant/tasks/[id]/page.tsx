'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  User,
  Building2,
  AlertCircle,
  Zap,
  Users,
  Send,
  UserCheck,
  UserX,
  Target,
  ListTodo,
  MessageSquare,
  History,
  Play,
  Pause,
  Square,
  TrendingUp,
  Flame,
  Timer,
  MapPin,
  Heart,
  Phone,
  Mail,
  FileText,
  StickyNote,
  Video,
  Plus,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { GTDWizard } from '@/components/tasks/gtd-wizard'
import { TimeTracker, TimeTrackingEntry } from '@/components/tasks/time-tracker'
import { UrgencyBadge } from '@/components/tasks/UrgencyBadge'
import { UrgencyActions, ManagerActions } from '@/components/tasks/UrgencyActions'
import { Task, mockUsers, getReliabilityLabel, getReliabilityEmoji } from '@/lib/mock-data'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

// Calculate total score and priority
const calculateTotalScore = (task: Task): number => {
  return (task.score_money || 0) +
         (task.score_fire || 0) +
         (task.score_time || 0) +
         (task.score_distance || 0) +
         (task.score_personal || 0)
}

const getScorePriorityFromNumber = (score: number): { label: string; emoji: string; color: string } => {
  if (score >= 9) return { label: 'Vysoká', emoji: '🔥', color: 'text-white bg-red-500' }
  if (score >= 6) return { label: 'Střední', emoji: '⚠️', color: 'text-white bg-orange-500' }
  return { label: 'Nízká', emoji: '☑️', color: 'text-white bg-green-600' }
}

// Mock checklist items pro projekty
interface ChecklistItem {
  id: string
  task_id: string
  text: string
  position: number
  completed: boolean
  due_date?: string
  due_time?: string
  assigned_to?: string
  assigned_to_name?: string
  estimated_minutes?: number
  actual_minutes?: number
  completed_by?: string
  completed_at?: string
}

// Mock comment/timeline item
interface Comment {
  id: string
  task_id: string
  user_id: string
  user_name: string
  text: string
  created_at: string
}

// Extended timeline event types
type TimelineEventType =
  | 'created' | 'assigned' | 'accepted' | 'started' | 'completed' | 'delegated' | 'comment'
  | 'call' | 'email' | 'document' | 'note' | 'meeting' | 'decision'

interface TimelineEvent {
  id: string
  task_id: string
  event_type: TimelineEventType
  user_name: string
  description: string
  created_at: string
  duration_minutes?: number // For calls, meetings
  contact_name?: string // Who was contacted
  attachments?: Array<{ name: string; size: string }>
}

// Progress Notes - structured updates (like medical records)
interface ProgressNote {
  id: string
  task_id: string
  user_id: string
  user_name: string
  current_status: string // "Aktuální stav..."
  problems?: string // "Problémy..."
  next_steps?: string // "Další kroky..."
  created_at: string
}

// Timeline event configuration
const TIMELINE_EVENT_CONFIG: Record<TimelineEventType, {
  label: string;
  icon: typeof Phone;
  color: string;
  bgColor: string
}> = {
  created: { label: 'Vytvořeno', icon: Circle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  assigned: { label: 'Přiřazeno', icon: User, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  accepted: { label: 'Přijato', icon: UserCheck, color: 'text-green-600', bgColor: 'bg-green-100' },
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
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string
  const { userId, userName } = useAccountantUser()

  // All useState calls BEFORE any conditional returns (React rules of hooks)
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([])
  const [newComment, setNewComment] = useState('')
  const [showGTDWizard, setShowGTDWizard] = useState(false)
  const [showDelegateDialog, setShowDelegateDialog] = useState(false)
  const [delegateTo, setDelegateTo] = useState('')
  const [delegateReason, setDelegateReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [completionActualMinutes, setCompletionActualMinutes] = useState('')
  const [completionNote, setCompletionNote] = useState('')
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [rejectionComment, setRejectionComment] = useState('')
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [newEventType, setNewEventType] = useState<TimelineEventType>('call')
  const [newEventDescription, setNewEventDescription] = useState('')
  const [newEventContact, setNewEventContact] = useState('')
  const [newEventDuration, setNewEventDuration] = useState('')
  const [showProgressNoteDialog, setShowProgressNoteDialog] = useState(false)
  const [newProgressStatus, setNewProgressStatus] = useState('')
  const [newProgressProblems, setNewProgressProblems] = useState('')
  const [newProgressNextSteps, setNewProgressNextSteps] = useState('')
  const [timelineExpanded, setTimelineExpanded] = useState(true)
  const [timeEntries, setTimeEntries] = useState<TimeTrackingEntry[]>([])

  // Type-safe task updater (task is Task | null but handlers only run when task exists)
  const updateTask = (updater: (prev: Task) => Task) => {
    setTask(prev => prev ? updater(prev) : null)
  }

  // Current user from auth context
  const currentUser = { id: userId, name: userName, role: 'accountant' as const, email: '', phone_number: '', created_at: '' }
  const availableAccountants = mockUsers.filter(u => u.role !== 'client' && u.id !== userId)

  // Fetch task from Supabase API
  useEffect(() => {
    async function fetchTask() {
      if (!userId) return
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          headers: { 'x-user-id': userId }
        })
        if (!res.ok) {
          setFetchError('Úkol nenalezen')
          return
        }
        const data = await res.json()
        setTask(data.task)
        if (data.task.checklist_items) {
          setChecklistItems(data.task.checklist_items)
        }
        if (data.task.time_entries) {
          setTimeEntries(data.task.time_entries.map((te: any) => ({
            id: te.id,
            task_id: te.task_id || taskId,
            user_id: te.user_id,
            user_name: te.user_name || '',
            started_at: te.started_at,
            stopped_at: te.stopped_at,
            duration_minutes: te.duration_minutes,
            note: te.note || te.description || '',
            billable: te.billable || false,
            created_at: te.created_at,
          })))
        }
      } catch {
        setFetchError('Nepodařilo se načíst úkol')
      } finally {
        setLoading(false)
      }
    }
    fetchTask()
  }, [taskId, userId])

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Načítám úkol...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not found / error state
  if (fetchError || !task) {
    return (
      <div className="max-w-6xl">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Úkol nenalezen</h2>
            <p className="text-muted-foreground mb-4">
              {fetchError || `Úkol s ID ${taskId} neexistuje.`}
            </p>
            <Link href="/accountant/tasks">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zpět na seznam úkolů
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate R-Tasks total score
  const calculateTaskScore = (t: Task): number => {
    return (t.score_money || 0) +
           (t.score_fire || 0) +
           (t.score_time || 0) +
           (t.score_distance || 0) +
           (t.score_personal || 0)
  }

  // Derive priority level from R-Tasks score
  type ScorePriority = 'high' | 'medium' | 'low'
  const getScorePriority = (t: Task): ScorePriority => {
    const score = calculateTaskScore(t)
    if (score >= 9) return 'high'
    if (score >= 6) return 'medium'
    return 'low'
  }

  // Helper functions
  const getPriorityColor = (priority: ScorePriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'waiting_for':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'accepted':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'someday_maybe':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Čeká'
      case 'accepted': return 'Přijato'
      case 'in_progress': return 'Probíhá'
      case 'waiting_for': return 'Čeká na'
      case 'completed': return 'Dokončeno'
      case 'someday_maybe': return 'Někdy/Možná'
      default: return status
    }
  }

  // Calculate progress for projects
  const calculateProgress = () => {
    if (!task.is_project || checklistItems.length === 0) {
      return task.progress_percentage || 0
    }
    const completed = checklistItems.filter(item => item.completed).length
    return Math.round((completed / checklistItems.length) * 100)
  }

  // Calculate total time for projects
  const calculateTotalTime = () => {
    if (!task.is_project) {
      return {
        estimated: task.estimated_minutes || 0,
        actual: task.actual_minutes || 0,
      }
    }

    const estimated = checklistItems.reduce((sum, item) => sum + (item.estimated_minutes || 0), 0)
    const actual = checklistItems.reduce((sum, item) => sum + (item.actual_minutes || 0), 0)

    return { estimated, actual }
  }

  // Handlers
  const handleChecklistToggle = (itemId: string) => {
    setChecklistItems(prev => prev.map(item =>
      item.id === itemId
        ? {
            ...item,
            completed: !item.completed,
            completed_by: !item.completed ? currentUser.id : undefined,
            completed_at: !item.completed ? new Date().toISOString() : undefined,
          }
        : item
    ))
    toast.success('Checklist položka aktualizována')
  }

  const handleAcceptTask = () => {
    updateTask(prev => ({ ...prev, status: 'accepted' }))
    toast.success('Úkol přijat')
  }

  const handleDeclineTask = () => {
    // V produkci by byl dialog s důvodem
    toast.success('Úkol odmítnut')
    router.push('/accountant/tasks')
  }

  const handleDelegateTask = () => {
    setShowDelegateDialog(true)
  }

  const handleDelegateSubmit = () => {
    if (!delegateTo) {
      toast.error('Vyberte osobu pro delegování')
      return
    }

    const delegateUser = mockUsers.find(u => u.id === delegateTo)

    updateTask(prev => ({
      ...prev,
      status: 'pending',
      assigned_to: delegateTo,
      assigned_to_name: delegateUser?.name || '',
      updated_at: new Date().toISOString(),
    }))

    // Add to timeline
    setTimeline(prev => [...prev, {
      id: `timeline-delegate-${Date.now()}`,
      task_id: task.id,
      event_type: 'delegated' as const,
      user_name: currentUser.name,
      description: `Delegoval(a) úkol na: ${delegateUser?.name}${delegateReason ? ` (${delegateReason})` : ''}`,
      created_at: new Date().toISOString(),
    }])

    setShowDelegateDialog(false)
    setDelegateTo('')
    setDelegateReason('')
    toast.success(`Úkol delegován na ${delegateUser?.name}`)
  }

  const handleMarkComplete = () => {
    // Calculate total logged time from entries
    const totalLoggedMinutes = timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)

    // If we have logged time, pre-fill it; otherwise show dialog
    if (totalLoggedMinutes > 0) {
      setCompletionActualMinutes(totalLoggedMinutes.toString())
    } else if (task.actual_minutes) {
      setCompletionActualMinutes(task.actual_minutes.toString())
    } else {
      setCompletionActualMinutes('')
    }
    setShowCompletionDialog(true)
  }

  const handleSubmitCompletion = () => {
    const actualMinutes = parseInt(completionActualMinutes)
    if (isNaN(actualMinutes) || actualMinutes <= 0) {
      toast.error('Zadejte skutečný čas strávený na úkolu')
      return
    }

    // Task goes to awaiting_approval status (per gamification design)
    updateTask(prev => ({
      ...prev,
      status: 'awaiting_approval',
      actual_minutes: actualMinutes,
      progress_percentage: 100,
      updated_at: new Date().toISOString(),
    }))

    // Add to timeline
    setTimeline(prev => [...prev, {
      id: `timeline-submit-${Date.now()}`,
      task_id: task.id,
      event_type: 'completed' as const,
      user_name: currentUser.name,
      description: `Označil(a) jako hotovo (${actualMinutes} min)${completionNote ? ` - ${completionNote}` : ''}`,
      created_at: new Date().toISOString(),
    }])

    setShowCompletionDialog(false)
    setCompletionActualMinutes('')
    setCompletionNote('')
    toast.success('Úkol odeslán ke schválení')
  }

  // FÁZE 3: Approval handlers
  const handleApproveTask = () => {
    updateTask(prev => ({
      ...prev,
      status: 'completed',
      completed_at: new Date().toISOString(),
      approved_by: currentUser.id,
      approved_by_name: currentUser.name,
      approved_at: new Date().toISOString(),
    }))

    // Add to timeline
    setTimeline(prev => [...prev, {
      id: `timeline-approved-${Date.now()}`,
      task_id: task.id,
      event_type: 'completed' as const,
      user_name: currentUser.name,
      description: `Schválil(a) úkol`,
      created_at: new Date().toISOString(),
    }])

    toast.success('Úkol schválen a uzavřen')
  }

  const handleRejectTask = () => {
    if (!rejectionComment.trim()) {
      toast.error('Zadejte důvod vrácení')
      return
    }

    updateTask(prev => ({
      ...prev,
      status: 'in_progress',
      rejected_by: currentUser.id,
      rejected_by_name: currentUser.name,
      rejected_at: new Date().toISOString(),
      rejection_comment: rejectionComment,
      rejection_count: (prev.rejection_count || 0) + 1,
    }))

    // Add to timeline
    setTimeline(prev => [...prev, {
      id: `timeline-rejected-${Date.now()}`,
      task_id: task.id,
      event_type: 'comment' as const,
      user_name: currentUser.name,
      description: `Vrátil(a) úkol: ${rejectionComment}`,
      created_at: new Date().toISOString(),
    }])

    setShowRejectionDialog(false)
    setRejectionComment('')
    toast.warning('Úkol vrácen k přepracování')
  }

  // Check if current user is manager/admin (can approve)
  // Note: In production, only manager/admin. For demo we allow accountant to test the flow
  const canApprove = currentUser.role === 'accountant' || currentUser.role === 'assistant'

  // FÁZE 4: Claim handler for bonus tasks
  const handleClaimTask = () => {
    updateTask(prev => ({
      ...prev,
      claimed_by: currentUser.id,
      claimed_by_name: currentUser.name,
      claimed_at: new Date().toISOString(),
      assigned_to: currentUser.id,
      assigned_to_name: currentUser.name,
      status: 'accepted',
    }))

    // Add to timeline
    setTimeline(prev => [...prev, {
      id: `timeline-claimed-${Date.now()}`,
      task_id: task.id,
      event_type: 'assigned' as const,
      user_name: currentUser.name,
      description: `Převzal(a) bonus úkol (+${task.points_value || 0} bodů)`,
      created_at: new Date().toISOString(),
    }])

    toast.success(`Bonus úkol převzat! +${task.points_value || 0} bodů po dokončení`)
  }

  // Check if bonus task is available to claim
  const isBonusAvailable = task.task_type === 'bonus' && !task.claimed_by && !task.assigned_to
  const isBonusClaimed = task.task_type === 'bonus' && task.claimed_by

  const handleStartTask = () => {
    updateTask(prev => ({ ...prev, status: 'in_progress' }))
    toast.success('Úkol zahájen')
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      task_id: taskId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      text: newComment,
      created_at: new Date().toISOString(),
    }

    setComments(prev => [...prev, comment])
    setNewComment('')
    toast.success('Komentář přidán')
  }

  // Add timeline event (call, email, note, etc.)
  const handleAddTimelineEvent = () => {
    if (!newEventDescription.trim()) {
      toast.error('Zadejte popis události')
      return
    }

    const newEvent: TimelineEvent = {
      id: `timeline-${newEventType}-${Date.now()}`,
      task_id: taskId,
      event_type: newEventType,
      user_name: currentUser.name,
      description: newEventDescription,
      created_at: new Date().toISOString(),
      ...(newEventContact && { contact_name: newEventContact }),
      ...(newEventDuration && { duration_minutes: parseInt(newEventDuration) }),
    }

    setTimeline(prev => [...prev, newEvent].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ))

    // Reset form
    setShowEventDialog(false)
    setNewEventDescription('')
    setNewEventContact('')
    setNewEventDuration('')

    const config = TIMELINE_EVENT_CONFIG[newEventType]
    toast.success(`${config.label} zaznamenán`)
  }

  // Add progress note
  const handleAddProgressNote = () => {
    if (!newProgressStatus.trim()) {
      toast.error('Zadejte aktuální stav')
      return
    }

    const newNote: ProgressNote = {
      id: `progress-${Date.now()}`,
      task_id: taskId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      current_status: newProgressStatus,
      problems: newProgressProblems || undefined,
      next_steps: newProgressNextSteps || undefined,
      created_at: new Date().toISOString(),
    }

    setProgressNotes(prev => [newNote, ...prev])

    // Reset form
    setShowProgressNoteDialog(false)
    setNewProgressStatus('')
    setNewProgressProblems('')
    setNewProgressNextSteps('')

    toast.success('Progress note přidán')
  }

  const handleTimeUpdate = (actualMinutes: number, entries: TimeTrackingEntry[]) => {
    updateTask(prev => ({ ...prev, actual_minutes: actualMinutes }))
    setTimeEntries(entries)
  }

  const handleGTDWizardComplete = async (data: any) => {
    // Update task with GTD data
    updateTask(prev => ({
      ...prev,
      title: data.title,
      description: data.description,
      is_project: data.isProject,
      project_outcome: data.projectOutcome,
      gtd_context: data.contexts,
      gtd_energy_level: data.energyLevel,
      gtd_is_quick_action: data.isQuickAction,
      estimated_minutes: data.estimatedMinutes,
      is_billable: data.isBillable,
      hourly_rate: data.hourlyRate,
      due_date: data.dueDate,
      assigned_to: data.assignedTo,
    }))

    setShowGTDWizard(false)
    toast.success('Úkol aktualizován')
  }

  const timeData = calculateTotalTime()
  const progress = calculateProgress()

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/accountant/tasks">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zpět na úkoly
          </Button>
        </Link>

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
              {/* FÁZE 4: Task Type Badge (BASE/BONUS) */}
              {task.task_type === 'bonus' && (
                <Badge className="bg-amber-500 text-white font-semibold shadow-sm">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  💰 BONUS {task.points_value && `+${task.points_value}b`}
                </Badge>
              )}
              {task.gtd_is_quick_action && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                  <Zap className="h-3 w-3 mr-1" />
                  &lt; 2 min
                </Badge>
              )}
              {task.is_project && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                  <Target className="h-3 w-3 mr-1" />
                  Projekt
                </Badge>
              )}
              {/* Urgency Badge */}
              <UrgencyBadge task={task} showDetails size="md" />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {task.company_name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(task.due_date).toLocaleDateString('cs-CZ')}
                {task.due_time && ` ${task.due_time}`}
              </div>
              {task.assigned_to_name && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {task.assigned_to_name}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Badge
              variant="outline"
              className={getPriorityColor(getScorePriority(task))}
              title={`R-Tasks skóre: ${calculateTaskScore(task)}/12`}
            >
              {calculateTaskScore(task)} • {getScorePriority(task) === 'high' ? 'Vysoká' : getScorePriority(task) === 'medium' ? 'Střední' : 'Nízká'}
            </Badge>
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {getStatusLabel(task.status)}
            </Badge>
          </div>
        </div>

        {/* Progress bar for projects */}
        {task.is_project && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">Progress projektu</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">{progress}%</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {task.project_outcome && (
                <p className="text-sm text-purple-700 mt-2">
                  <strong>Cíl:</strong> {task.project_outcome}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Task Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Popis úkolu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                {task.description || 'Žádný popis.'}
              </p>
            </CardContent>
          </Card>

          {/* Waiting For Info */}
          {task.is_waiting_for && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-900">
                  <Clock className="h-5 w-5" />
                  Čekám na
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {task.waiting_for_who && (
                  <div>
                    <Label className="text-yellow-900">Kdo:</Label>
                    <p className="text-yellow-800 font-medium">{task.waiting_for_who}</p>
                  </div>
                )}
                {task.waiting_for_what && (
                  <div>
                    <Label className="text-yellow-900">Co:</Label>
                    <p className="text-yellow-800 font-medium">{task.waiting_for_what}</p>
                  </div>
                )}

                {/* Urgency Actions */}
                <Separator className="my-3" />
                <div className="pt-2">
                  <Label className="text-yellow-900 mb-2 block">Urgování klienta:</Label>
                  <UrgencyActions
                    task={task}
                    onTaskUpdate={(updated) => setTask(updated)}
                  />
                </div>

                {/* Manager Actions - for escalated tasks */}
                {task.escalated_to && (
                  <div className="pt-2 mt-2">
                    <ManagerActions
                      task={task}
                      onTaskUpdate={(updated) => setTask(updated)}
                      currentUserId={userId}
                    />
                  </div>
                )}

                {/* Reliability Score - TODO: fetch from company API */}
                {task.company_id && (
                  <div className="pt-3 border-t border-yellow-200 mt-3">
                    <Label className="text-yellow-900 text-xs">Spolehlivost klienta:</Label>
                    <p className="text-yellow-800 font-medium flex items-center gap-1">
                      {getReliabilityEmoji(2)} {getReliabilityLabel(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Checklist (for projects) */}
          {task.is_project && checklistItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Dílčí úkoly ({checklistItems.filter(i => i.completed).length}/{checklistItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                      item.completed
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    )}
                    onClick={() => handleChecklistToggle(item.id)}
                  >
                    <Checkbox checked={item.completed} className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-medium",
                          item.completed && "line-through text-gray-500 dark:text-gray-400"
                        )}>
                          {item.text}
                        </span>
                        {item.estimated_minutes && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {item.estimated_minutes} min
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {item.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.due_date).toLocaleDateString('cs-CZ')}
                          </div>
                        )}
                        {item.assigned_to_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.assigned_to_name}
                          </div>
                        )}
                        {item.actual_minutes && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            {item.actual_minutes} min (skutečně)
                          </div>
                        )}
                      </div>
                      {item.completed && item.completed_at && (
                        <div className="text-xs text-green-600" suppressHydrationWarning>
                          Dokončeno: {new Date(item.completed_at).toLocaleString('cs-CZ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Komentáře ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {new Date(comment.created_at).toLocaleString('cs-CZ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{comment.text}</p>
                </div>
              ))}

              {/* Add comment */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="new-comment">Přidat komentář</Label>
                <Textarea
                  id="new-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Napište komentář..."
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Přidat komentář
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Notes - Structured Updates */}
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-emerald-600" />
                  Aktuální stav
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowProgressNoteDialog(true)}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat update
                </Button>
              </div>
              <CardDescription>Strukturované poznámky o průběhu práce</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {progressNotes.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Zatím žádné progress notes</p>
                </div>
              ) : (
                progressNotes.map((note) => (
                  <div key={note.id} className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-emerald-800">{note.user_name}</span>
                      <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {new Date(note.created_at).toLocaleString('cs-CZ')}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-emerald-700 uppercase">Aktuální stav</p>
                          <p className="text-sm text-gray-700 dark:text-gray-200">{note.current_status}</p>
                        </div>
                      </div>

                      {note.problems && (
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-orange-700 uppercase">Problémy</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200">{note.problems}</p>
                          </div>
                        </div>
                      )}

                      {note.next_steps && (
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-blue-700 uppercase">Další kroky</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200">{note.next_steps}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Timeline - Enhanced with more event types */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Timeline ({timeline.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEventDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Zaznamenat
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTimelineExpanded(!timelineExpanded)}
                  >
                    {timelineExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {timelineExpanded && (
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((event, index) => {
                    const config = TIMELINE_EVENT_CONFIG[event.event_type]
                    const EventIcon = config.icon
                    return (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            config.bgColor
                          )}>
                            <EventIcon className={cn("h-4 w-4", config.color)} />
                          </div>
                          {index < timeline.length - 1 && (
                            <div className="w-0.5 flex-1 min-h-[16px] bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={cn("text-xs", config.bgColor, config.color)}>
                              {config.label}
                            </Badge>
                            {event.duration_minutes && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {event.duration_minutes} min
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">{event.description}</p>
                          {event.contact_name && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {event.contact_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {event.user_name} • {new Date(event.created_at).toLocaleString('cs-CZ')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Akce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* FÁZE 4: Bonus task claim section */}
              {isBonusAvailable && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">
                      Bonus úkol dostupný!
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mb-3">
                    Tento úkol můžete převzít a získat {task.points_value || 0} bodů po dokončení.
                  </p>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleClaimTask}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Převzít bonus úkol (+{task.points_value || 0}b)
                  </Button>
                </div>
              )}

              {/* Show claimed info if bonus was claimed by someone else */}
              {isBonusClaimed && task.claimed_by !== currentUser.id && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border mb-2">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>Převzal(a):</strong> {task.claimed_by_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400" suppressHydrationWarning>
                    {task.claimed_at && new Date(task.claimed_at).toLocaleString('cs-CZ')}
                  </p>
                </div>
              )}

              {task.status === 'pending' && (
                <>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleAcceptTask}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Přijmout úkol
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleDeclineTask}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Odmítnout
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleDelegateTask}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Delegovat
                  </Button>
                </>
              )}

              {task.status === 'accepted' && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleStartTask}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Začít pracovat
                </Button>
              )}

              {(task.status === 'in_progress' || task.status === 'accepted') && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleMarkComplete}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Označit jako hotovo
                </Button>
              )}

              {/* FÁZE 3: Approval section for awaiting_approval status */}
              {task.status === 'awaiting_approval' && canApprove && (
                <>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-2">
                    <p className="text-sm text-amber-800 font-medium mb-1">
                      Čeká na schválení
                    </p>
                    <p className="text-xs text-amber-700">
                      Skutečný čas: {task.actual_minutes} min
                      {task.estimated_minutes && ` (odhad: ${task.estimated_minutes} min)`}
                    </p>
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleApproveTask}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Schválit
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setShowRejectionDialog(true)}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Vrátit k přepracování
                  </Button>
                </>
              )}

              {/* Info for awaiting_approval status when user cannot approve */}
              {task.status === 'awaiting_approval' && !canApprove && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    Čeká na schválení manažerem
                  </p>
                  <p className="text-xs text-blue-700">
                    Váš úkol byl odeslán ke schválení. Bude zpracován do následujícího pracovního dne.
                  </p>
                </div>
              )}

              <Separator />

              <Button
                className="w-full"
                variant="outline"
                onClick={() => setShowGTDWizard(true)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Upravit (GTD Wizard)
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  if (confirm('Opravdu chcete smazat tento úkol?')) {
                    toast.success('Úkol smazán')
                    router.push('/accountant/tasks')
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Smazat úkol
              </Button>
            </CardContent>
          </Card>

          {/* Time Tracking */}
          {!task.is_project && (
            <TimeTracker
              taskId={task.id}
              estimatedMinutes={task.estimated_minutes}
              actualMinutes={task.actual_minutes}
              hourlyRate={task.hourly_rate}
              isBillable={task.is_billable}
              isProject={false}
              onTimeUpdate={handleTimeUpdate}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name}
              initialEntries={timeEntries}
            />
          )}

          {/* Project Time Summary */}
          {task.is_project && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Časový souhrn
                </CardTitle>
                <CardDescription>Automaticky sečteno z dílčích úkolů</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Odhad:</span>
                    <span className="font-semibold">{timeData.estimated} min ({(timeData.estimated / 60).toFixed(1)}h)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Skutečně:</span>
                    <span className="font-semibold">{timeData.actual} min ({(timeData.actual / 60).toFixed(1)}h)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rozdíl:</span>
                    <span className={cn(
                      "font-semibold",
                      timeData.actual > timeData.estimated ? "text-red-600" : "text-green-600"
                    )}>
                      {timeData.actual > timeData.estimated ? '+' : ''}{timeData.actual - timeData.estimated} min
                    </span>
                  </div>
                </div>

                {task.is_billable && task.hourly_rate && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Fakturace</h4>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Sazba:</span>
                        <span className="font-semibold">{task.hourly_rate} Kč/hod</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Celkem:</span>
                        <span className="font-semibold text-green-600">
                          {Math.round((timeData.actual / 60) * task.hourly_rate).toLocaleString()} Kč
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* R-Tasks Scoring */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  R-Tasks Score
                </div>
                <Badge className={cn("text-lg px-3 py-1", getScorePriorityFromNumber(calculateTotalScore(task)).color)}>
                  {getScorePriorityFromNumber(calculateTotalScore(task)).emoji} {calculateTotalScore(task)}/12
                </Badge>
              </CardTitle>
              <CardDescription>
                Priorita: {getScorePriorityFromNumber(calculateTotalScore(task)).label}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Quick Action Notice & Upgrade */}
              {task.gtd_is_quick_action && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800">Rychlá akce (&lt;30 min)</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-3">
                    Skóre není vyžadováno pro rychlé akce. Pokud se úkol rozroste, můžete ho povýšit.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      onClick={() => {
                        updateTask(prev => ({
                          ...prev,
                          gtd_is_quick_action: false,
                          // Set default R-Tasks scores when upgrading
                          score_money: prev.score_money ?? 1,
                          score_fire: prev.score_fire ?? 1,
                          score_time: prev.score_time ?? 1,
                          score_distance: prev.score_distance ?? 2,
                          score_personal: prev.score_personal ?? 0,
                        }))
                        toast.success('Úkol povýšen na plnohodnotný úkol')
                      }}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Povýšit na úkol
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      onClick={() => {
                        updateTask(prev => ({
                          ...prev,
                          gtd_is_quick_action: false,
                          is_project: true,
                          // Set default R-Tasks scores when upgrading
                          score_money: prev.score_money ?? 1,
                          score_fire: prev.score_fire ?? 1,
                          score_time: prev.score_time ?? 1,
                          score_distance: prev.score_distance ?? 2,
                          score_personal: prev.score_personal ?? 0,
                        }))
                        toast.success('Rychlá akce povýšena na projekt')
                      }}
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Povýšit na projekt
                    </Button>
                  </div>
                </div>
              )}

              {/* Optional label for quick actions */}
              {task.gtd_is_quick_action && (
                <p className="text-xs text-muted-foreground italic mb-2">
                  Skóre je volitelné, ale můžete ho nastavit pro lepší přehled.
                </p>
              )}

              {/* Upgrade regular task to project */}
              {!task.gtd_is_quick_action && !task.is_project && (
                <div className="flex justify-end mb-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    onClick={() => {
                      updateTask(prev => ({
                        ...prev,
                        is_project: true,
                      }))
                      toast.success('Úkol povýšen na projekt')
                    }}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    Povýšit na projekt
                  </Button>
                </div>
              )}

              {/* Downgrade project to task */}
              {task.is_project && (
                <div className="flex justify-end mb-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      updateTask(prev => ({
                        ...prev,
                        is_project: false,
                      }))
                      toast.success('Projekt převeden na úkol')
                    }}
                  >
                    <ListTodo className="h-3 w-3 mr-1" />
                    Převést na úkol
                  </Button>
                </div>
              )}

              {/* Money Value */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>💰</span> Money Value
                </Label>
                <Select
                  value={task.score_money?.toString() || '0'}
                  onValueChange={(v) => {
                    updateTask(prev => ({ ...prev, score_money: parseInt(v) as 0|1|2|3 }))
                    toast.success('Score aktualizováno')
                  }}
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
                  value={task.score_fire?.toString() || '0'}
                  onValueChange={(v) => {
                    updateTask(prev => ({ ...prev, score_fire: parseInt(v) as 0|1|2|3 }))
                    toast.success('Score aktualizováno')
                  }}
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
                  value={task.score_time?.toString() || '0'}
                  onValueChange={(v) => {
                    updateTask(prev => ({ ...prev, score_time: parseInt(v) as 0|1|2|3 }))
                    toast.success('Score aktualizováno')
                  }}
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
                  value={task.score_distance?.toString() || '0'}
                  onValueChange={(v) => {
                    updateTask(prev => ({ ...prev, score_distance: parseInt(v) as 0|1|2 }))
                    toast.success('Score aktualizováno')
                  }}
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
                  value={task.score_personal?.toString() || '0'}
                  onValueChange={(v) => {
                    updateTask(prev => ({ ...prev, score_personal: parseInt(v) as 0|1 }))
                    toast.success('Score aktualizováno')
                  }}
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
                  <span className="font-semibold">{task.score_money || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>🔥 Fire:</span>
                  <span className="font-semibold">{task.score_fire || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>⏱️ Time:</span>
                  <span className="font-semibold">{task.score_time || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>📍 Distance:</span>
                  <span className="font-semibold">{task.score_distance || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>❤️ Personal:</span>
                  <span className="font-semibold">{task.score_personal || 0}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total:</span>
                  <span>{calculateTotalScore(task)}/12</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GTD Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                GTD Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.gtd_context && task.gtd_context.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Kontext</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {task.gtd_context.map((context) => (
                      <Badge key={context} variant="outline">{context}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {task.gtd_energy_level && (
                <div>
                  <Label className="text-xs text-muted-foreground">Úroveň energie</Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {task.gtd_energy_level === 'high' ? 'Vysoká' : task.gtd_energy_level === 'medium' ? 'Střední' : 'Nízká'}
                    </Badge>
                  </div>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Štítky</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* GTD Wizard Dialog */}
      {showGTDWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <GTDWizard
              companyId={task.company_id}
              companyName={task.company_name}
              onComplete={handleGTDWizardComplete}
              onCancel={() => setShowGTDWizard(false)}
              initialData={{
                title: task.title,
                description: task.description,
                isProject: task.is_project,
                projectOutcome: task.project_outcome || '',
                isQuickAction: task.gtd_is_quick_action || false,
                shouldDelegate: false,
                contexts: (task.gtd_context || []) as string[],
                energyLevel: task.gtd_energy_level || '',
                estimatedMinutes: task.estimated_minutes,
                isBillable: task.is_billable,
                hourlyRate: task.hourly_rate,
                dueDate: task.due_date,
                assignedTo: task.assigned_to,
                subtasks: [],
              }}
              availableUsers={mockUsers.map(u => ({ id: u.id, name: u.name }))}
            />
          </div>
        </div>
      )}

      {/* Delegation Dialog */}
      <Dialog open={showDelegateDialog} onOpenChange={setShowDelegateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Delegovat úkol
            </DialogTitle>
            <DialogDescription>
              Vyberte kolegu, kterému chcete úkol delegovat
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delegate-to">Delegovat komu *</Label>
              <Select value={delegateTo} onValueChange={setDelegateTo}>
                <SelectTrigger id="delegate-to">
                  <SelectValue placeholder="Vyberte osobu..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAccountants.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{user.name}</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          {user.role === 'accountant' ? 'Účetní' : user.role === 'assistant' ? 'Asistent' : user.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delegate-reason">Důvod delegování (volitelné)</Label>
              <Textarea
                id="delegate-reason"
                value={delegateReason}
                onChange={(e) => setDelegateReason(e.target.value)}
                placeholder="Např. lepší znalost klienta, kapacita..."
                rows={3}
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Delegovaný úkol bude čekat na přijetí od vybrané osoby.
                Budete informováni, až úkol přijme nebo odmítne.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDelegateDialog(false)
                setDelegateTo('')
                setDelegateReason('')
              }}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleDelegateSubmit}
              disabled={!delegateTo}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Users className="mr-2 h-4 w-4" />
              Delegovat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog - FÁZE 2: actual_minutes required before completion */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Dokončit úkol
            </DialogTitle>
            <DialogDescription>
              Vyplňte skutečný čas strávený na úkolu před odesláním ke schválení
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Estimate vs Actual comparison */}
            {task.estimated_minutes && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Odhad:</span>
                  <span className="font-semibold">{task.estimated_minutes} min</span>
                </div>
                {timeEntries.length > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-muted-foreground">Zalogováno:</span>
                    <span className="font-semibold">
                      {timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)} min
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="completion-actual-minutes">
                Skutečný čas (minuty) *
              </Label>
              <Input
                id="completion-actual-minutes"
                type="number"
                min="1"
                placeholder="Např. 45"
                value={completionActualMinutes}
                onChange={(e) => setCompletionActualMinutes(e.target.value)}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Tento údaj slouží pro vzdělávací účely - porovnání s odhadem.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion-note">Poznámka (volitelné)</Label>
              <Textarea
                id="completion-note"
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="Co bylo uděláno, poznámky pro manažera..."
                rows={3}
              />
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900">
                <strong>Info:</strong> Po odeslání bude úkol čekat na schválení manažerem.
                Schválením se úkol uzavře a body (pokud jsou) budou připsány.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCompletionDialog(false)
                setCompletionActualMinutes('')
                setCompletionNote('')
              }}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleSubmitCompletion}
              disabled={!completionActualMinutes || parseInt(completionActualMinutes) <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Odeslat ke schválení
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FÁZE 3: Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Vrátit úkol k přepracování
            </DialogTitle>
            <DialogDescription>
              Úkol bude vrácen zpět do stavu "Probíhá". Zadejte důvod vrácení.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-comment">
                Důvod vrácení *
              </Label>
              <Textarea
                id="rejection-comment"
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Popište co je potřeba opravit nebo doplnit..."
                rows={4}
                className="resize-none"
              />
            </div>

            {(task.rejection_count || 0) > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>Upozornění:</strong> Tento úkol byl již {task.rejection_count}× vrácen.
                  Opakované vrácení ovlivňuje quality score účetního.
                </p>
              </div>
            )}

            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                <strong>Info:</strong> Vrácený úkol se zobrazí účetnímu s vaším komentářem
                a bude opět potřeba odeslat ke schválení.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectionDialog(false)
                setRejectionComment('')
              }}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleRejectTask}
              disabled={!rejectionComment.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Vrátit úkol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timeline Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Zaznamenat událost
            </DialogTitle>
            <DialogDescription>
              Přidejte záznam o komunikaci nebo aktivitě
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Typ události *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['call', 'email', 'note', 'meeting', 'document', 'decision'] as TimelineEventType[]).map((type) => {
                  const config = TIMELINE_EVENT_CONFIG[type]
                  const Icon = config.icon
                  return (
                    <Button
                      key={type}
                      variant={newEventType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewEventType(type)}
                      className={cn(
                        "flex flex-col h-auto py-2",
                        newEventType === type && config.bgColor
                      )}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{config.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Popis *</Label>
              <Textarea
                id="event-description"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                placeholder="Co se stalo..."
                rows={3}
              />
            </div>

            {(newEventType === 'call' || newEventType === 'email' || newEventType === 'meeting') && (
              <div className="space-y-2">
                <Label htmlFor="event-contact">Kontakt / S kým</Label>
                <Input
                  id="event-contact"
                  value={newEventContact}
                  onChange={(e) => setNewEventContact(e.target.value)}
                  placeholder="Jméno nebo firma..."
                />
              </div>
            )}

            {(newEventType === 'call' || newEventType === 'meeting') && (
              <div className="space-y-2">
                <Label htmlFor="event-duration">Délka (minuty)</Label>
                <Input
                  id="event-duration"
                  type="number"
                  min="1"
                  value={newEventDuration}
                  onChange={(e) => setNewEventDuration(e.target.value)}
                  placeholder="15"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEventDialog(false)
                setNewEventDescription('')
                setNewEventContact('')
                setNewEventDuration('')
              }}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleAddTimelineEvent}
              disabled={!newEventDescription.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Přidat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Note Dialog */}
      <Dialog open={showProgressNoteDialog} onOpenChange={setShowProgressNoteDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Lightbulb className="h-5 w-5" />
              Přidat progress note
            </DialogTitle>
            <DialogDescription>
              Strukturovaná poznámka o aktuálním stavu práce
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="progress-status" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Aktuální stav *
              </Label>
              <Textarea
                id="progress-status"
                value={newProgressStatus}
                onChange={(e) => setNewProgressStatus(e.target.value)}
                placeholder="Popište aktuální stav práce..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress-problems" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Problémy (volitelné)
              </Label>
              <Textarea
                id="progress-problems"
                value={newProgressProblems}
                onChange={(e) => setNewProgressProblems(e.target.value)}
                placeholder="Jaké problémy nebo překážky..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress-next" className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                Další kroky (volitelné)
              </Label>
              <Textarea
                id="progress-next"
                value={newProgressNextSteps}
                onChange={(e) => setNewProgressNextSteps(e.target.value)}
                placeholder="Co bude následovat..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowProgressNoteDialog(false)
                setNewProgressStatus('')
                setNewProgressProblems('')
                setNewProgressNextSteps('')
              }}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleAddProgressNote}
              disabled={!newProgressStatus.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Přidat note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
