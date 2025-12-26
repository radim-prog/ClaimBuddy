'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Target,
  Clock,
  Users,
  Zap,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  TrendingUp,
  Flame,
  Timer,
  MapPin,
  Heart,
  Building2,
  User,
  FolderKanban,
  ListTodo,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockCompanies, mockUsers, MOCK_CONFIG } from '@/lib/mock-data'
import { toast } from 'sonner'

// R-Tasks Scoring Configuration
const SCORE_OPTIONS = {
  money: [
    { value: 0, label: '0 - Méně než 5k Kč', color: 'text-gray-600' },
    { value: 1, label: '1 - 5k+ Kč', color: 'text-purple-600' },
    { value: 2, label: '2 - 15k+ Kč', color: 'text-blue-600' },
    { value: 3, label: '3 - 50k+ Kč', color: 'text-green-600' },
  ],
  fire: [
    { value: 0, label: '0 - Nízká urgence', color: 'text-green-600' },
    { value: 1, label: '1 - Normální', color: 'text-blue-600' },
    { value: 2, label: '2 - Vysoká', color: 'text-orange-600' },
    { value: 3, label: '3 - Kritická', color: 'text-red-600' },
  ],
  time: [
    { value: 0, label: '0 - Den a více', color: 'text-red-600' },
    { value: 1, label: '1 - 2-4 hodiny', color: 'text-orange-600' },
    { value: 2, label: '2 - Pod 1 hodinu', color: 'text-blue-600' },
    { value: 3, label: '3 - Pod 30 minut', color: 'text-green-600' },
  ],
  distance: [
    { value: 0, label: '0 - Vyžaduje cestování', color: 'text-red-600' },
    { value: 1, label: '1 - Lokálně', color: 'text-blue-600' },
    { value: 2, label: '2 - Z počítače', color: 'text-green-600' },
  ],
  personal: [
    { value: 0, label: '0 - Nechce se mi', color: 'text-red-600' },
    { value: 1, label: '1 - V pohodě', color: 'text-green-600' },
  ],
}

interface SubTask {
  id: string
  title: string
}

interface Dependency {
  type: 'client' | 'colleague' | 'blocker'
  description: string
  person_id?: string
  person_name?: string
}

export interface TaskWizardData {
  // Step 1: What
  title: string
  outcome: string
  description?: string
  client_id?: string
  client_name?: string

  // Step 2: How big
  estimated_minutes: number
  subtasks: SubTask[]

  // Step 3: Dependencies
  dependencies: Dependency[]
  needs_client_input: boolean
  needs_colleague: boolean
  is_blocked: boolean
  blocked_reason?: string

  // Step 4: Priority (R-Tasks)
  score_money: number
  score_fire: number
  score_time: number
  score_distance: number
  score_personal: number
  total_score: number

  // Meta
  assigned_to_id: string
  assigned_to_name: string
  deadline?: string
  deadline_time?: string
  is_project: boolean
}

interface TaskCreationWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: {
    title?: string
    client_id?: string
  }
  onComplete: (data: TaskWizardData) => void
  mode?: 'task' | 'project'
}

const STEPS = [
  { id: 1, title: 'Co?', description: 'Definice úkolu' },
  { id: 2, title: 'Jak velké?', description: 'Odhad a kroky' },
  { id: 3, title: 'Kdo/Co?', description: 'Závislosti' },
  { id: 4, title: 'Priorita', description: 'R-Tasks skóre' },
]

