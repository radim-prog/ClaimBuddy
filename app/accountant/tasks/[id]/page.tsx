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
} from 'lucide-react'
import { GTDWizard } from '@/components/tasks/gtd-wizard'
import { TimeTracker, TimeTrackingEntry } from '@/components/tasks/time-tracker'
import { mockTasks, Task, mockUsers } from '@/lib/mock-data'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

interface TimelineEvent {
  id: string
  task_id: string
  event_type: 'created' | 'assigned' | 'accepted' | 'started' | 'completed' | 'delegated' | 'comment'
  user_name: string
  description: string
  created_at: string
}

// Generate mock checklist for project
function generateMockChecklist(taskId: string): ChecklistItem[] {
  if (taskId !== 'task-10' && taskId !== 'task-11') return []

  return [
    {
      id: 'check-1',
      task_id: taskId,
      text: 'Nastavit nový účetní systém',
      position: 1,
      completed: true,
      due_date: '2025-11-20',
      assigned_to: 'user-2-accountant',
      assigned_to_name: 'Jana Svobodová',
      estimated_minutes: 120,
      actual_minutes: 110,
      completed_by: 'user-2-accountant',
      completed_at: '2025-11-20T15:00:00Z',
    },
    {
      id: 'check-2',
      task_id: taskId,
      text: 'Migrovat historická data',
      position: 2,
      completed: true,
      due_date: '2025-11-25',
      assigned_to: 'user-2-accountant',
      assigned_to_name: 'Jana Svobodová',
      estimated_minutes: 180,
      actual_minutes: 200,
      completed_by: 'user-2-accountant',
      completed_at: '2025-11-25T17:30:00Z',
    },
    {
      id: 'check-3',
      task_id: taskId,
      text: 'Vyškolit klienta na nový systém',
      position: 3,
      completed: false,
      due_date: '2025-12-10',
      assigned_to: 'user-2-accountant',
      assigned_to_name: 'Jana Svobodová',
      estimated_minutes: 120,
    },
    {
      id: 'check-4',
      task_id: taskId,
      text: 'Zpracovat první měsíc v novém systému',
      position: 4,
      completed: false,
      due_date: '2025-12-20',
      assigned_to: 'user-2-accountant',
      assigned_to_name: 'Jana Svobodová',
      estimated_minutes: 90,
    },
    {
      id: 'check-5',
      task_id: taskId,
      text: 'Ověřit správnost migrace',
      position: 5,
      completed: false,
      due_date: '2025-12-30',
      assigned_to: 'user-2-accountant',
      assigned_to_name: 'Jana Svobodová',
      estimated_minutes: 60,
    },
  ]
}

// Generate mock comments
function generateMockComments(taskId: string): Comment[] {
  return [
    {
      id: 'comment-1',
      task_id: taskId,
      user_id: 'user-2-accountant',
      user_name: 'Jana Svobodová',
      text: 'Začínám pracovat na tomto úkolu. Kontaktovala jsem klienta.',
      created_at: '2025-12-06T09:00:00Z',
    },
    {
      id: 'comment-2',
      task_id: taskId,
      user_id: 'user-2-accountant',
      user_name: 'Jana Svobodová',
      text: 'Klient potvrdil dostupnost podkladů. Pokračuji.',
      created_at: '2025-12-06T11:30:00Z',
    },
  ]
}

