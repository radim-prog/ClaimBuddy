'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Building2,
  Filter,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  generateAllDeadlines,
  getDeadlineTypeLabel,
  getDeadlineTypeColor,
  type GeneratedDeadline,
  type StatutoryDeadlineTemplate,
} from '@/lib/statutory-deadlines'

type Company = {
  id: string
  name: string
  vat_payer: boolean
  vat_period?: 'monthly' | 'quarterly' | null
  has_employees?: boolean
  legal_form: string
}

const monthNamesFull = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
]

export default function DeadlinesPage() {
  const { userName } = useAccountantUser()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1) // 1-indexed
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [completedMap, setCompletedMap] = useState<Record<string, { at: string; by: string }>>({})

  // Fetch companies
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch('/api/accountant/matrix')
        const data = await res.json()
        setCompanies(data.companies.filter((c: any) => c.status !== 'inactive'))
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  // Generate deadlines
  const deadlines = useMemo(() => {
    if (companies.length === 0) return []
    return generateAllDeadlines(companies as any, selectedYear, selectedMonth)
      .map(d => ({
        ...d,
        completed: !!completedMap[d.id],
        completed_at: completedMap[d.id]?.at,
        completed_by: completedMap[d.id]?.by,
      }))
      .sort((a, b) => {
        // Sort by date, then by type
        if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date)
        return a.type.localeCompare(b.type)
      })
  }, [companies, selectedYear, selectedMonth, completedMap])

  // Apply filters
  const filteredDeadlines = useMemo(() => {
    return deadlines.filter(d => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (statusFilter === 'pending' && d.completed) return false
      if (statusFilter === 'completed' && !d.completed) return false
      return true
    })
  }, [deadlines, typeFilter, statusFilter])

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, GeneratedDeadline[]> = {}
    filteredDeadlines.forEach(d => {
      if (!groups[d.due_date]) groups[d.due_date] = []
      groups[d.due_date].push(d)
    })
    return groups
  }, [filteredDeadlines])

  // Stats
  const stats = useMemo(() => ({
    total: deadlines.length,
    completed: deadlines.filter(d => d.completed).length,
    pending: deadlines.filter(d => !d.completed).length,
  }), [deadlines])

  // Toggle completion
  const toggleCompleted = (deadlineId: string) => {
    setCompletedMap(prev => {
      if (prev[deadlineId]) {
        const next = { ...prev }
        delete next[deadlineId]
        return next
      }
      return {
        ...prev,
        [deadlineId]: {
          at: new Date().toISOString(),
          by: userName || 'Účetní',
        },
      }
    })
  }

  // Navigate months
  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(y => y - 1)
    } else {
      setSelectedMonth(m => m - 1)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(y => y + 1)
    } else {
      setSelectedMonth(m => m + 1)
    }
  }

  const today = now.toISOString().split('T')[0]

  // Day status styling
  const getDayStatus = (dateStr: string) => {
    if (dateStr < today) return { label: 'Po termínu', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200' }
    if (dateStr === today) return { label: 'Dnes', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50', border: 'border-orange-200' }
    const diff = Math.ceil((new Date(dateStr).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 7) return { label: `Za ${diff} dní`, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200' }
    return { label: '', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-white dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Načítám termíny...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <CalendarCheck className="h-8 w-8 text-purple-600" />
          Zákonné termíny
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Přehled zákonných povinností pro všechny aktivní klienty
        </p>
      </div>

      {/* Month navigation + Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold rounded-lg min-w-[180px] text-center">
            {monthNamesFull[selectedMonth - 1]} {selectedYear}
          </span>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Celkem: <span className="font-bold text-gray-900 dark:text-white">{stats.total}</span>
          </span>
          <span className="text-green-600 dark:text-green-400">
            Splněno: <span className="font-bold">{stats.completed}</span>
          </span>
          <span className="text-red-600 dark:text-red-400">
            Zbývá: <span className="font-bold">{stats.pending}</span>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtr:</span>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Typ termínu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny typy</SelectItem>
            <SelectItem value="vat">DPH</SelectItem>
            <SelectItem value="tax">Daně</SelectItem>
            <SelectItem value="payroll">Mzdy</SelectItem>
            <SelectItem value="insurance">Pojištění</SelectItem>
            <SelectItem value="closing">Uzávěrka</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Stav" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Vše</SelectItem>
            <SelectItem value="pending">Nesplněno</SelectItem>
            <SelectItem value="completed">Splněno</SelectItem>
          </SelectContent>
        </Select>

        {(typeFilter !== 'all' || statusFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setTypeFilter('all'); setStatusFilter('all') }}
            className="text-purple-600"
          >
            <X className="h-4 w-4 mr-1" /> Zrušit filtry
          </Button>
        )}

        <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {filteredDeadlines.length} z {deadlines.length} termínů
        </div>
      </div>

      {/* Deadlines grouped by date */}
      {Object.keys(groupedByDate).length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Žádné termíny pro tento měsíc</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateStr, items]) => {
            const dayStatus = getDayStatus(dateStr)
            const date = new Date(dateStr)
            const dayName = date.toLocaleDateString('cs-CZ', { weekday: 'long' })
            const dayNum = date.getDate()

            return (
              <div key={dateStr} className={`border rounded-lg ${dayStatus.border} overflow-hidden`}>
                {/* Date header */}
                <div className={`${dayStatus.bg} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[40px]">
                      <div className={`text-2xl font-bold ${dayStatus.color}`}>{dayNum}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{dayName}</div>
                    </div>
                    {dayStatus.label && (
                      <Badge variant="outline" className={`${dayStatus.color} border-current`}>
                        {dayStatus.label}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{items.length} termínů</span>
                </div>

                {/* Deadline items */}
                <div className="divide-y">
                  {items.map(deadline => {
                    const typeColor = getDeadlineTypeColor(deadline.type)
                    return (
                      <div
                        key={deadline.id}
                        className={`px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-700 transition-colors ${
                          deadline.completed ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleCompleted(deadline.id)}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            deadline.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {deadline.completed && <Check className="h-4 w-4" />}
                        </button>

                        {/* Type badge */}
                        <Badge variant="outline" className={`${typeColor.bg} ${typeColor.text} text-xs flex-shrink-0`}>
                          {getDeadlineTypeLabel(deadline.type)}
                        </Badge>

                        {/* Title + description */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${deadline.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {deadline.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{deadline.description}</p>
                        </div>

                        {/* Company */}
                        <Link
                          href={`/accountant/clients/${deadline.company_id}`}
                          className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-purple-600 flex-shrink-0 max-w-[200px]"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="truncate">{deadline.company_name}</span>
                        </Link>

                        {/* Completed info */}
                        {deadline.completed && deadline.completed_by && (
                          <span className="text-xs text-gray-400 dark:text-gray-400 flex-shrink-0">
                            {deadline.completed_by}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
