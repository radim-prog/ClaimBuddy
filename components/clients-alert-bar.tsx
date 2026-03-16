'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Users,
  AlertCircle,
  Clock,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  Mail,
  MessageSquare,
  ExternalLink,
  Send,
  FileText,
  CheckCircle2,
  Circle,
  Calendar,
  User,
  Filter,
  History,
  Repeat,
  Keyboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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

interface ClientsAlertBarProps {
  companies: Company[]
  closures: MonthlyClosure[]
  deadlines?: DeadlineItem[]
}

export function ClientsAlertBar({ companies, closures, deadlines = [] }: ClientsAlertBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentFilter = searchParams.get('status')

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
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [urgencyTarget, setUrgencyTarget] = useState<DeadlineItem | null>(null)
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

  // Filter only current and past closures
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const relevantClosures = useMemo(() => {
    return closures.filter(c => {
      const [year, month] = c.period.split('-').map(Number)
      if (year < currentYear) return true
      if (year === currentYear && month <= currentMonth) return true
      return false
    })
  }, [closures, currentYear, currentMonth])

  // Calculate stats per company (not per document!)
  const stats = useMemo(() => {
    const missing = new Set<string>()
    const uploaded = new Set<string>()
    const complete = new Set<string>()

    companies.forEach(company => {
      const companyClosures = relevantClosures.filter(c => c.company_id === company.id)

      let hasMissing = false
      let hasUploaded = false
      let allComplete = true

      companyClosures.forEach(closure => {
        if (
          closure.bank_statement_status === 'missing' ||
          closure.expense_documents_status === 'missing' ||
          closure.income_invoices_status === 'missing'
        ) {
          hasMissing = true
          allComplete = false
        }

        if (
          closure.bank_statement_status === 'uploaded' ||
          closure.expense_documents_status === 'uploaded' ||
          closure.income_invoices_status === 'uploaded'
        ) {
          hasUploaded = true
        }

        if (
          closure.bank_statement_status !== 'approved' ||
          closure.expense_documents_status !== 'approved' ||
          closure.income_invoices_status !== 'approved'
        ) {
          allComplete = false
        }
      })

      if (hasMissing) {
        missing.add(company.id)
      } else if (hasUploaded) {
        uploaded.add(company.id)
      } else if (allComplete && companyClosures.length > 0) {
        complete.add(company.id)
      }
    })

    return {
      missing: missing.size,
      uploaded: uploaded.size,
      complete: complete.size,
      total: companies.length
    }
  }, [companies, relevantClosures])

  // Function to set filter via URL
  const setFilter = useCallback((status: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(newUrl)
  }, [pathname, router, searchParams])

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
    toast.success(`Úkol "${item.title}" delegován klientovi ${item.companyName}`)
  }

  const handleSaveNote = (id: string) => {
    if (noteInput.trim()) {
      setNotes({ ...notes, [id]: noteInput.trim() })
    }
    setEditingNoteId(null)
    setNoteInput('')
  }

  const handleSendReminder = (item: DeadlineItem) => {
    toast.success(`Urgence odeslána klientovi: ${item.companyName}`)
  }

  const handleSendAllReminders = () => {
    const clientsToRemind = overdue.filter(d => d.companyName)
    toast.success(`Hromadná upomínka odeslána ${clientsToRemind.length} klientům`)
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
                {/* Main task row - clickable to expand */}
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
                        {item.companyName && (
                          <span className="text-sm text-purple-600">{item.companyName}</span>
                        )}
                        {notes[item.id] && !isTaskExpanded && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                            📝 {notes[item.id]}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {!isTaskExpanded ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-green-600 dark:text-green-400"
                            onClick={() => handleComplete(item.id)}
                            title="Označit jako hotové"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Link href={`/accountant/clients/${item.companyId}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-purple-600"
                              title="Zobrazit detail"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </>
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

                {/* Expanded task details */}
                {isTaskExpanded && (
                  <div className="border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-3 space-y-3" onClick={e => e.stopPropagation()}>
                    {/* Description */}
                    {item.description && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Popis</div>
                        <p className="text-sm text-gray-700 dark:text-gray-200">{item.description}</p>
                      </div>
                    )}

                    {/* Meta info */}
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
                      {item.companyName && (
                        <Link
                          href={`/accountant/clients/${item.companyId}`}
                          className="flex items-center gap-1 text-purple-600 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>{item.companyName}</span>
                        </Link>
                      )}
                    </div>

                    {/* Checklist */}
                    {hasChecklist && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Dokumenty:</span>
                        {item.checklist!.map(checkItem => (
                          <span
                            key={checkItem.id}
                            className={`text-xs font-medium ${
                              checkItem.completed
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {checkItem.label.replace('Výpis z banky', 'Výpis').replace('Nákladové doklady', 'Náklady').replace('Příjmové faktury', 'Příjmy')} {checkItem.completed ? '\u2705' : '\u274C'}
                          </span>
                        ))}
                        <span className="text-xs text-gray-400">
                          ({checklistProgress.completed}/{checklistProgress.total})
                        </span>
                      </div>
                    )}

                    {/* Attachments */}
                    {item.attachments && item.attachments.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Přílohy</div>
                        <div className="flex flex-wrap gap-2">
                          {item.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url}
                              className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded hover:bg-purple-100 dark:hover:bg-purple-800/30"
                            >
                              <FileText className="h-3 w-3" />
                              {att.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {notes[item.id] && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-sm text-yellow-800 dark:text-yellow-300">
                        📝 {notes[item.id]}
                      </div>
                    )}

                    {/* Action buttons */}
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

                      {/* Snooze button with dropdown */}
                      <div className="relative">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
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
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded ${
                                recurringReminders[item.id] === 2 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'
                              }`}
                              onClick={() => handleSetRecurringReminder(item.id, 2)}
                            >
                              2 hodiny
                            </button>
                            <button
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded ${
                                recurringReminders[item.id] === 4 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'
                              }`}
                              onClick={() => handleSetRecurringReminder(item.id, 4)}
                            >
                              4 hodiny
                            </button>
                            <button
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded ${
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
                        className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                        onClick={() => setUrgencyTarget(item)}
                      >
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        Urgovat klienta
                      </Button>

                      {/* Complete button */}
                      {(!hasChecklist || checklistProgress.completed === checklistProgress.total) && (
                        <>
                          {showCompleteConfirm === item.id ? (
                            <div className="flex-1 flex flex-col gap-2 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200">
                              <div className="text-xs text-green-700 dark:text-green-300 font-medium">
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
                        </>
                      )}
                    </div>

                    {/* Note input */}
                    {editingNoteId === item.id && (
                      <div className="flex gap-2 pt-2">
                        <Input
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Poznámka (např. klient na dovolené)..."
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

  const hasProblems = stats.missing > 0 || stats.uploaded > 0

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="bg-gray-800 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              <span className="font-medium">{stats.total} klientů</span>
              <span className="text-gray-400 mx-2">|</span>
              <span className="text-sm text-gray-300">Rychlý filtr:</span>
            </div>

            {/* Interactive stat buttons */}
            <div className="flex items-center gap-2">
              {/* Missing docs */}
              {stats.missing > 0 && (
                <button
                  onClick={() => setFilter(currentFilter === 'missing' ? null : 'missing')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    currentFilter === 'missing'
                      ? 'bg-red-500 text-white ring-2 ring-red-300'
                      : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Chybí: {stats.missing} klientů</span>
                </button>
              )}

              {/* Uploaded docs */}
              {stats.uploaded > 0 && (
                <button
                  onClick={() => setFilter(currentFilter === 'uploaded' ? null : 'uploaded')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    currentFilter === 'uploaded'
                      ? 'bg-yellow-500 text-gray-900 dark:text-white ring-2 ring-yellow-300'
                      : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Ke schválení: {stats.uploaded} klientů</span>
                </button>
              )}

              {/* All good message */}
              {!hasProblems && (
                <div className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-green-300">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Všichni klienti v pořádku</span>
                </div>
              )}

              {/* Clear filter */}
              {currentFilter && (
                <button
                  onClick={() => setFilter(null)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-600 dark:hover:bg-gray-800/10"
                >
                  <X className="h-3.5 w-3.5" />
                  Zrušit filtr
                </button>
              )}

              {/* Expand/collapse button for task details - count unique clients, not tasks */}
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
        <div className="absolute left-0 right-0 top-full bg-gray-50 dark:bg-gray-900 border-b shadow-xl z-40 max-h-[70vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4">
            {/* Bulk actions for overdue */}
            {overdue.length > 0 && (
              <div className="mb-4 pb-4 border-b flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {overdue.length} {overdue.length === 1 ? 'úkol' : overdue.length < 5 ? 'úkoly' : 'úkolů'} po termínu
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                  onClick={() => setShowBulkConfirm(true)}
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Urgovat všechny klienty
                </Button>
                <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hromadna urgence</AlertDialogTitle>
                      <AlertDialogDescription>
                        Opravdu chcete odeslat upominku {overdue.filter(d => d.companyName).length} klientum?
                        Kazdemu bude odeslan email s vyzvou k dodani chybejicich dokumentu.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Zrusit</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={handleSendAllReminders}
                      >
                        Odeslat upominky
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* Grouped deadlines */}
            {renderDeadlineGroup(overdue, 'PO TERMÍNU', 'bg-red-500', 'text-red-600 dark:text-red-400')}
            {renderDeadlineGroup(today, 'DNES', 'bg-orange-500', 'text-orange-600 dark:text-orange-400')}
            {renderDeadlineGroup(thisWeek, 'TENTO TÝDEN', 'bg-yellow-500', 'text-yellow-600 dark:text-yellow-400')}

            {/* Link to all tasks */}
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <Link href="/accountant/tasks">
                <Button variant="outline" className="w-full">
                  Zobrazit všechny úkoly
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      <AlertDialog open={!!urgencyTarget} onOpenChange={(open) => !open && setUrgencyTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Urgovat klienta</AlertDialogTitle>
            <AlertDialogDescription>
              Klientovi {urgencyTarget?.companyName} bude odeslan email s vyzvou k dodani chybejicich dokumentu pro danou uzaverku.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrusit</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                if (urgencyTarget) handleSendReminder(urgencyTarget)
                setUrgencyTarget(null)
              }}
            >
              Odeslat upominku
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
