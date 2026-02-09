'use client'

import { useState, useRef, useEffect } from 'react'
import {
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  Clock,
  Mail,
  MessageSquare,
  ExternalLink,
  Bell,
  Send,
  FileText,
  CheckCircle2,
  Circle,
  Calendar,
  User,
  Filter,
  History,
  Users,
  Repeat,
  Keyboard,
  ClipboardList
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

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
  // Extended details for expandable view
  description?: string
  checklist?: TaskChecklistItem[]
  assignedTo?: string
  attachments?: { name: string; url: string }[]
}

interface DeadlineAlertBarProps {
  deadlines: DeadlineItem[]
}

type SnoozeOption = '1h' | '2h' | '4h' | 'tomorrow' | 'custom'

interface CompletedTask {
  id: string
  title: string
  companyName?: string
  completedAt: Date
  note?: string
}

export function DeadlineAlertBar({ deadlines }: DeadlineAlertBarProps) {
  const [expanded, setExpanded] = useState(false)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [completedHistory, setCompletedHistory] = useState<CompletedTask[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')
  const [snoozedTasks, setSnoozedTasks] = useState<Record<string, Date>>({})
  const [showSnoozeMenuForTask, setShowSnoozeMenuForTask] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [completionNote, setCompletionNote] = useState('')
  const [showCompleteConfirm, setShowCompleteConfirm] = useState<string | null>(null)
  const [clientFilter, setClientFilter] = useState<string | null>(null)
  const [showClientFilter, setShowClientFilter] = useState(false)
  const [recurringReminders, setRecurringReminders] = useState<Record<string, number>>({}) // taskId -> hours
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(-1)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const filteredTasksRef = useRef<typeof deadlines>([])
  const expandedRef = useRef(expanded)
  expandedRef.current = expanded

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExpanded(false)
        setShowSnoozeMenuForTask(null)
        setShowClientFilter(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Check if any snoozed tasks have expired
  useEffect(() => {
    const now = new Date()
    const expiredSnoozes = Object.entries(snoozedTasks).filter(([_, until]) => now >= until)
    if (expiredSnoozes.length > 0) {
      const newSnoozed = { ...snoozedTasks }
      expiredSnoozes.forEach(([id]) => delete newSnoozed[id])
      setSnoozedTasks(newSnoozed)
    }
  }, [snoozedTasks])

  // Helper to check if a task is snoozed
  const isTaskSnoozed = (taskId: string) => {
    const until = snoozedTasks[taskId]
    return until && new Date() < until
  }

  if (deadlines.length === 0) return null

  // Get unique clients for filter
  const uniqueClients = Array.from(new Set(deadlines.map(d => d.companyName).filter(Boolean))) as string[]

  // Filter out completed AND snoozed tasks, and apply client filter
  const visibleDeadlines = deadlines.filter(d =>
    !completedIds.includes(d.id) && !isTaskSnoozed(d.id)
  )

  const visibleDeadlinesFiltered = clientFilter
    ? visibleDeadlines.filter(d => d.companyName === clientFilter)
    : visibleDeadlines

  // Update ref for keyboard navigation
  filteredTasksRef.current = visibleDeadlinesFiltered

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Only handle if dropdown is expanded
      if (!expandedRef.current) {
        // 'D' to toggle dropdown
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault()
          setExpanded(true)
        }
        return
      }

      const tasks = filteredTasksRef.current
      switch (e.key) {
        case 'Escape':
          setExpanded(false)
          setExpandedTaskId(null)
          setSelectedTaskIndex(-1)
          break
        case 'd':
        case 'D':
          e.preventDefault()
          setExpanded(false)
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedTaskIndex(prev => Math.min(prev + 1, tasks.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedTaskIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          setSelectedTaskIndex(current => {
            if (current >= 0 && current < tasks.length) {
              const task = tasks[current]
              setExpandedTaskId(prev => prev === task.id ? null : task.id)
            }
            return current
          })
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (visibleDeadlines.length === 0) return null

  // Počítá DNY od půlnoci - úkol na "dnes" není overdue
  const getDaysUntilMidnight = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getHoursUntil = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60))
  }

  const getDaysUntil = (dueDate: string) => {
    const hours = getHoursUntil(dueDate)
    return Math.floor(hours / 24)
  }

  const formatTimeLeft = (dueDate: string) => {
    const days = getDaysUntilMidnight(dueDate)
    if (days < 0) {
      return `${Math.abs(days)}d po termínu`
    }
    if (days === 0) return 'dnes'
    if (days === 1) return 'zítra'
    return `${days}d`
  }

  // Group deadlines - použít půlnoc pro férové porovnání
  const overdue = visibleDeadlinesFiltered.filter(d => getDaysUntilMidnight(d.dueDate) < 0)
  const today = visibleDeadlinesFiltered.filter(d => getDaysUntilMidnight(d.dueDate) === 0)
  const thisWeek = visibleDeadlinesFiltered.filter(d => {
    const days = getDaysUntilMidnight(d.dueDate)
    return days >= 1 && days <= 7
  })

  const handleComplete = (id: string) => {
    const task = deadlines.find(d => d.id === id)
    if (task) {
      setCompletedHistory(prev => [...prev, {
        id: task.id,
        title: task.title,
        companyName: task.companyName,
        completedAt: new Date(),
        note: notes[id]
      }])
    }
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
    // Also do initial snooze
    handleSnoozeTask(taskId, hours)
  }

  const handleDelegateToClient = (item: DeadlineItem) => {
    // TODO: Implement actual delegation - send email to client with task details
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
    // TODO: Implement actual email/SMS sending
    toast.success(`Urgence odeslána klientovi: ${item.companyName}`)
  }

  const handleSendAllReminders = () => {
    const clientsToRemind = overdue.filter(d => d.companyName)
    // TODO: Implement actual bulk sending
    toast.success(`Hromadná upomínka odeslána ${clientsToRemind.length} klientům`)
  }

  // Checklist položky jsou pouze read-only - odvozené ze skutečného stavu dokumentů
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

  const mostUrgent = visibleDeadlines[0]
  const hasOverdue = overdue.length > 0

  // Generate summary text for collapsed bar showing WHO and WHAT is missing
  const generateCollapsedSummary = () => {
    if (hasOverdue) {
      // Show overdue items with company and what's missing
      const summaryItems = overdue.slice(0, 3).map(item => {
        const missingItems: string[] = []
        if (item.checklist) {
          item.checklist.forEach(c => {
            if (!c.completed) {
              // Zkrátit názvy dokumentů
              if (c.label.toLowerCase().includes('výpis')) missingItems.push('výpis')
              else if (c.label.toLowerCase().includes('náklad') || c.label.toLowerCase().includes('expense')) missingItems.push('náklady')
              else if (c.label.toLowerCase().includes('faktur') || c.label.toLowerCase().includes('příjm')) missingItems.push('faktury')
              else missingItems.push(c.label)
            }
          })
        }
        const missing = missingItems.length > 0 ? ` (${missingItems.slice(0, 2).join(', ')})` : ''
        return `${item.companyName || item.title}${missing}`
      })

      const remaining = overdue.length - 3
      if (remaining > 0) {
        return summaryItems.join(', ') + ` a další ${remaining}`
      }
      return summaryItems.join(', ')
    } else {
      // Show upcoming deadlines
      const summaryItems = today.slice(0, 2).map(item => item.companyName || item.title)
      const remaining = visibleDeadlines.length - 2
      if (remaining > 0) {
        return summaryItems.join(', ') + ` a další ${remaining}`
      }
      return summaryItems.join(', ')
    }
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
          {items.map((item, index) => {
            const isTaskExpanded = expandedTaskId === item.id
            const checklistProgress = getCompletedChecklistCount(item)
            const hasChecklist = item.checklist && item.checklist.length > 0
            const globalIndex = visibleDeadlinesFiltered.findIndex(d => d.id === item.id)
            const isSelected = selectedTaskIndex === globalIndex
            const hasRecurring = recurringReminders[item.id]

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border transition-all ${
                  isTaskExpanded ? 'shadow-lg border-purple-300' : 'hover:shadow-md'
                } ${isSelected ? 'ring-2 ring-purple-400 ring-offset-1' : ''}`}
              >
                {/* Main task row - clickable to expand */}
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedTaskId(isTaskExpanded ? null : item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Expand indicator */}
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
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded">
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
                  <div className="border-t bg-gray-50/50 p-4 space-y-4" onClick={e => e.stopPropagation()}>
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

                    {/* Checklist - pouze read-only stav odvozený ze systému */}
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
                        <p className="text-xs text-gray-400 mt-2 italic">
                          Stav se aktualizuje automaticky po nahrání dokumentů klientem.
                        </p>
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
                              className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100"
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
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-sm text-yellow-800">
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
                            {recurringReminders[item.id] && (
                              <>
                                <div className="border-t my-1"></div>
                                <button
                                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                                  onClick={() => {
                                    setRecurringReminders(prev => {
                                      const next = { ...prev }
                                      delete next[item.id]
                                      return next
                                    })
                                    setShowSnoozeMenuForTask(null)
                                  }}
                                >
                                  Zrušit opakování
                                </button>
                              </>
                            )}
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

                      {item.companyName && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                          onClick={() => handleDelegateToClient(item)}
                        >
                          <Users className="h-3.5 w-3.5 mr-1" />
                          Delegovat na klienta
                        </Button>
                      )}

                      <Link href={`/accountant/clients/${item.companyId}`}>
                        <Button size="sm" variant="outline" className="text-purple-600 border-purple-300">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Zobrazit detail
                        </Button>
                      </Link>

                      {/* Complete button - shows confirm */}
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

                    {/* Note input (when editing) */}
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

  // Count unique clients (not individual deadlines!)
  const pendingClients = new Set(
    visibleDeadlinesFiltered
      .filter(d => d.title.includes('čeká na schválení'))
      .map(d => d.companyId)
      .filter(Boolean)
  )
  const missingClients = new Set(
    visibleDeadlinesFiltered
      .filter(d => d.title.includes('chybí'))
      .map(d => d.companyId)
      .filter(Boolean)
  )

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main bar - modern dark style */}
      <div className="bg-gray-800 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-400" />
            <span className="font-medium">Přehled úkolů</span>
          </div>

          {/* Stats as clickable badges */}
          <div className="flex items-center gap-2">
            {/* Overdue - po termínu */}
            {overdue.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Po termínu: {overdue.length}</span>
              </button>
            )}

            {/* Pending - ke schválení (count unique clients) */}
            {pendingClients.size > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-500 text-gray-900 dark:text-white hover:bg-yellow-400 transition-all"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Ke schválení: {pendingClients.size} {pendingClients.size === 1 ? 'klient' : pendingClients.size < 5 ? 'klienti' : 'klientů'}</span>
              </button>
            )}

            {/* Missing docs - chybí (count unique clients) */}
            {missingClients.size > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Chybí dokumenty: {missingClients.size} {missingClients.size === 1 ? 'klient' : missingClients.size < 5 ? 'klienti' : 'klientů'}</span>
              </button>
            )}

            {/* All good */}
            {visibleDeadlines.length === 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-green-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Vše v pořádku</span>
              </div>
            )}

            {/* Expand/collapse button */}
            {visibleDeadlines.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs bg-gray-800 dark:bg-gray-800/10 hover:bg-gray-700 dark:hover:bg-gray-800/20 text-white border-0 ml-2"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Skrýt' : 'Detail'}
                {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded dropdown */}
      {expanded && (
        <div className="absolute left-0 right-0 top-full bg-gray-50 dark:bg-gray-800/50 border-b shadow-xl z-40 max-h-[70vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4">
            {/* Toolbar with filters and history */}
            <div className="mb-4 pb-4 border-b flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Client filter */}
                <div className="relative">
                  <Button
                    size="sm"
                    variant={clientFilter ? 'default' : 'outline'}
                    className={clientFilter ? 'bg-purple-600 hover:bg-purple-700' : ''}
                    onClick={() => setShowClientFilter(!showClientFilter)}
                  >
                    <Filter className="h-3.5 w-3.5 mr-1" />
                    {clientFilter || 'Všichni klienti'}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                  {showClientFilter && (
                    <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-1 z-50 min-w-[180px] max-h-[200px] overflow-y-auto">
                      <button
                        className={`w-full text-left px-3 py-1.5 text-sm rounded ${
                          !clientFilter ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700'
                        }`}
                        onClick={() => {
                          setClientFilter(null)
                          setShowClientFilter(false)
                        }}
                      >
                        Všichni klienti
                      </button>
                      {uniqueClients.map(client => (
                        <button
                          key={client}
                          className={`w-full text-left px-3 py-1.5 text-sm rounded ${
                            clientFilter === client ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700'
                          }`}
                          onClick={() => {
                            setClientFilter(client)
                            setShowClientFilter(false)
                          }}
                        >
                          {client}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* History button */}
                <Button
                  size="sm"
                  variant={showHistory ? 'default' : 'outline'}
                  className={showHistory ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History className="h-3.5 w-3.5 mr-1" />
                  Dokončeno dnes ({completedHistory.filter(h => {
                    const today = new Date()
                    const completed = new Date(h.completedAt)
                    return completed.toDateString() === today.toDateString()
                  }).length})
                </Button>

                {/* Keyboard help */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500 dark:text-gray-400"
                  onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                  title="Klávesové zkratky"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Bulk actions for overdue */}
              {overdue.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:bg-orange-900/20"
                  onClick={handleSendAllReminders}
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Urgovat všechny klienty
                </Button>
              )}
            </div>

            {/* Keyboard shortcuts help */}
            {showKeyboardHelp && (
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                <div className="font-medium text-gray-700 dark:text-gray-200 mb-2">Klávesové zkratky:</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-gray-600 dark:text-gray-400">
                  <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border text-xs">D</kbd> Otevřít/zavřít</div>
                  <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border text-xs">↑↓</kbd> Navigace</div>
                  <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border text-xs">Enter</kbd> Rozbalit úkol</div>
                  <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border text-xs">Esc</kbd> Zavřít</div>
                </div>
              </div>
            )}

            {/* History panel */}
            {showHistory && completedHistory.length > 0 && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Dokončené úkoly dnes
                </div>
                <div className="space-y-2">
                  {completedHistory
                    .filter(h => {
                      const today = new Date()
                      const completed = new Date(h.completedAt)
                      return completed.toDateString() === today.toDateString()
                    })
                    .map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-green-100">
                        <div>
                          <span className="text-sm font-medium text-gray-800">{item.title}</span>
                          {item.companyName && (
                            <span className="text-sm text-purple-600 ml-2">({item.companyName})</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.completedAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {showHistory && completedHistory.length === 0 && (
              <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 text-sm">
                Zatím žádné dokončené úkoly
              </div>
            )}

            {/* Empty state when filter shows no results */}
            {clientFilter && visibleDeadlinesFiltered.length === 0 && (
              <div className="mb-4 p-6 bg-white dark:bg-gray-800 rounded-lg border text-center">
                <Filter className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-gray-600 dark:text-gray-400">Žádné úkoly pro klienta <strong>{clientFilter}</strong></div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setClientFilter(null)}
                >
                  Zobrazit všechny klienty
                </Button>
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
    </div>
  )
}
