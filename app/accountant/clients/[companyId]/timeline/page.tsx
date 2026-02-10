'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FileText, Phone, Mail, Smartphone, AlertCircle, FileCheck, Gavel, Plus, Calendar, MessageSquare, Paperclip, Send, Clock, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getPricingSettings } from '@/lib/pricing-settings'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

// Typy událostí pro vedení spisu
type CaseEventType = 'task' | 'call' | 'email' | 'sms' | 'document' | 'meeting' | 'note' | 'decision' | 'deadline'

// Záznam odpracovaného času
interface TimeEntry {
  id: string
  date: string // ISO format
  startTime: string // "09:00"
  endTime: string // "11:30"
  duration: number // minuty
  user: string
  note?: string
}

// Poznámka o průběhu (jako lékařská zpráva)
interface ProgressNote {
  id: string
  date: string // ISO format
  author: string
  currentStatus: string // "Dnešní stav..."
  problems?: string // "Problémy..."
  nextSteps?: string // "Další kroky..."
  note?: string // Volný text
}

// Úkol ve spisu
interface CaseTask {
  id: string
  title: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
  assignedTo: string
}

interface CaseEvent {
  id: string
  type: CaseEventType
  timestamp: string // ISO format
  title: string
  description: string
  user: string

  // Time tracking
  timeEntries: TimeEntry[]
  billable: boolean // Lze fakturovat?
  hourlyRate?: number // Kč/hod

  attachments?: Array<{ name: string; size: string }>
  comments?: Array<{ id: string; user: string; text: string; time: string }>
  expanded: boolean
}

// Metadata spisu
interface CaseMetadata {
  id: string
  title: string
  status: 'active' | 'paused' | 'completed'
  createdAt: string
  lastActivity: string
  progressNotes: ProgressNote[]
  tasks: CaseTask[]
}