// Generate mock timeline
function generateMockTimeline(task: Task): TimelineEvent[] {
  return [
    {
      id: 'timeline-1',
      task_id: task.id,
      event_type: 'created',
      user_name: task.created_by_name,
      description: `Vytvořil(a) úkol`,
      created_at: task.created_at,
    },
    {
      id: 'timeline-2',
      task_id: task.id,
      event_type: 'assigned',
      user_name: task.created_by_name,
      description: `Přiřadil(a) úkol: ${task.assigned_to_name}`,
      created_at: task.created_at,
    },
    ...(task.status === 'accepted' || task.status === 'in_progress' || task.status === 'completed' ? [{
      id: 'timeline-3',
      task_id: task.id,
      event_type: 'accepted' as const,
      user_name: task.assigned_to_name || task.created_by_name,
      description: `Přijal(a) úkol`,
      created_at: new Date(new Date(task.created_at).getTime() + 3600000).toISOString(),
    }] : []),
    ...(task.status === 'in_progress' || task.status === 'completed' ? [{
      id: 'timeline-4',
      task_id: task.id,
      event_type: 'started' as const,
      user_name: task.assigned_to_name || task.created_by_name,
      description: `Začal(a) pracovat`,
      created_at: task.updated_at,
    }] : []),
    ...(task.status === 'completed' && task.completed_at ? [{
      id: 'timeline-5',
      task_id: task.id,
      event_type: 'completed' as const,
      user_name: task.assigned_to_name || task.created_by_name,
      description: `Dokončil(a) úkol`,
      created_at: task.completed_at,
    }] : []),
  ]
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  // Find task
  const initialTask = mockTasks.find(t => t.id === taskId)
  if (!initialTask) {
    return (
      <div className="max-w-6xl">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Úkol nenalezen</h2>
            <p className="text-muted-foreground mb-4">
              Úkol s ID {taskId} neexistuje.
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

  const [task, setTask] = useState<Task>(initialTask)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(generateMockChecklist(taskId))
  const [comments, setComments] = useState<Comment[]>(generateMockComments(taskId))
  const [timeline, setTimeline] = useState<TimelineEvent[]>(generateMockTimeline(initialTask))
  const [newComment, setNewComment] = useState('')
  const [showGTDWizard, setShowGTDWizard] = useState(false)
  const [saving, setSaving] = useState(false)

  const currentUser = mockUsers[1] // Jana Svobodová (accountant)

  // Helper functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
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
        return 'bg-gray-100 text-gray-700 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
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
    setTask(prev => ({ ...prev, status: 'accepted' }))
    toast.success('Úkol přijat')
  }

  const handleRejectTask = () => {
    // V produkci by byl dialog s důvodem
    toast.success('Úkol odmítnut')
    router.push('/accountant/tasks')
  }

  const handleDelegateTask = () => {
    // V produkci by byl GTD Wizard s delegací
    toast.info('Delegování zatím není implementováno')
  }

  const handleMarkComplete = () => {
    setTask(prev => ({
      ...prev,
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress_percentage: 100,
    }))
    toast.success('Úkol označen jako dokončený')
  }

  const handleStartTask = () => {
    setTask(prev => ({ ...prev, status: 'in_progress' }))
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

  const handleTimeUpdate = (actualMinutes: number, entries: TimeTrackingEntry[]) => {
    setTask(prev => ({ ...prev, actual_minutes: actualMinutes }))
  }

  const handleGTDWizardComplete = async (data: any) => {
    // Update task with GTD data
    setTask(prev => ({
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
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
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
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {task.priority === 'critical' ? 'Kritická' : task.priority === 'high' ? 'Vysoká' : task.priority === 'medium' ? 'Střední' : 'Nízká'}
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
              <p className="text-gray-700 whitespace-pre-wrap">
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
                        : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                    )}
                    onClick={() => handleChecklistToggle(item.id)}
                  >
                    <Checkbox checked={item.completed} className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-medium",
                          item.completed && "line-through text-gray-500"
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
                        <div className="text-xs text-green-600">
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
                <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString('cs-CZ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.text}</p>
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
                >
                  <Send className="mr-2 h-4 w-4" />
                  Přidat komentář
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Timeline změn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        event.event_type === 'created' && "bg-blue-100",
                        event.event_type === 'assigned' && "bg-purple-100",
                        event.event_type === 'accepted' && "bg-green-100",
                        event.event_type === 'started' && "bg-orange-100",
                        event.event_type === 'completed' && "bg-green-100",
                      )}>
                        {event.event_type === 'created' && <Circle className="h-4 w-4 text-blue-600" />}
                        {event.event_type === 'assigned' && <User className="h-4 w-4 text-purple-600" />}
                        {event.event_type === 'accepted' && <UserCheck className="h-4 w-4 text-green-600" />}
                        {event.event_type === 'started' && <Play className="h-4 w-4 text-orange-600" />}
                        {event.event_type === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">{event.description}</p>
                      <p className="text-xs text-muted-foreground">{event.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString('cs-CZ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
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
                    onClick={handleRejectTask}
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
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
    </div>
  )
}