export function TaskCreationWizard({
  open,
  onOpenChange,
  initialData,
  onComplete,
  mode = 'task',
}: TaskCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: What
  const [title, setTitle] = useState(initialData?.title || '')
  const [outcome, setOutcome] = useState('')
  const [description, setDescription] = useState('')
  const [clientId, setClientId] = useState(initialData?.client_id || '')

  // Step 2: How big
  const [estimatedHours, setEstimatedHours] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [subtasks, setSubtasks] = useState<SubTask[]>([])
  const [newSubtask, setNewSubtask] = useState('')

  // Step 3: Dependencies
  const [needsClientInput, setNeedsClientInput] = useState(false)
  const [clientInputDescription, setClientInputDescription] = useState('')
  const [needsColleague, setNeedsColleague] = useState(false)
  const [colleagueId, setColleagueId] = useState('')
  const [colleagueReason, setColleagueReason] = useState('')
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockedReason, setBlockedReason] = useState('')

  // Step 4: R-Tasks
  const [scoreMoney, setScoreMoney] = useState(1)
  const [scoreFire, setScoreFire] = useState(1)
  const [scoreTime, setScoreTime] = useState(2)
  const [scoreDistance, setScoreDistance] = useState(2)
  const [scorePersonal, setScorePersonal] = useState(1)

  // Meta
  const [assignedToId, setAssignedToId] = useState(MOCK_CONFIG.CURRENT_USER_ID)
  const [deadline, setDeadline] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('')

  // Derived state
  const [showProjectSuggestion, setShowProjectSuggestion] = useState(false)

  const totalScore = scoreMoney + scoreFire + scoreTime + scoreDistance + scorePersonal
  const progressPercent = (currentStep / STEPS.length) * 100

  const addSubtask = () => {
    if (!newSubtask.trim()) return
    setSubtasks(prev => [
      ...prev,
      { id: `subtask-${Date.now()}`, title: newSubtask.trim() },
    ])
    setNewSubtask('')

    // Show project suggestion if 3+ subtasks
    if (subtasks.length >= 2 && mode === 'task') {
      setShowProjectSuggestion(true)
    }
  }

  const removeSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id))
    if (subtasks.length <= 3) {
      setShowProjectSuggestion(false)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!title.trim()) {
          toast.error('Zadejte název úkolu')
          return false
        }
        if (!outcome.trim()) {
          toast.error('Zadejte kdy bude úkol hotový (výsledek)')
          return false
        }
        return true
      case 2:
        return true // Optional step
      case 3:
        return true // Optional step
      case 4:
        return true // Has defaults
      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    if (!validateStep(currentStep)) return

    const client = clientId && clientId !== 'none' ? mockCompanies.find(c => c.id === clientId) : undefined
    const assignee = mockUsers.find(u => u.id === assignedToId)
    const colleague = colleagueId ? mockUsers.find(u => u.id === colleagueId) : undefined

    const dependencies: Dependency[] = []
    if (needsClientInput) {
      dependencies.push({
        type: 'client',
        description: clientInputDescription,
      })
    }
    if (needsColleague && colleagueId) {
      dependencies.push({
        type: 'colleague',
        description: colleagueReason,
        person_id: colleagueId,
        person_name: colleague?.name,
      })
    }
    if (isBlocked) {
      dependencies.push({
        type: 'blocker',
        description: blockedReason,
      })
    }

    const totalEstimatedMinutes =
      (parseInt(estimatedHours) || 0) * 60 + (parseInt(estimatedMinutes) || 0)

    const data: TaskWizardData = {
      title,
      outcome,
      description: description || undefined,
      client_id: clientId && clientId !== 'none' ? clientId : undefined,
      client_name: client?.name,
      estimated_minutes: totalEstimatedMinutes || 30,
      subtasks,
      dependencies,
      needs_client_input: needsClientInput,
      needs_colleague: needsColleague,
      is_blocked: isBlocked,
      blocked_reason: isBlocked ? blockedReason : undefined,
      score_money: scoreMoney,
      score_fire: scoreFire,
      score_time: scoreTime,
      score_distance: scoreDistance,
      score_personal: scorePersonal,
      total_score: totalScore,
      assigned_to_id: assignedToId,
      assigned_to_name: assignee?.name || MOCK_CONFIG.CURRENT_USER_NAME,
      deadline: deadline || undefined,
      deadline_time: deadlineTime || undefined,
      is_project: mode === 'project' || subtasks.length >= 3,
    }

    onComplete(data)
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setCurrentStep(1)
    setTitle(initialData?.title || '')
    setOutcome('')
    setDescription('')
    setClientId(initialData?.client_id || '')
    setEstimatedHours('')
    setEstimatedMinutes('')
    setSubtasks([])
    setNewSubtask('')
    setNeedsClientInput(false)
    setClientInputDescription('')
    setNeedsColleague(false)
    setColleagueId('')
    setColleagueReason('')
    setIsBlocked(false)
    setBlockedReason('')
    setScoreMoney(1)
    setScoreFire(1)
    setScoreTime(2)
    setScoreDistance(2)
    setScorePersonal(1)
    setAssignedToId(MOCK_CONFIG.CURRENT_USER_ID)
    setDeadline('')
    setDeadlineTime('')
    setShowProjectSuggestion(false)
  }

  const getPriorityLabel = () => {
    if (totalScore >= 10) return { label: 'Vysoká', color: 'bg-red-500', emoji: '🔥' }
    if (totalScore >= 7) return { label: 'Střední', color: 'bg-orange-500', emoji: '⚠️' }
    return { label: 'Nízká', color: 'bg-green-500', emoji: '☑️' }
  }

  const priority = getPriorityLabel()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'project' ? (
              <>
                <FolderKanban className="h-5 w-5 text-purple-600" />
                Průvodce projektem
              </>
            ) : (
              <>
                <ListTodo className="h-5 w-5 text-blue-600" />
                Průvodce úkolem
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Krok {currentStep} z {STEPS.length}: {STEPS[currentStep - 1].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "text-xs font-medium",
                  currentStep >= step.id ? "text-blue-600" : "text-gray-400"
                )}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        <div className="py-4 min-h-[300px]">
          {/* Step 1: What */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  Co potřebuješ udělat? *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Název úkolu..."
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcome" className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Kdy to bude HOTOVO? *
                </Label>
                <Textarea
                  id="outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="Popište jasný výsledek - jak poznáte že je úkol splněn..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Např. "Daňové přiznání odesláno na FÚ" nebo "Klient potvrdil schůzku"
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Podrobnější popis (volitelné)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Další poznámky, kontext..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Klient</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Vyberte..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Žádný klient</SelectItem>
                      {mockCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned">Přiřazeno</Label>
                  <Select value={assignedToId} onValueChange={setAssignedToId}>
                    <SelectTrigger id="assigned">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockUsers.filter(u => u.role === 'accountant' || u.role === 'assistant').map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: How big */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Jak dlouho to zabere?
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min="0"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="0"
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">hodin</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    placeholder="30"
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">minut</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline-time">Čas</Label>
                  <Input
                    id="deadline-time"
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-purple-600" />
                  Dílčí kroky / Podúkoly
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                    placeholder="Přidat krok..."
                  />
                  <Button type="button" onClick={addSubtask} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {subtasks.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {subtasks.map((subtask, index) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                        <span className="flex-1 text-sm">{subtask.title}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeSubtask(subtask.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {showProjectSuggestion && mode === 'task' && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg mt-3">
                    <div className="flex items-center gap-2 text-purple-700">
                      <FolderKanban className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        Máte {subtasks.length} kroků - nechcete to raději jako projekt?
                      </span>
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      Projekt umožňuje lepší organizaci fází a sledování postupu.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Dependencies */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Checkbox
                    id="needs-client"
                    checked={needsClientInput}
                    onCheckedChange={(checked) => setNeedsClientInput(!!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="needs-client" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Potřebuji něco od klienta
                    </Label>
                    {needsClientInput && (
                      <Input
                        className="mt-2"
                        value={clientInputDescription}
                        onChange={(e) => setClientInputDescription(e.target.value)}
                        placeholder="Co přesně potřebujete od klienta?"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Checkbox
                    id="needs-colleague"
                    checked={needsColleague}
                    onCheckedChange={(checked) => setNeedsColleague(!!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="needs-colleague" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4 text-purple-600" />
                      Potřebuji kolegu
                    </Label>
                    {needsColleague && (
                      <div className="mt-2 space-y-2">
                        <Select value={colleagueId} onValueChange={setColleagueId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte kolegu..." />
                          </SelectTrigger>
                          <SelectContent>
                            {mockUsers
                              .filter(u => u.id !== MOCK_CONFIG.CURRENT_USER_ID)
                              .map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={colleagueReason}
                          onChange={(e) => setColleagueReason(e.target.value)}
                          placeholder="K čemu kolegu potřebujete?"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg border-orange-200 bg-orange-50/50">
                  <Checkbox
                    id="is-blocked"
                    checked={isBlocked}
                    onCheckedChange={(checked) => setIsBlocked(!!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="is-blocked" className="flex items-center gap-2 cursor-pointer">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Něco mě blokuje
                    </Label>
                    {isBlocked && (
                      <Input
                        className="mt-2"
                        value={blockedReason}
                        onChange={(e) => setBlockedReason(e.target.value)}
                        placeholder="Co vám brání v dokončení?"
                      />
                    )}
                  </div>
                </div>
              </div>

              {!needsClientInput && !needsColleague && !isBlocked && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-700">
                    Skvělé! Tento úkol nemá žádné závislosti.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Priority (R-Tasks) */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Badge className={cn("text-lg px-4 py-1", priority.color)}>
                  {priority.emoji} Skóre: {totalScore}/12 • {priority.label} priorita
                </Badge>
              </div>

              <div className="space-y-3">
                {/* Money */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Hodnota (peníze)
                  </Label>
                  <Select value={scoreMoney.toString()} onValueChange={(v) => setScoreMoney(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCORE_OPTIONS.money.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          <span className={opt.color}>{opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fire */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-600" />
                    Urgence (hoří to?)
                  </Label>
                  <Select value={scoreFire.toString()} onValueChange={(v) => setScoreFire(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCORE_OPTIONS.fire.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          <span className={opt.color}>{opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-blue-600" />
                    Časová náročnost
                  </Label>
                  <Select value={scoreTime.toString()} onValueChange={(v) => setScoreTime(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCORE_OPTIONS.time.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          <span className={opt.color}>{opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Distance */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    Dostupnost
                  </Label>
                  <Select value={scoreDistance.toString()} onValueChange={(v) => setScoreDistance(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCORE_OPTIONS.distance.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          <span className={opt.color}>{opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Personal */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-600" />
                    Osobní preference
                  </Label>
                  <Select value={scorePersonal.toString()} onValueChange={(v) => setScorePersonal(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCORE_OPTIONS.personal.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          <span className={opt.color}>{opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Zpět
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Další
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className={mode === 'project' ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              <Check className="h-4 w-4 mr-2" />
              Vytvořit {mode === 'project' ? 'projekt' : 'úkol'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
