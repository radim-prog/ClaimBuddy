'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BookOpen,
  Search,
  Building2,
  CheckCircle,
  Circle,
  Loader2,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Save,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
// Companies fetched from API (Supabase-backed)
import {
  getAllAnnualClosings,
  initAnnualClosingsForCompanies,
  getAnnualClosingProgress,
  updateAnnualClosingStep,
  type AnnualClosingChecklist,
  type AnnualClosingStepStatus,
} from '@/lib/types/annual-closing'

type FilterStatus = 'all' | 'not_started' | 'in_progress' | 'completed'

export default function AnnualClosingPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [apiCompanies, setApiCompanies] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/accountant/companies')
      .then(res => res.json())
      .then(data => setApiCompanies(data.companies || []))
      .catch(() => {})
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [initialized, setInitialized] = useState(false)
  const [closings, setClosings] = useState<AnnualClosingChecklist[]>([])
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)
  const [selectedChecklist, setSelectedChecklist] = useState<AnnualClosingChecklist | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({})

  // Initialize annual closings for all active companies
  const handleInitialize = () => {
    const companies = apiCompanies.map((c: any) => ({
      id: c.id,
      name: c.name,
      status: c.status,
    }))
    const result = initAnnualClosingsForCompanies(companies, selectedYear)
    setClosings([...result])
    setInitialized(true)
    toast.success(`Roční uzávěrky vytvořeny pro ${result.length} firem`)
  }

  // Refresh closings from store
  const refreshClosings = () => {
    const all = getAllAnnualClosings(selectedYear)
    setClosings([...all])
  }

  // Filter and search
  const filteredClosings = useMemo(() => {
    let result = closings

    if (searchQuery) {
      result = result.filter(c =>
        c.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      result = result.filter(c => {
        const progress = getAnnualClosingProgress(c)
        if (filterStatus === 'completed') return progress.percentage === 100
        if (filterStatus === 'in_progress') return progress.percentage > 0 && progress.percentage < 100
        if (filterStatus === 'not_started') return progress.percentage === 0
        return true
      })
    }

    return result
  }, [closings, searchQuery, filterStatus])

  // Summary stats
  const summary = useMemo(() => {
    const total = closings.length
    let notStarted = 0, inProgress = 0, completed = 0
    closings.forEach(c => {
      const p = getAnnualClosingProgress(c)
      if (p.percentage === 100) completed++
      else if (p.percentage > 0) inProgress++
      else notStarted++
    })
    return { total, notStarted, inProgress, completed }
  }, [closings])

  // Step status cycling
  const cycleStepStatus = (companyId: string, stepId: string, currentStatus: AnnualClosingStepStatus) => {
    const nextStatus: Record<AnnualClosingStepStatus, AnnualClosingStepStatus> = {
      'not_started': 'in_progress',
      'in_progress': 'completed',
      'completed': 'not_started',
      'not_applicable': 'not_started',
    }
    const newStatus = nextStatus[currentStatus]
    updateAnnualClosingStep(companyId, selectedYear, stepId, {
      status: newStatus,
      completed_by: newStatus === 'completed' ? 'Účetní' : undefined,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
    })
    refreshClosings()
  }

  // Save step notes
  const handleSaveNotes = (companyId: string, stepId: string) => {
    const notes = editingNotes[stepId] || ''
    updateAnnualClosingStep(companyId, selectedYear, stepId, { notes })
    refreshClosings()
    toast.success('Poznámka uložena')
  }

  // Status icon
  const StepStatusIcon = ({ status }: { status: AnnualClosingStepStatus }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      case 'not_applicable':
        return <MinusCircle className="h-5 w-5 text-gray-400" />
      default:
        return <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
    }
  }

  // Progress bar color
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500'
    if (percentage > 50) return 'bg-blue-500'
    if (percentage > 0) return 'bg-yellow-500'
    return 'bg-gray-300 dark:bg-gray-600'
  }

  // Company status label
  const getCompanyStatusLabel = (percentage: number) => {
    if (percentage === 100) return { label: 'Hotovo', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300' }
    if (percentage > 0) return { label: 'Rozpracováno', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300' }
    return { label: 'Nezahájeno', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300' }
  }

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-purple-600" />
          Roční uzávěrka
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Checklist kroků pro roční účetní uzávěrku jednotlivých klientů
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Select value={String(selectedYear)} onValueChange={(v) => {
          setSelectedYear(Number(v))
          setInitialized(false)
          setClosings([])
        }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!initialized ? (
          <Button onClick={handleInitialize} className="bg-purple-600 hover:bg-purple-700">
            <Play className="h-4 w-4 mr-2" />
            Inicializovat uzávěrky pro {selectedYear}
          </Button>
        ) : (
          <>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hledat firmu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny stavy</SelectItem>
                <SelectItem value="not_started">Nezahájené</SelectItem>
                <SelectItem value="in_progress">Rozpracované</SelectItem>
                <SelectItem value="completed">Hotové</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Summary cards */}
      {initialized && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Celkem firem</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-gray-500 dark:text-gray-400">{summary.notStarted}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nezahájeno</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.inProgress}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rozpracováno</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.completed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hotovo</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Not initialized state */}
      {!initialized && (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Roční uzávěrky pro {selectedYear}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Klikněte na tlačítko výše pro vytvoření checklistů roční uzávěrky pro všechny aktivní klienty.
              Každý klient dostane standardní checklist s 12 kroky.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Company list */}
      {initialized && (
        <div className="space-y-2">
          {filteredClosings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Žádné firmy odpovídající hledání' : 'Žádné firmy v tomto stavu'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredClosings.map((checklist) => {
              const progress = getAnnualClosingProgress(checklist)
              const statusInfo = getCompanyStatusLabel(progress.percentage)
              const isExpanded = expandedCompany === checklist.company_id

              return (
                <Card key={checklist.company_id} className="overflow-hidden">
                  {/* Company header row */}
                  <button
                    onClick={() => setExpandedCompany(isExpanded ? null : checklist.company_id)}
                    className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-white flex-1 truncate">
                      {checklist.company_name}
                    </span>

                    {/* Progress bar */}
                    <div className="w-32 flex-shrink-0">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getProgressColor(progress.percentage)}`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>

                    <span className="text-sm text-gray-500 dark:text-gray-400 w-16 text-right flex-shrink-0">
                      {progress.completed}/{progress.total}
                    </span>

                    <Badge className={`${statusInfo.color} flex-shrink-0`}>
                      {statusInfo.label}
                    </Badge>

                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    }
                  </button>

                  {/* Expanded checklist */}
                  {isExpanded && (
                    <div className="border-t dark:border-gray-700 px-4 py-3 bg-gray-50/50 dark:bg-gray-800/30">
                      <div className="space-y-1">
                        {checklist.steps.map((step) => (
                          <div
                            key={step.id}
                            className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-white dark:hover:bg-gray-800 transition-colors group"
                          >
                            <button
                              onClick={() => cycleStepStatus(checklist.company_id, step.id, step.status)}
                              className="flex-shrink-0 hover:scale-110 transition-transform"
                              title="Klikněte pro změnu stavu"
                            >
                              <StepStatusIcon status={step.status} />
                            </button>

                            <div className="flex-1 min-w-0">
                              <span className={`text-sm font-medium ${
                                step.status === 'completed'
                                  ? 'text-gray-400 dark:text-gray-500 line-through'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {step.title}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 hidden group-hover:inline">
                                {step.description}
                              </span>
                            </div>

                            {step.completed_by && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                                {step.completed_by}
                              </span>
                            )}

                            {step.notes && (
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                <FileText className="h-3 w-3 mr-1" />
                                Poznámka
                              </Badge>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 flex-shrink-0 h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedChecklist(checklist)
                                setEditingNotes({ [step.id]: step.notes || '' })
                                setModalOpen(true)
                              }}
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Notes modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Poznámky ke kroku
            </DialogTitle>
          </DialogHeader>
          {selectedChecklist && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedChecklist.company_name} - {selectedYear}
              </p>
              {selectedChecklist.steps.map((step) => {
                if (editingNotes[step.id] === undefined) return null
                return (
                  <div key={step.id}>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      {step.title}
                    </p>
                    <Textarea
                      value={editingNotes[step.id] || ''}
                      onChange={(e) => setEditingNotes({ ...editingNotes, [step.id]: e.target.value })}
                      placeholder="Poznámka k tomuto kroku..."
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          handleSaveNotes(selectedChecklist.company_id, step.id)
                          setModalOpen(false)
                        }}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Uložit
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
