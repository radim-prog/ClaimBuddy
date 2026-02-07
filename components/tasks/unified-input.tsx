'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  StickyNote,
  Phone,
  Mail,
  CheckSquare,
  FolderKanban,
  Plus,
  Calendar,
  User,
  Building2,
  Clock,
  Target,
  Zap,
  Timer,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { mockCompanies, mockUsers, MOCK_CONFIG, addTimeLog, ActivityType } from '@/lib/mock-data'
import { toast } from 'sonner'

// Input types
type InputType = 'note' | 'quick_task' | 'task' | 'project' | 'time'

interface InputTypeConfig {
  id: InputType
  label: string
  icon: typeof StickyNote
  description: string
  color: string
  bgColor: string
}

const INPUT_TYPES: InputTypeConfig[] = [
  {
    id: 'note',
    label: 'Poznámka',
    icon: StickyNote,
    description: 'Jen text, bez parametrů',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  },
  {
    id: 'quick_task',
    label: 'Rychlý úkol',
    icon: Phone,
    description: 'Telefonát, email, krátká akce',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
  },
  {
    id: 'task',
    label: 'Úkol',
    icon: CheckSquare,
    description: 'S průvodcem a parametry',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  {
    id: 'project',
    label: 'Projekt',
    icon: FolderKanban,
    description: 'S dílčími úkoly a fázemi',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
  {
    id: 'time',
    label: 'Čas',
    icon: Timer,
    description: 'Záznam času mimo úkoly',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200 hover:bg-green-100',
  },
]

export interface TimeLogData {
  client_id?: string
  client_name?: string
  activity_type: ActivityType
  minutes: number
  description: string
  is_billable: boolean
}

interface UnifiedInputProps {
  onNoteCreated?: (note: NoteData) => void
  onQuickTaskCreated?: (task: QuickTaskData) => void
  onTaskWizardOpen?: (initialData: TaskWizardInitialData) => void
  onProjectWizardOpen?: (initialData: ProjectWizardInitialData) => void
  onTimeLogged?: (data: TimeLogData) => void
  trigger?: React.ReactNode
}

// Data types for different input types
export interface NoteData {
  text: string
  client_id?: string
  client_name?: string
  created_at: string
}

export interface QuickTaskData {
  title: string
  purpose: string // Důvod/cíl
  client_id?: string
  client_name?: string
  assigned_to_id: string
  assigned_to_name: string
  deadline?: string
  deadline_time?: string
  estimated_minutes?: number
  created_at: string
}

export interface TaskWizardInitialData {
  title: string
  client_id?: string
}

export interface ProjectWizardInitialData {
  title: string
  client_id?: string
}

export function UnifiedInput({
  onNoteCreated,
  onQuickTaskCreated,
  onTaskWizardOpen,
  onProjectWizardOpen,
  onTimeLogged,
  trigger,
}: UnifiedInputProps) {
  const [open, setOpen] = useState(false)
  const [inputType, setInputType] = useState<InputType>('quick_task')
  const [title, setTitle] = useState('')

  // Note fields
  const [noteText, setNoteText] = useState('')
  const [noteClientId, setNoteClientId] = useState<string>('')

  // Quick task fields
  const [purpose, setPurpose] = useState('')
  const [clientId, setClientId] = useState<string>('')
  const [assignedToId, setAssignedToId] = useState<string>(MOCK_CONFIG.CURRENT_USER_ID)
  const [deadline, setDeadline] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')

  // Time log fields
  const [timeHours, setTimeHours] = useState('')
  const [timeMinutes, setTimeMinutes] = useState('')
  const [timeDescription, setTimeDescription] = useState('')
  const [timeDate, setTimeDate] = useState(new Date().toISOString().split('T')[0])
  const [isBillable, setIsBillable] = useState(true)

  const resetForm = () => {
    setTitle('')
    setNoteText('')
    setNoteClientId('')
    setPurpose('')
    setClientId('')
    setAssignedToId(MOCK_CONFIG.CURRENT_USER_ID)
    setDeadline('')
    setDeadlineTime('')
    setEstimatedMinutes('')
    setTimeHours('')
    setTimeMinutes('')
    setTimeDescription('')
    setTimeDate(new Date().toISOString().split('T')[0])
    setIsBillable(true)
  }

  const handleSubmit = () => {
    if (inputType === 'note') {
      if (!noteText.trim()) {
        toast.error('Zadejte text poznámky')
        return
      }

      const client = noteClientId && noteClientId !== 'none' ? mockCompanies.find(c => c.id === noteClientId) : undefined
      const note: NoteData = {
        text: noteText,
        client_id: noteClientId && noteClientId !== 'none' ? noteClientId : undefined,
        client_name: client?.name,
        created_at: new Date().toISOString(),
      }

      onNoteCreated?.(note)
      toast.success('Poznámka uložena')
      resetForm()
      setOpen(false)
      return
    }

    if (inputType === 'quick_task') {
      if (!title.trim()) {
        toast.error('Zadejte název úkolu')
        return
      }
      if (!purpose.trim()) {
        toast.error('Zadejte důvod/cíl úkolu')
        return
      }

      const client = clientId && clientId !== 'none' ? mockCompanies.find(c => c.id === clientId) : undefined
      const assignee = mockUsers.find(u => u.id === assignedToId)

      const quickTask: QuickTaskData = {
        title,
        purpose,
        client_id: clientId && clientId !== 'none' ? clientId : undefined,
        client_name: client?.name,
        assigned_to_id: assignedToId,
        assigned_to_name: assignee?.name || MOCK_CONFIG.CURRENT_USER_NAME,
        deadline: deadline || undefined,
        deadline_time: deadlineTime || undefined,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
        created_at: new Date().toISOString(),
      }

      onQuickTaskCreated?.(quickTask)
      toast.success('Rychlý úkol vytvořen')
      resetForm()
      setOpen(false)
      return
    }

    if (inputType === 'task') {
      if (!title.trim()) {
        toast.error('Zadejte název úkolu')
        return
      }

      onTaskWizardOpen?.({
        title,
        client_id: clientId && clientId !== 'none' ? clientId : undefined,
      })
      resetForm()
      setOpen(false)
      return
    }

    if (inputType === 'project') {
      if (!title.trim()) {
        toast.error('Zadejte název projektu')
        return
      }

      onProjectWizardOpen?.({
        title,
        client_id: clientId && clientId !== 'none' ? clientId : undefined,
      })
      resetForm()
      setOpen(false)
      return
    }

    if (inputType === 'time') {
      const totalMinutes = (parseInt(timeHours) || 0) * 60 + (parseInt(timeMinutes) || 0)

      if (totalMinutes <= 0) {
        toast.error('Zadejte čas větší než 0')
        return
      }

      if (!timeDescription.trim()) {
        toast.error('Zadejte popis aktivity')
        return
      }

      const client = clientId && clientId !== 'none'
        ? mockCompanies.find(c => c.id === clientId)
        : undefined

      // Add to mock data
      addTimeLog({
        user_id: MOCK_CONFIG.CURRENT_USER_ID,
        user_name: MOCK_CONFIG.CURRENT_USER_NAME,
        client_id: client?.id,
        client_name: client?.name,
        activity_type: 'general',
        date: timeDate,
        minutes: totalMinutes,
        description: timeDescription,
        is_billable: isBillable,
      })

      const data: TimeLogData = {
        client_id: client?.id,
        client_name: client?.name,
        activity_type: 'general',
        minutes: totalMinutes,
        description: timeDescription,
        is_billable: isBillable,
      }

      onTimeLogged?.(data)
      toast.success('Čas zaznamenán')
      resetForm()
      setOpen(false)
      return
    }
  }

  const selectedType = INPUT_TYPES.find(t => t.id === inputType)!
  const SelectedIcon = selectedType.icon

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nový záznam
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nový záznam
          </DialogTitle>
          <DialogDescription>
            Vyberte typ záznamu a vyplňte potřebné údaje
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type selector */}
          <div className="space-y-2">
            <Label>Typ záznamu</Label>
            <div className="grid grid-cols-5 gap-2">
              {INPUT_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = inputType === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => setInputType(type.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                      isSelected
                        ? `${type.bgColor} border-current ${type.color}`
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSelected ? type.color : "text-gray-500 dark:text-gray-400")} />
                    <span className={cn(
                      "text-xs font-medium",
                      isSelected ? type.color : "text-gray-600 dark:text-gray-300"
                    )}>
                      {type.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {selectedType.description}
            </p>
          </div>

          {/* Note form */}
          {inputType === 'note' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note-text">Poznámka *</Label>
                <Textarea
                  id="note-text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Zapište svou poznámku..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note-client">Klient (volitelné)</Label>
                <Select value={noteClientId} onValueChange={setNoteClientId}>
                  <SelectTrigger id="note-client">
                    <SelectValue placeholder="Vyberte klienta..." />
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
            </div>
          )}

          {/* Quick task form */}
          {inputType === 'quick_task' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quick-title">Název úkolu *</Label>
                <Input
                  id="quick-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Např. Zavolat klientovi ABC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-purpose" className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Důvod / Cíl *
                </Label>
                <Input
                  id="quick-purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Proč to děláš? Co má být výsledkem?"
                />
                <p className="text-xs text-muted-foreground">
                  Např. "Potvrdit termín schůzky" nebo "Získat chybějící doklady"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-client">Klient</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger id="quick-client">
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
                  <Label htmlFor="quick-assigned">Přiřazeno</Label>
                  <Select value={assignedToId} onValueChange={setAssignedToId}>
                    <SelectTrigger id="quick-assigned">
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-deadline">Deadline</Label>
                  <Input
                    id="quick-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-time">Čas</Label>
                  <Input
                    id="quick-time"
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-estimate">Odhad (min)</Label>
                  <Input
                    id="quick-estimate"
                    type="number"
                    min="1"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Task form (opens wizard) */}
          {inputType === 'task' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-medium">Průvodce úkolem</span>
                </div>
                <p className="text-sm text-blue-600">
                  Po zadání názvu se otevře průvodce, který vám pomůže úkol správně definovat.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-title">Název úkolu *</Label>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Co potřebujete udělat?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-client">Klient (volitelné)</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="task-client">
                    <SelectValue placeholder="Vyberte klienta..." />
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
            </div>
          )}

          {/* Project form (opens wizard) */}
          {inputType === 'project' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <FolderKanban className="h-5 w-5" />
                  <span className="font-medium">Průvodce projektem</span>
                </div>
                <p className="text-sm text-purple-600">
                  Po zadání názvu se otevře průvodce pro definování fází a dílčích úkolů.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-title">Název projektu *</Label>
                <Input
                  id="project-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Např. Daňové přiznání 2024 - ABC s.r.o."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-client">Klient</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="project-client">
                    <SelectValue placeholder="Vyberte klienta..." />
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
            </div>
          )}

          {/* Time log form */}
          {inputType === 'time' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Timer className="h-5 w-5" />
                  <span className="font-medium">Záznam času mimo úkoly</span>
                </div>
                <p className="text-sm text-green-600">
                  Zaznamenejte čas strávený aktivitami, které nejsou součástí úkolů.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-client">Klient</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="time-client">
                    <SelectValue placeholder="Vyberte klienta..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Bez klienta</SelectItem>
                    {mockCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-date">Datum</Label>
                <Input
                  id="time-date"
                  type="date"
                  value={timeDate}
                  onChange={(e) => setTimeDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Strávený čas *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    value={timeHours}
                    onChange={(e) => setTimeHours(e.target.value)}
                    placeholder="0"
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">hodin</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(e.target.value)}
                    placeholder="0"
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">minut</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-description">Popis aktivity *</Label>
                <Textarea
                  id="time-description"
                  value={timeDescription}
                  onChange={(e) => setTimeDescription(e.target.value)}
                  placeholder="Co jste dělali..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Checkbox
                  id="billable"
                  checked={isBillable}
                  onCheckedChange={(checked) => setIsBillable(!!checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="billable" className="cursor-pointer font-medium">
                    Fakturovatelné
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Tento čas bude zahrnut do fakturace klientovi
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Zrušit
          </Button>
          <Button
            onClick={handleSubmit}
            className={cn(
              inputType === 'note' && "bg-yellow-600 hover:bg-yellow-700",
              inputType === 'quick_task' && "bg-cyan-600 hover:bg-cyan-700",
              inputType === 'task' && "bg-blue-600 hover:bg-blue-700",
              inputType === 'project' && "bg-purple-600 hover:bg-purple-700",
              inputType === 'time' && "bg-green-600 hover:bg-green-700",
            )}
          >
            <SelectedIcon className="h-4 w-4 mr-2" />
            {inputType === 'note' && 'Uložit poznámku'}
            {inputType === 'quick_task' && 'Vytvořit úkol'}
            {inputType === 'task' && 'Pokračovat na průvodce'}
            {inputType === 'project' && 'Pokračovat na průvodce'}
            {inputType === 'time' && 'Zaznamenat čas'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
