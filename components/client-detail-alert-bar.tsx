'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  Mail,
  MessageSquare,
  ExternalLink,
  Send,
  CheckCircle2,
  Circle,
  Calendar,
  User,
  Repeat,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

type StatusType = 'missing' | 'uploaded' | 'approved'

type Company = {
  id: string
  name: string
  group_name?: string | null
  ico: string
}

type MonthlyClosure = {
  id: string
  company_id: string
  period: string
  status: string
  bank_statement_status: StatusType
  expense_documents_status: StatusType
  income_invoices_status: StatusType
}

interface TaskChecklistItem {
  id: string
  label: string
  completed: boolean
}

interface DeadlineItem {
  id: string
  title: string
  dueDate: string
  type: 'critical' | 'urgent' | 'warning'
  caseId?: string
  companyId?: string
  companyName?: string
  description?: string
  checklist?: TaskChecklistItem[]
  assignedTo?: string
  attachments?: { name: string; url: string }[]
}

interface ClientDetailAlertBarProps {
  companyId: string
  companies: Company[]
  closures: MonthlyClosure[]
  deadlines?: DeadlineItem[]
}

const months = [
  'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer',
  'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'
]

export function ClientDetailAlertBar({ companyId, companies, closures, deadlines = [] }: ClientDetailAlertBarProps) {
  const router = useRouter()

  // Expanded state for dropdown
  const [expanded, setExpanded] = useState(false)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')
  const [snoozedTasks, setSnoozedTasks] = useState<Record<string, Date>>({})
  const [showSnoozeMenuForTask, setShowSnoozeMenuForTask] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [completionNote, setCompletionNote] = useState('')
  const [showCompleteConfirm, setShowCompleteConfirm] = useState<string | null>(null)
  const [recurringReminders, setRecurringReminders] = useState<Record<string, number>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExpanded(false)
        setShowSnoozeMenuForTask(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper to check if a task is snoozed
  const isTaskSnoozed = (taskId: string) => {
    const until = snoozedTasks[taskId]
    return until && new Date() < until
  }

  // Find the company
  const company = useMemo(() => {
    return companies.find(c => c.id === companyId)
  }, [companies, companyId])

  // Filter closures for this company only - current and past
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const clientClosures = useMemo(() => {
    return closures
      .filter(c => {
        if (c.company_id !== companyId) return false
        const [year, month] = c.period.split('-').map(Number)
        if (year < currentYear) return true
        if (year === currentYear && month <= currentMonth) return true
        return false
      })
      .sort((a, b) => b.period.localeCompare(a.period))
  }, [closures, companyId, currentYear, currentMonth])

  // Calculate stats for this client
  const stats = useMemo(() => {
    let missingCount = 0
    let uploadedCount = 0
    let approvedCount = 0
    const missingPeriods: string[] = []
    const uploadedPeriods: string[] = []

    clientClosures.forEach(closure => {
      const [year, month] = closure.period.split('-').map(Number)
      const periodLabel = `${months[month - 1]} ${year}`

      const hasMissing =
        closure.bank_statement_status === 'missing' ||
        closure.expense_documents_status === 'missing' ||
        closure.income_invoices_status === 'missing'

      const hasUploaded =
        closure.bank_statement_status === 'uploaded' ||
        closure.expense_documents_status === 'uploaded' ||
        closure.income_invoices_status === 'uploaded'

      const allApproved =
        closure.bank_statement_status === 'approved' &&
        closure.expense_documents_status === 'approved' &&
        closure.income_invoices_status === 'approved'

      if (hasMissing) {
        missingCount++
        missingPeriods.push(periodLabel)
      } else if (hasUploaded) {
        uploadedCount++
        uploadedPeriods.push(periodLabel)
      } else if (allApproved) {
        approvedCount++
      }
    })

    return {
      missing: missingCount,
      uploaded: uploadedCount,
      approved: approvedCount,
      total: clientClosures.length,
      missingPeriods,
      uploadedPeriods
    }
  }, [clientClosures])

  // Build display name with group
  const displayName = useMemo(() => {
    if (!company) return 'Neznámý klient'
    return company.group_name
      ? `${company.group_name} – ${company.name}`
      : company.name
  }, [company])

  // Filter out completed and snoozed tasks
  const visibleDeadlines = deadlines.filter(d =>
    !completedIds.includes(d.id) && !isTaskSnoozed(d.id)
  )

  // Time helpers
  const getHoursUntil = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60))
  }

  const formatTimeLeft = (dueDate: string) => {
    const hours = getHoursUntil(dueDate)
    if (hours < 0) {
      const days = Math.abs(Math.floor(hours / 24))
      if (days === 0) return 'dnes prošlo'
      return `${days}d po termínu`
    }
    if (hours === 0) return 'teď!'
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
  }

  // Group deadlines
  const overdue = visibleDeadlines.filter(d => getHoursUntil(d.dueDate) < 0)
  const today = visibleDeadlines.filter(d => {
    const hours = getHoursUntil(d.dueDate)
    return hours >= 0 && hours < 24
  })
  const thisWeek = visibleDeadlines.filter(d => {
    const hours = getHoursUntil(d.dueDate)
    return hours >= 24 && hours < 168
  })

  // Action handlers
  const handleComplete = (id: string) => {
    setCompletedIds([...completedIds, id])
  }

  const handleSnoozeTask = (taskId: string, hours: number) => {
    const snoozeDate = new Date()
    snoozeDate.setHours(snoozeDate.getHours() + hours)
    setSnoozedTasks(prev => ({ ...prev, [taskId]: snoozeDate }))
    setShowSnoozeMenuForTask(null)
    setExpandedTaskId(null)
  }

  const handleSnoozeTomorrow = (taskId: string) => {
    const snoozeDate = new Date()
    snoozeDate.setDate(snoozeDate.getDate() + 1)
    snoozeDate.setHours(9, 0, 0, 0)
    setSnoozedTasks(prev => ({ ...prev, [taskId]: snoozeDate }))
    setShowSnoozeMenuForTask(null)
    setExpandedTaskId(null)
  }

  const handleSetRecurringReminder = (taskId: string, hours: number) => {
    setRecurringReminders(prev => ({ ...prev, [taskId]: hours }))
    setShowSnoozeMenuForTask(null)
    handleSnoozeTask(taskId, hours)
  }

  const handleDelegateToClient = (item: DeadlineItem) => {
    alert(`Úkol "${item.title}" byl delegován klientovi ${item.companyName}. Email s instrukcemi byl odeslán.`)
  }

  const handleSaveNote = (id: string) => {
    if (noteInput.trim()) {
      setNotes({ ...notes, [id]: noteInput.trim() })
    }
    setEditingNoteId(null)
    setNoteInput('')
  }

  const handleSendReminder = (item: DeadlineItem) => {
    alert(`Urgence odeslána klientovi: ${item.companyName}`)
  }

  const getCompletedChecklistCount = (item: DeadlineItem) => {
    if (!item.checklist) return { completed: 0, total: 0 }
    const completed = item.checklist.filter(c => c.completed).length
    return { completed, total: item.checklist.length }
  }

  const handleCompleteWithNote = (id: string) => {
    setCompletedIds([...completedIds, id])
    if (completionNote.trim()) {
      setNotes({ ...notes, [id]: completionNote.trim() })
    }
    setShowCompleteConfirm(null)
    setCompletionNote('')
    setExpandedTaskId(null)
  }

  const renderDeadlineGroup = (items: DeadlineItem[], title: string, bgColor: string, textColor: string) => {
    if (items.length === 0) return null

    return (
      <div className="mb-4 last:mb-0">
        <div className={`text-xs font-bold ${textColor} mb-2 flex items-center gap-2`}>
          <span className={`w-2 h-2 rounded-full ${bgColor}`}></span>
          {title} ({items.length})
        </div>
        <div className="space-y-2">
          {items.map((item) => {
            const isTaskExpanded = expandedTaskId === item.id
            const checklistProgress = getCompletedChecklistCount(item)
            const hasChecklist = item.checklist && item.checklist.length > 0
            const hasRecurring = recurringReminders[item.id]

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border transition-all ${
                  isTaskExpanded ? 'shadow-lg border-purple-300' : 'hover:shadow-md'
                }`}
              >
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedTaskId(isTaskExpanded ? null : item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`transition-transform ${isTaskExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</span>
                          <Badge variant="outline" className={`text-xs ${textColor} border-current`}>
                            {formatTimeLeft(item.dueDate)}
                          </Badge>
                          {hasChecklist && (
                            <Badge variant="secondary" className="text-xs">
                              {checklistProgress.completed}/{checklistProgress.total}
                            </Badge>
                          )}
                          {hasRecurring && (
                            <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                              <Repeat className="h-3 w-3 mr-1" />
                              {hasRecurring}h
                            </Badge>
                          )}
                        </div>
                        {notes[item.id] && !isTaskExpanded && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded">
                            📝 {notes[item.id]}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {!isTaskExpanded ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-green-600 dark:text-green-400"
                          onClick={() => handleComplete(item.id)}
                          title="Označit jako hotové"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-200"
                          onClick={() => setExpandedTaskId(null)}
                          title="Zavřít detail"
                        >
                          <ChevronUp className="h-4 w-4 mr-1" />
                          <span className="text-xs">Zavřít</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {isTaskExpanded && (
                  <div className="border-t bg-gray-50/50 p-4 space-y-4" onClick={e => e.stopPropagation()}>
                    {item.description && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Popis</div>
                        <p className="text-sm text-gray-700 dark:text-gray-200">{item.description}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Termín: {new Date(item.dueDate).toLocaleDateString('cs-CZ')}</span>
                      </div>
                      {item.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span>Přiděleno: {item.assignedTo}</span>
                        </div>
                      )}
                    </div>

                    {hasChecklist && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                          Stav dokumentů
                          <span className="text-purple-600">
                            ({checklistProgress.completed}/{checklistProgress.total})
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {item.checklist!.map(checkItem => (
                            <div
                              key={checkItem.id}
                              className={`flex items-center gap-2 p-2 rounded ${
                                checkItem.completed
                                  ? 'bg-green-50 text-green-700 dark:text-green-400'
                                  : 'bg-red-50 text-red-700 dark:text-red-400'
                              }`}
                            >
                              {checkItem.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-red-400 flex-shrink-0" />
                              )}
                              <span className={`text-sm ${checkItem.completed ? '' : 'font-medium'}`}>
                                {checkItem.label}
                              </span>
                              {!checkItem.completed && (
                                <span className="text-xs text-red-500 ml-auto">Chybí</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.attachments && item.attachments.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Přílohy</div>
                        <div className="flex flex-wrap gap-2">
                          {item.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url}
                              className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100"
                            >
                              <FileText className="h-3 w-3" />
                              {att.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {notes[item.id] && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-sm text-yellow-800">
                        📝 {notes[item.id]}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2 border-t dark:border-gray-700">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-gray-600 dark:text-gray-400"
                        onClick={() => {
                          setEditingNoteId(item.id)
                          setNoteInput(notes[item.id] || '')
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1" />
                        {notes[item.id] ? 'Upravit poznámku' : 'Přidat poznámku'}
                      </Button>

                      <div className="relative">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:bg-blue-900/20"
                          onClick={() => setShowSnoozeMenuForTask(
                            showSnoozeMenuForTask === item.id ? null : item.id
                          )}
                        >
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          Odložit
                        </Button>
                        {showSnoozeMenuForTask === item.id && (
                          <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-1 z-50 min-w-[160px]">
                            <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium">Jednorázově</div>
                            <button
                              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded"
                              onClick={() => handleSnoozeTask(item.id, 1)}
                            >
                              1 hodinu
                            </button>
                            <button
                              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded"
                              onClick={() => handleSnoozeTask(item.id, 2)}
                            >
                              2 hodiny
                            </button>
                            <button
                              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded"
                              onClick={() => handleSnoozeTask(item.id, 4)}
                            >
                              4 hodiny
                            </button>
                            <button
                              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded"
                              onClick={() => handleSnoozeTomorrow(item.id)}
                            >
                              Zítra ráno
                            </button>
                            <div className="border-t my-1"></div>
                            <div className="px-3 py-1 text-xs text-blue-600 font-medium flex items-center gap-1">
                              <Repeat className="h-3 w-3" />
                              Opakovat každých
                            </div>
                            <button
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 rounded ${
                                recurringReminders[item.id] === 2 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'
                              }`}
                              onClick={() => handleSetRecurringReminder(item.id, 2)}
                            >
                              2 hodiny
                            </button>
                            <button
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 rounded ${
                                recurringReminders[item.id] === 4 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'
                              }`}
                              onClick={() => handleSetRecurringReminder(item.id, 4)}
                            >
                              4 hodiny
                            </button>
                            <button
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 rounded ${
                                recurringReminders[item.id] === 24 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'
                              }`}
                              onClick={() => handleSetRecurringReminder(item.id, 24)}
                            >
                              Denně
                            </button>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:bg-orange-900/20"
                        onClick={() => handleSendReminder(item)}
                      >
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        Urgovat klienta
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                        onClick={() => handleDelegateToClient(item)}
                      >
                        <Users className="h-3.5 w-3.5 mr-1" />
                        Delegovat na klienta
                      </Button>

                      {showCompleteConfirm === item.id ? (
                        <div className="flex-1 flex flex-col gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200">
                          <div className="text-xs text-green-700 font-medium">
                            Opravdu označit jako hotové?
                          </div>
                          <Textarea
                            value={completionNote}
                            onChange={(e) => setCompletionNote(e.target.value)}
                            placeholder="Poznámka (volitelné)..."
                            className="h-16 text-sm resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleCompleteWithNote(item.id)}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Potvrdit dokončení
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setShowCompleteConfirm(null)
                                setCompletionNote('')
                              }}
                            >
                              Zrušit
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 ml-auto"
                          onClick={() => setShowCompleteConfirm(item.id)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Označit jako hotové
                        </Button>
                      )}
                    </div>

                    {editingNoteId === item.id && (
                      <div className="flex gap-2 pt-2">
                        <Input
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Poznámka..."
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveNote(item.id)
                            if (e.key === 'Escape') setEditingNoteId(null)
                          }}
                        />
                        <Button size="sm" className="h-8" onClick={() => handleSaveNote(item.id)}>
                          Uložit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => setEditingNoteId(null)}
                        >
                          Zrušit
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="bg-gray-800 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-gray-400">
            <AlertCircle className="h-5 w-5" />
            <span>Klient nenalezen</span>
          </div>
        </div>
      </div>
    )
  }

  const hasProblems = stats.missing > 0 || stats.uploaded > 0

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="bg-gray-800 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Client info */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/accountant/clients')}
                className="text-gray-400 hover:text-white hover:bg-gray-600 dark:hover:bg-gray-800/10 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Klienti
              </Button>

              <span className="text-gray-500 dark:text-gray-400">|</span>

              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-400" />
                <span className="font-medium">{displayName}</span>
                {company.ico && (
                  <span className="text-gray-400 text-sm">IČO: {company.ico}</span>
                )}
              </div>
            </div>

            {/* Right side - Stats */}
            <div className="flex items-center gap-2">
              {/* Missing docs */}
              {stats.missing > 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300"
                  title={`Chybí dokumenty: ${stats.missingPeriods.join(', ')}`}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Chybí: {stats.missing} {stats.missing === 1 ? 'měsíc' : stats.missing < 5 ? 'měsíce' : 'měsíců'}</span>
                </div>
              )}

              {/* Uploaded, waiting for approval */}
              {stats.uploaded > 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300"
                  title={`Ke schválení: ${stats.uploadedPeriods.join(', ')}`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Ke schválení: {stats.uploaded}</span>
                </div>
              )}

              {/* All good message */}
              {!hasProblems && stats.total > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-green-300">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Vše v pořádku</span>
                </div>
              )}

              {/* Expand/collapse button for task details */}
              {visibleDeadlines.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs bg-gray-800 dark:bg-gray-800/10 hover:bg-gray-700 dark:hover:bg-gray-800/20 text-white border-0 ml-2"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Skrýt detail' : 'Zobrazit detail'}
                  {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded dropdown with tasks */}
      {expanded && visibleDeadlines.length > 0 && (
        <div className="absolute left-0 right-0 top-full bg-gray-50 dark:bg-gray-800/50 border-b shadow-xl z-40 max-h-[70vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4">
            {/* Grouped deadlines */}
            {renderDeadlineGroup(overdue, 'PO TERMÍNU', 'bg-red-500', 'text-red-600 dark:text-red-400')}
            {renderDeadlineGroup(today, 'DNES', 'bg-orange-500', 'text-orange-600 dark:text-orange-400')}
            {renderDeadlineGroup(thisWeek, 'TENTO TÝDEN', 'bg-yellow-500', 'text-yellow-600 dark:text-yellow-400')}
          </div>
        </div>
      )}
    </div>
  )
}