// Mock data - Příklad: Daňová kontrola
const mockCaseEvents: CaseEvent[] = [
  {
    id: '1',
    type: 'document',
    timestamp: '2025-01-20T14:30:00',
    title: 'Doručena výzva k místnímu šetření',
    description: 'Finanční úřad pro Prahu 1 - kontrola období 2022-2023',
    user: 'Radim Zajíček',
    timeEntries: [
      { id: 't1', date: '2025-01-20', startTime: '14:30', endTime: '15:00', duration: 30, user: 'Radim Zajíček', note: 'Registrace, první přečtení' }
    ],
    billable: true,
    hourlyRate: 800,
    attachments: [
      { name: 'vyzva_danovy_urad_20250120.pdf', size: '452 KB' }
    ],
    comments: [],
    expanded: false
  },
  {
    id: '2',
    type: 'call',
    timestamp: '2025-01-20T15:45:00',
    title: 'Telefonát s klientem - informování o kontrole',
    description: 'Klient informován, domluvena příprava podkladů',
    user: 'Radim Zajíček',
    timeEntries: [
      { id: 't2', date: '2025-01-20', startTime: '15:45', endTime: '16:15', duration: 30, user: 'Radim Zajíček', note: 'Telefonát + poznámky' }
    ],
    billable: true,
    hourlyRate: 800,
    comments: [
      { id: 'c1', user: 'Radim Zajíček', text: 'Klient žádá schůzku osobně', time: '15:50' }
    ],
    expanded: false
  },
  {
    id: '3',
    type: 'meeting',
    timestamp: '2025-01-22T10:00:00',
    title: 'Osobní schůzka - příprava na kontrolu',
    description: 'Probrány požadované doklady, harmonogram kontroly',
    user: 'Radim Zajíček',
    timeEntries: [
      { id: 't3', date: '2025-01-22', startTime: '10:00', endTime: '12:00', duration: 120, user: 'Radim Zajíček', note: 'Osobní schůzka v kanceláři klienta' }
    ],
    billable: true,
    hourlyRate: 800,
    comments: [],
    expanded: false
  },
  {
    id: '4',
    type: 'task',
    timestamp: '2025-01-22T11:30:00',
    title: 'Úkol: Kompletace účetních dokladů za 2022-2023',
    description: 'Priorita: VYSOKÁ - termín: 5. 2. 2025',
    user: 'Radim Zajíček',
    timeEntries: [
      { id: 't4a', date: '2025-01-23', startTime: '09:00', endTime: '12:30', duration: 210, user: 'Radim Zajíček', note: 'Sběr dokladů za 2022' },
      { id: 't4b', date: '2025-01-24', startTime: '09:00', endTime: '13:00', duration: 240, user: 'Radim Zajíček', note: 'Sběr dokladů za 2023' },
      { id: 't4c', date: '2025-01-25', startTime: '14:00', endTime: '17:30', duration: 210, user: 'Radim Zajíček', note: 'Kontrola kompletnosti, třídění' }
    ],
    billable: true,
    hourlyRate: 800,
    expanded: false
  },
  {
    id: '5',
    type: 'email',
    timestamp: '2025-01-23T09:15:00',
    title: 'Email finančnímu úřadu - žádost o odklad',
    description: 'Požádáno o prodloužení termínu o 14 dní',
    user: 'Radim Zajíček',
    timeEntries: [
      { id: 't5', date: '2025-01-23', startTime: '09:15', endTime: '09:45', duration: 30, user: 'Radim Zajíček', note: 'Sepsání žádosti' }
    ],
    billable: true,
    hourlyRate: 800,
    attachments: [
      { name: 'zadost_o_odklad.pdf', size: '128 KB' }
    ],
    expanded: false
  },
  {
    id: '6',
    type: 'document',
    timestamp: '2025-01-25T14:00:00',
    title: 'Přijato rozhodnutí o odkladu',
    description: 'Nový termín místního šetření: 19. 2. 2025',
    user: 'Radim Zajíček',
    timeEntries: [
      { id: 't6', date: '2025-01-25', startTime: '14:00', endTime: '14:15', duration: 15, user: 'Radim Zajíček', note: 'Přečtení a uložení' }
    ],
    billable: true,
    hourlyRate: 800,
    attachments: [
      { name: 'rozhodnuti_odklad.pdf', size: '215 KB' }
    ],
    expanded: false
  },
  {
    id: '7',
    type: 'note',
    timestamp: '2025-01-10T16:30:00',
    title: 'Poznámka: Potenciální rizika',
    description: 'Identifikovány nesrovnalosti v cestovních náhradách za Q2 2022',
    user: 'Radim Zajíček',
    timeEntries: [],
    billable: false,
    comments: [],
    expanded: false
  },
  {
    id: '8',
    type: 'call',
    timestamp: '2024-12-15T11:00:00',
    title: 'Telefonát z finančního úřadu',
    description: 'Předběžné oznámení o kontrole, neformální dotazy',
    user: 'Radim Zajíček',
    timeEntries: [
      { id: 't8', date: '2024-12-15', startTime: '11:00', endTime: '11:20', duration: 20, user: 'Radim Zajíček', note: 'Telefonát + zápis' }
    ],
    billable: true,
    hourlyRate: 800,
    expanded: false
  }
]

// Mock metadata spisu
const mockCaseMetadata: CaseMetadata = {
  id: 'case-1',
  title: 'Daňová kontrola 2022-2023',
  status: 'active',
  createdAt: '2024-12-15',
  lastActivity: '2025-01-25',
  progressNotes: [
    {
      id: 'note-1',
      date: '2025-01-25',
      author: 'Radim Zajíček',
      currentStatus: 'Získali jsme odklad místního šetření do 19. 2. 2025. Všechny doklady za 2022-2023 jsou kompletní a setříděné.',
      problems: 'Zjištěny nesrovnalosti v cestovních náhradách Q2 2022 - rozdíl cca 15 000 Kč. Potřeba vysvětlit finančnímu úřadu.',
      nextSteps: '1. Připravit vysvětlení k cestovním náhradám (termín: 5.2.)\n2. Schůzka s klientem 10.2. - příprava na místní šetření\n3. Připravit podklady pro argumentaci (faktury, smlouvy)'
    },
    {
      id: 'note-2',
      date: '2025-01-22',
      author: 'Radim Zajíček',
      currentStatus: 'Proběhla osobní schůzka s klientem. Probrány požadavky FÚ, domluven harmonogram přípravy.',
      problems: 'Klient zapomněl některé faktury doma, přinese je zítra.',
      nextSteps: 'Počkat na dodání zbylých faktur, pak pokračovat v kompletaci.',
      note: 'Klient je nervózní z kontroly, potřeba ho uklidnit a vysvětlit postup.'
    },
    {
      id: 'note-3',
      date: '2025-01-20',
      author: 'Radim Zajíček',
      currentStatus: 'Přijata výzva k místnímu šetření. Termín: 5. 2. 2025.',
      nextSteps: 'Urgentně kontaktovat klienta, domluvit schůzku, začít připravovat doklady.'
    }
  ],
  tasks: [
    { id: 'task-1', title: 'Kompletace účetních dokladů za 2022-2023', completed: true, priority: 'high', assignedTo: 'Radim Zajíček' },
    { id: 'task-2', title: 'Příprava vysvětlení k cestovním náhradám', completed: false, priority: 'high', dueDate: '2025-02-05', assignedTo: 'Radim Zajíček' },
    { id: 'task-3', title: 'Schůzka s klientem - příprava na šetření', completed: false, priority: 'high', dueDate: '2025-02-10', assignedTo: 'Radim Zajíček' },
    { id: 'task-4', title: 'Zaslat žádost o odklad', completed: true, priority: 'medium', assignedTo: 'Radim Zajíček' },
    { id: 'task-5', title: 'Připravit podklady pro argumentaci', completed: false, priority: 'medium', dueDate: '2025-02-15', assignedTo: 'Radim Zajíček' },
    { id: 'task-6', title: 'Kontrola správnosti účetních záznamů', completed: false, priority: 'low', assignedTo: 'Radim Zajíček' }
  ]
}

// Barvy pro typy událostí
const eventTypeConfig: Record<CaseEventType, { label: string; bgColor: string; textColor: string }> = {
  task: { label: 'Úkol', bgColor: 'bg-orange-500', textColor: 'text-white' },
  call: { label: 'Telefonát', bgColor: 'bg-blue-500', textColor: 'text-white' },
  email: { label: 'Email', bgColor: 'bg-blue-500', textColor: 'text-white' },
  sms: { label: 'SMS', bgColor: 'bg-purple-500', textColor: 'text-white' },
  document: { label: 'Dokument', bgColor: 'bg-gray-600', textColor: 'text-white' },
  meeting: { label: 'Schůzka', bgColor: 'bg-green-500', textColor: 'text-white' },
  note: { label: 'Poznámka', bgColor: 'bg-yellow-500', textColor: 'text-white' },
  decision: { label: 'Rozhodnutí', bgColor: 'bg-red-500', textColor: 'text-white' },
  deadline: { label: 'Deadline', bgColor: 'bg-red-600', textColor: 'text-white' }
}

export default function ClientTimelinePage() {
  const params = useParams()
  const companyId = params.companyId as string
  const { userName } = useAccountantUser()

  const [events, setEvents] = useState<CaseEvent[]>(mockCaseEvents)
  const [caseData, setCaseData] = useState<CaseMetadata>(mockCaseMetadata)
  const [newComment, setNewComment] = useState<{[key: string]: string}>({})
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEventType, setNewEventType] = useState<CaseEventType>('note')
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDescription, setNewEventDescription] = useState('')

  // Pricing settings
  const [standardRate, setStandardRate] = useState(800) // Default fallback

  // Load pricing settings on mount
  useEffect(() => {
    const settings = getPricingSettings()
    setStandardRate(settings.hourlyRates.standard)
  }, [])

  // Time tracking state
  const [showAddTime, setShowAddTime] = useState<string | null>(null) // eventId
  const [newTimeDate, setNewTimeDate] = useState('')
  const [newTimeStart, setNewTimeStart] = useState('')
  const [newTimeEnd, setNewTimeEnd] = useState('')
  const [newTimeNote, setNewTimeNote] = useState('')
  const [showBillingReport, setShowBillingReport] = useState(false)

  // View mode state
  const [activeView, setActiveView] = useState<'timeline' | 'summary' | 'tasks' | 'documents' | 'notes'>('timeline')

  // Progress note state
  const [showAddProgressNote, setShowAddProgressNote] = useState(false)
  const [newNoteStatus, setNewNoteStatus] = useState('')
  const [newNoteProblems, setNewNoteProblems] = useState('')
  const [newNoteNextSteps, setNewNoteNextSteps] = useState('')
  const [newNoteText, setNewNoteText] = useState('')

  // Seskupení podle datumů
  const groupEventsByDate = () => {
    const sorted = [...events].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    const grouped: { [date: string]: CaseEvent[] } = {}

    sorted.forEach(event => {
      const date = new Date(event.timestamp)
      const dateKey = date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })

      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })

    return grouped
  }

  const groupedEvents = groupEventsByDate()

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  }

  const toggleEvent = (eventId: string) => {
    setEvents(events.map(e =>
      e.id === eventId ? { ...e, expanded: !e.expanded } : e
    ))
  }

  const addComment = (eventId: string) => {
    const comment = newComment[eventId]
    if (!comment?.trim()) return

    setEvents(events.map(e =>
      e.id === eventId
        ? {
            ...e,
            comments: [...(e.comments || []), {
              id: Date.now().toString(),
              user: 'Ty',
              text: comment,
              time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
            }]
          }
        : e
    ))
    setNewComment({ ...newComment, [eventId]: '' })
  }

  const addNewEvent = () => {
    if (!newEventTitle.trim()) return

    const newEvent: CaseEvent = {
      id: Date.now().toString(),
      type: newEventType,
      timestamp: new Date().toISOString(),
      title: newEventTitle,
      description: newEventDescription,
      user: userName || 'Účetní',
      timeEntries: [],
      billable: true,
      hourlyRate: standardRate, // Use rate from pricing settings
      comments: [],
      expanded: false
    }

    setEvents([newEvent, ...events])
    setNewEventTitle('')
    setNewEventDescription('')
    setShowAddEvent(false)
  }

  // Time tracking functions
  const calculateDuration = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    return (endHour * 60 + endMin) - (startHour * 60 + startMin)
  }

  const addTimeEntry = (eventId: string) => {
    if (!newTimeDate || !newTimeStart || !newTimeEnd) return

    const duration = calculateDuration(newTimeStart, newTimeEnd)
    if (duration <= 0) {
      alert('Koncový čas musí být po začátku!')
      return
    }

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      date: newTimeDate,
      startTime: newTimeStart,
      endTime: newTimeEnd,
      duration,
      user: userName || 'Účetní',
      note: newTimeNote
    }

    setEvents(events.map(e =>
      e.id === eventId
        ? { ...e, timeEntries: [...e.timeEntries, newEntry] }
        : e
    ))

    // Reset form
    setNewTimeDate('')
    setNewTimeStart('')
    setNewTimeEnd('')
    setNewTimeNote('')
    setShowAddTime(null)
  }

  const getTotalMinutes = (event: CaseEvent): number => {
    return event.timeEntries.reduce((sum, entry) => sum + entry.duration, 0)
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins} min`
    if (mins === 0) return `${hours} hod`
    return `${hours} hod ${mins} min`
  }

  const getTotalCost = (event: CaseEvent): number => {
    const totalMinutes = getTotalMinutes(event)
    const hours = totalMinutes / 60
    return hours * (event.hourlyRate || 0)
  }

  // Celkové statistiky
  const getTotalStats = () => {
    let totalMinutes = 0
    let totalCost = 0

    events.forEach(event => {
      if (event.billable) {
        const minutes = getTotalMinutes(event)
        totalMinutes += minutes
        totalCost += (minutes / 60) * (event.hourlyRate || 0)
      }
    })

    return { totalMinutes, totalCost }
  }

  const addProgressNote = () => {
    if (!newNoteStatus.trim()) return

    const newNote: ProgressNote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      author: userName || 'Účetní',
      currentStatus: newNoteStatus,
      problems: newNoteProblems || undefined,
      nextSteps: newNoteNextSteps || undefined,
      note: newNoteText || undefined
    }

    setCaseData({
      ...caseData,
      progressNotes: [newNote, ...caseData.progressNotes],
      lastActivity: new Date().toISOString()
    })

    // Reset form
    setNewNoteStatus('')
    setNewNoteProblems('')
    setNewNoteNextSteps('')
    setNewNoteText('')
    setShowAddProgressNote(false)
  }

  const toggleTask = (taskId: string) => {
    setCaseData({
      ...caseData,
      tasks: caseData.tasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    })
  }

  // Získat všechny dokumenty ze všech events
  const getAllDocuments = () => {
    const allDocs: Array<{ name: string; size: string; eventTitle: string; date: string }> = []
    events.forEach(event => {
      if (event.attachments && event.attachments.length > 0) {
        event.attachments.forEach(att => {
          allDocs.push({
            ...att,
            eventTitle: event.title,
            date: event.timestamp
          })
        })
      }
    })
    return allDocs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const { totalMinutes, totalCost } = getTotalStats()
  const completedTasks = caseData.tasks.filter(t => t.completed).length
  const totalTasks = caseData.tasks.length

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{caseData.title}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Poslední aktivita: {new Date(caseData.lastActivity).toLocaleDateString('cs-CZ')} •
              Status: <Badge className={caseData.status === 'active' ? 'bg-green-500' : 'bg-gray-50 dark:bg-gray-800/500'}>{caseData.status === 'active' ? 'Aktivní' : 'Ukončeno'}</Badge>
            </p>
          </div>
          {/* Celková statistika */}
          <div className="flex gap-3">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-3 text-center min-w-[100px]">
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Úkoly</div>
                <div className="text-2xl font-bold text-green-700">{completedTasks}/{totalTasks}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-3 text-center min-w-[120px]">
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Odpracováno</div>
                <div className="text-lg font-bold text-blue-700">{formatDuration(totalMinutes)}</div>
                <div className="text-xs font-semibold text-gray-900 dark:text-white">{totalCost.toLocaleString()} Kč</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          <Button
            variant={activeView === 'summary' ? 'default' : 'ghost'}
            onClick={() => setActiveView('summary')}
            className={activeView === 'summary' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            📋 Souhrn spisu
          </Button>
          <Button
            variant={activeView === 'notes' ? 'default' : 'ghost'}
            onClick={() => setActiveView('notes')}
            className={activeView === 'notes' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            📝 Poznámky o průběhu
          </Button>
          <Button
            variant={activeView === 'tasks' ? 'default' : 'ghost'}
            onClick={() => setActiveView('tasks')}
            className={activeView === 'tasks' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            ✓ Úkoly ({completedTasks}/{totalTasks})
          </Button>
          <Button
            variant={activeView === 'documents' ? 'default' : 'ghost'}
            onClick={() => setActiveView('documents')}
            className={activeView === 'documents' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            📎 Dokumenty ({getAllDocuments().length})
          </Button>
          <Button
            variant={activeView === 'timeline' ? 'default' : 'ghost'}
            onClick={() => setActiveView('timeline')}
            className={activeView === 'timeline' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            🕐 Timeline
          </Button>
        </div>
      </div>

      {/* Akční tlačítka */}
      <div className="mb-6 flex gap-3">
        {!showAddEvent ? (
          <>
            <Button
              onClick={() => setShowAddEvent(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Přidat událost
            </Button>
            <Button
              onClick={() => setShowBillingReport(!showBillingReport)}
              variant={showBillingReport ? "default" : "outline"}
              className={showBillingReport ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {showBillingReport ? 'Skrýt' : 'Zobrazit'} přehled hodin
            </Button>
          </>
        ) : (
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Nová událost
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Typ události</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as CaseEventType)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    {Object.entries(eventTypeConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Název</label>
                  <Input
                    placeholder="Např. 'Telefonát s finančním úřadem', 'Schůzka s klientem'..."
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Popis</label>
                  <Textarea
                    placeholder="Stručný popis události..."
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addNewEvent} className="bg-green-600 hover:bg-green-700">
                    Přidat
                  </Button>
                  <Button onClick={() => {
                    setShowAddEvent(false)
                    setNewEventTitle('')
                    setNewEventDescription('')
                  }} variant="outline">
                    Zrušit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Přehled hodin a fakturace */}
      {showBillingReport && (
        <Card className="mb-8 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Přehled hodin a podklad pro fakturaci
            </h2>

            <div className="space-y-3">
              {events.filter(e => e.billable && e.timeEntries.length > 0).map((event) => {
                const config = eventTypeConfig[event.type]
                return (
                  <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${config.bgColor} ${config.textColor} text-xs px-2 py-0.5`}>
                            {config.label}
                          </Badge>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{event.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-purple-700">{formatDuration(getTotalMinutes(event))}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Sazba: {event.hourlyRate} Kč/hod</div>
                        <div className="text-base font-semibold text-gray-900 dark:text-white mt-1">{getTotalCost(event).toLocaleString()} Kč</div>
                      </div>
                    </div>

                    {/* Time entries list */}
                    <div className="pl-4 border-l-2 border-purple-200 space-y-2">
                      {event.timeEntries.map((entry) => (
                        <div key={entry.id} className="text-sm flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {new Date(entry.date).toLocaleDateString('cs-CZ')} • {entry.startTime} - {entry.endTime}
                            </div>
                            {entry.note && <div className="text-xs text-gray-600 dark:text-gray-300 italic mt-0.5">{entry.note}</div>}
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.user}</div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-semibold text-purple-700">{formatDuration(entry.duration)}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">{((entry.duration / 60) * event.hourlyRate!).toFixed(0)} Kč</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Celkový součet */}
            <div className="mt-6 pt-4 border-t-2 border-purple-300">
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Celkem k fakturaci</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Standardní sazba: {standardRate} Kč/hod •
                    {events.filter(e => e.billable).flatMap(e => e.timeEntries).length} záznamů času
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-700">{formatDuration(totalMinutes)}</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalCost.toLocaleString()} Kč</div>
                </div>
              </div>
            </div>

            {/* Export tlačítka */}
            <div className="mt-4 flex gap-3 justify-end">
              <Button variant="outline" className="text-sm">
                Export do Excel
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-sm">
                Vygenerovat fakturu
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SOUHRN SPISU VIEW */}
      {activeView === 'summary' && (
        <div className="space-y-6">
          {/* Poslední poznámka */}
          {caseData.progressNotes.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📍 Kde jsme skončili</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2" suppressHydrationWarning>
                    {new Date(caseData.progressNotes[0].date).toLocaleString('cs-CZ')} • {caseData.progressNotes[0].author}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">Aktuální stav:</div>
                      <div className="text-gray-700 dark:text-gray-200">{caseData.progressNotes[0].currentStatus}</div>
                    </div>
                    {caseData.progressNotes[0].problems && (
                      <div>
                        <div className="font-semibold text-red-700 mb-1">⚠️ Problémy:</div>
                        <div className="text-gray-700 dark:text-gray-200">{caseData.progressNotes[0].problems}</div>
                      </div>
                    )}
                    {caseData.progressNotes[0].nextSteps && (
                      <div>
                        <div className="font-semibold text-blue-700 mb-1">⏭️ Další kroky:</div>
                        <div className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{caseData.progressNotes[0].nextSteps}</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Úkoly</div>
                <div className="text-3xl font-bold">{completedTasks}/{totalTasks}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round((completedTasks/totalTasks)*100)}% dokončeno</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Dokumenty</div>
                <div className="text-3xl font-bold">{getAllDocuments().length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Připojeno ke spisu</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Fakturace</div>
                <div className="text-2xl font-bold">{totalCost.toLocaleString()} Kč</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDuration(totalMinutes)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Nedokončené úkoly */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">🚀 Nedokončené úkoly</h3>
              <div className="space-y-2">
                {caseData.tasks.filter(t => !t.completed).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <Badge className={task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-gray-50 dark:bg-gray-800/500'}>{task.priority.toUpperCase()}</Badge>
                    <div className="flex-1">{task.title}</div>
                    {task.dueDate && <div className="text-sm text-gray-600 dark:text-gray-300">⏰ {new Date(task.dueDate).toLocaleDateString('cs-CZ')}</div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* POZNÁMKY O PRŮBĚHU VIEW */}
      {activeView === 'notes' && (
        <div className="space-y-6">
          <Button onClick={() => setShowAddProgressNote(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Přidat poznámku o průběhu
          </Button>

          {showAddProgressNote && (
            <Card className="border-green-200">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">📝 Nová poznámka o průběhu</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Aktuální stav *</label>
                    <Textarea value={newNoteStatus} onChange={(e) => setNewNoteStatus(e.target.value)} placeholder="Co je aktuální situace? Co jsme udělali?" rows={3} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Problémy</label>
                    <Textarea value={newNoteProblems} onChange={(e) => setNewNoteProblems(e.target.value)} placeholder="Narazili jsme na nějaký problém?" rows={2} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Další kroky</label>
                    <Textarea value={newNoteNextSteps} onChange={(e) => setNewNoteNextSteps(e.target.value)} placeholder="Co je potřeba udělat dál?" rows={3} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Volná poznámka</label>
                    <Textarea value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} placeholder="Další informace..." rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addProgressNote} className="bg-green-600">Uložit</Button>
                    <Button variant="outline" onClick={() => setShowAddProgressNote(false)}>Zrušit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {caseData.progressNotes.map(note => (
            <Card key={note.id} className="border-l-4 border-blue-500">
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-4" suppressHydrationWarning>{new Date(note.date).toLocaleString('cs-CZ')} • {note.author}</div>
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">📌 Aktuální stav:</div>
                    <div className="text-gray-700 dark:text-gray-200">{note.currentStatus}</div>
                  </div>
                  {note.problems && (<div><div className="font-semibold text-red-700 mb-1">⚠️ Problémy:</div><div className="text-gray-700 dark:text-gray-200">{note.problems}</div></div>)}
                  {note.nextSteps && (<div><div className="font-semibold text-blue-700 mb-1">⏭️ Další kroky:</div><div className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{note.nextSteps}</div></div>)}
                  {note.note && (<div className="text-sm text-gray-600 dark:text-gray-300 italic mt-2">{note.note}</div>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ÚKOLY VIEW */}
      {activeView === 'tasks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="border-red-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-red-700 mb-4">🔥 Nedokončené úkoly ({caseData.tasks.filter(t => !t.completed).length})</h3>
                <div className="space-y-2">
                  {caseData.tasks.filter(t => !t.completed).map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 cursor-pointer" onClick={() => toggleTask(task.id)}>
                      <input type="checkbox" checked={false} onChange={() => {}} className="mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge className={task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-gray-50 dark:bg-gray-800/500'}>{task.priority}</Badge>
                          {task.dueDate && <div className="text-xs text-gray-600 dark:text-gray-300">⏰ {new Date(task.dueDate).toLocaleDateString('cs-CZ')}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-green-700 mb-4">✅ Dokončené úkoly ({caseData.tasks.filter(t => t.completed).length})</h3>
                <div className="space-y-2">
                  {caseData.tasks.filter(t => t.completed).map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg opacity-60 hover:opacity-100 cursor-pointer" onClick={() => toggleTask(task.id)}>
                      <input type="checkbox" checked={true} onChange={() => {}} className="mt-1" />
                      <div className="flex-1">
                        <div className="font-medium line-through">{task.title}</div>
                        <Badge className="bg-gray-400 mt-1">{task.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* DOKUMENTY VIEW */}
      {activeView === 'documents' && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">📎 Všechny dokumenty ve spisu ({getAllDocuments().length})</h2>
            <div className="space-y-2">
              {getAllDocuments().map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700">
                  <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{doc.eventTitle} • {new Date(doc.date).toLocaleDateString('cs-CZ')}</div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{doc.size}</div>
                  <Button size="sm" variant="ghost">Otevřít</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TIMELINE VIEW */}
      {activeView === 'timeline' && (
        <>
          {/* Timeline - seskupená podle datumů */}
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
              <div key={dateKey}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-gray-300"></div>
                  <div className="text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                    {dateKey}
                  </div>
                  <div className="h-px flex-1 bg-gray-300"></div>
                </div>

                {/* Events for this day */}
                <div className="space-y-2">
                  {dayEvents.map((event) => {
                    const config = eventTypeConfig[event.type]

                    return (
                      <Card
                        key={event.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => toggleEvent(event.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Time */}
                            <div className="flex-shrink-0 w-12 text-center">
                              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                {formatTime(event.timestamp)}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-1">
                                <Badge className={`${config.bgColor} ${config.textColor} text-xs px-2 py-0.5 flex-shrink-0`}>
                                  {config.label}
                                </Badge>
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex-1">{event.title}</h4>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{event.description}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>{event.user}</span>
                                {event.attachments && event.attachments.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Paperclip className="h-3 w-3" />
                                      {event.attachments.length}
                                    </span>
                                  </>
                                )}
                                {event.comments && event.comments.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      {event.comments.length}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded content */}
                          {event.expanded && (
                            <div className="mt-4 pt-4 border-t ml-15 space-y-4" onClick={(e) => e.stopPropagation()}>
                              {/* Time Tracking */}
                              <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Odpracovaný čas ({event.timeEntries.length})
                                  </h5>
                                  {event.billable && (
                                    <div className="text-right">
                                      <div className="text-sm font-bold text-blue-700">
                                        {formatDuration(getTotalMinutes(event))}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-300">
                                        {getTotalCost(event).toLocaleString()} Kč
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Time Entries List */}
                                {event.timeEntries.length > 0 && (
                                  <div className="space-y-2 mb-3">
                                    {event.timeEntries.map((entry) => (
                                      <div key={entry.id} className="bg-white dark:bg-gray-800 rounded p-3 text-sm">
                                        <div className="flex items-start justify-between mb-1">
                                          <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                              {new Date(entry.date).toLocaleDateString('cs-CZ')} • {entry.startTime} - {entry.endTime}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-300">{entry.user}</div>
                                          </div>
                                          <div className="text-right">
                                            <div className="font-semibold text-blue-700">{formatDuration(entry.duration)}</div>
                                            {event.billable && event.hourlyRate && (
                                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                                {((entry.duration / 60) * event.hourlyRate).toFixed(0)} Kč
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {entry.note && (
                                          <div className="text-xs text-gray-600 dark:text-gray-300 italic mt-1">{entry.note}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Add Time Entry Form */}
                                {showAddTime === event.id ? (
                                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-200 block mb-1">Datum</label>
                                        <Input
                                          type="date"
                                          value={newTimeDate}
                                          onChange={(e) => setNewTimeDate(e.target.value)}
                                          className="text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-200 block mb-1">Od</label>
                                        <Input
                                          type="time"
                                          value={newTimeStart}
                                          onChange={(e) => setNewTimeStart(e.target.value)}
                                          className="text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-200 block mb-1">Do</label>
                                        <Input
                                          type="time"
                                          value={newTimeEnd}
                                          onChange={(e) => setNewTimeEnd(e.target.value)}
                                          className="text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-700 dark:text-gray-200 block mb-1">Poznámka</label>
                                      <Textarea
                                        placeholder="Co se dělalo..."
                                        value={newTimeNote}
                                        onChange={(e) => setNewTimeNote(e.target.value)}
                                        className="text-sm"
                                        rows={2}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => addTimeEntry(event.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Přidat
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowAddTime(null)}
                                      >
                                        Zrušit
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setShowAddTime(event.id)
                                      setNewTimeDate(new Date().toISOString().split('T')[0])
                                    }}
                                    className="w-full"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Přidat odpracovaný čas
                                  </Button>
                                )}
                              </div>

                              {/* Attachments */}
                              {event.attachments && event.attachments.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    Přílohy ({event.attachments.length})
                                  </h5>
                                  <div className="space-y-2">
                                    {event.attachments.map((att, idx) => (
                                      <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700">
                                        <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900 dark:text-white">{att.name}</p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">{att.size}</p>
                                        </div>
                                        <Button size="sm" variant="ghost">Otevřít</Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Comments */}
                              {event.comments && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Komentáře ({event.comments.length})
                                  </h5>
                                  <div className="space-y-2">
                                    {event.comments.map((comment) => (
                                      <div key={comment.id} className="bg-gray-50 dark:bg-gray-800/50 rounded p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.user}</span>
                                          <span className="text-xs text-gray-500 dark:text-gray-400">• {comment.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-200">{comment.text}</p>
                                      </div>
                                    ))}

                                    {/* Add comment */}
                                    <div className="flex gap-2 mt-3">
                                      <Textarea
                                        placeholder="Přidat komentář..."
                                        value={newComment[event.id] || ''}
                                        onChange={(e) => setNewComment({ ...newComment, [event.id]: e.target.value })}
                                        className="flex-1"
                                        rows={2}
                                      />
                                      <Button
                                        onClick={() => addComment(event.id)}
                                        className="self-end bg-blue-600 hover:bg-blue-700"
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
