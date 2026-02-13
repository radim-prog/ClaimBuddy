'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
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
  CheckCircle,
  Circle,
  Loader2,
  MinusCircle,
  FileText,
  Save,
  Play,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createAnnualClosing,
  getAnnualClosingForCompany,
  getAnnualClosingProgress,
  updateAnnualClosingStep,
  type AnnualClosingChecklist,
  type AnnualClosingStepStatus,
} from '@/lib/types/annual-closing'

type AnnualClosingSectionProps = {
  companyId: string
  companyName: string
}

export function AnnualClosingSection({ companyId, companyName }: AnnualClosingSectionProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [checklist, setChecklist] = useState<AnnualClosingChecklist | null>(() =>
    getAnnualClosingForCompany(companyId, currentYear) || null
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<{ id: string; notes: string } | null>(null)

  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

  const handleInit = () => {
    const result = createAnnualClosing(companyId, companyName, selectedYear)
    setChecklist({ ...result })
    toast.success(`Roční uzávěrka ${selectedYear} vytvořena`)
  }

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    const existing = getAnnualClosingForCompany(companyId, year)
    setChecklist(existing ? { ...existing } : null)
  }

  const cycleStatus = (stepId: string, current: AnnualClosingStepStatus) => {
    const next: Record<AnnualClosingStepStatus, AnnualClosingStepStatus> = {
      'not_started': 'in_progress',
      'in_progress': 'completed',
      'completed': 'not_started',
      'not_applicable': 'not_started',
    }
    const updated = updateAnnualClosingStep(companyId, selectedYear, stepId, {
      status: next[current],
      completed_by: next[current] === 'completed' ? 'Účetní' : undefined,
      completed_at: next[current] === 'completed' ? new Date().toISOString() : undefined,
    })
    if (updated) setChecklist({ ...updated })
  }

  const handleSaveNotes = () => {
    if (!editingStep) return
    const updated = updateAnnualClosingStep(companyId, selectedYear, editingStep.id, {
      notes: editingStep.notes,
    })
    if (updated) setChecklist({ ...updated })
    setModalOpen(false)
    setEditingStep(null)
    toast.success('Poznámka uložena')
  }

  const progress = checklist ? getAnnualClosingProgress(checklist) : null

  const StatusIcon = ({ status }: { status: AnnualClosingStepStatus }) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'in_progress': return <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      case 'not_applicable': return <MinusCircle className="h-5 w-5 text-gray-400" />
      default: return <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
    }
  }

  return (
    <div>
      {/* Year selector + init */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={String(selectedYear)} onValueChange={v => handleYearChange(Number(v))}>
          <SelectTrigger className="w-28 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!checklist && (
          <Button size="sm" variant="outline" onClick={handleInit} className="h-8">
            <Play className="h-3.5 w-3.5 mr-1" />
            Inicializovat
          </Button>
        )}

        {progress && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  progress.percentage === 100 ? 'bg-green-500' :
                  progress.percentage > 50 ? 'bg-blue-500' :
                  progress.percentage > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                }`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {progress.completed}/{progress.total}
            </span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!checklist && (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          Klikněte na Inicializovat pro vytvoření checklistu roční uzávěrky.
        </p>
      )}

      {/* Steps */}
      {checklist && (
        <div className="space-y-0.5">
          {checklist.steps.map(step => (
            <div
              key={step.id}
              className="flex items-center gap-3 py-2 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
              <button
                onClick={() => cycleStatus(step.id, step.status)}
                className="flex-shrink-0 hover:scale-110 transition-transform"
                title="Klikněte pro změnu stavu"
              >
                <StatusIcon status={step.status} />
              </button>

              <div className="flex-1 min-w-0">
                <span className={`text-sm ${
                  step.status === 'completed'
                    ? 'text-gray-400 dark:text-gray-500 line-through'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {step.title}
                </span>
                <span className="text-xs text-gray-400 ml-2 hidden group-hover:inline">
                  {step.description}
                </span>
              </div>

              {step.completed_by && (
                <span className="text-xs text-gray-400 flex-shrink-0">{step.completed_by}</span>
              )}

              {step.notes && (
                <Badge variant="outline" className="text-xs flex-shrink-0 h-5">
                  <FileText className="h-3 w-3 mr-0.5" />
                  Pozn.
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 h-6 w-6 p-0"
                onClick={() => {
                  setEditingStep({ id: step.id, notes: step.notes || '' })
                  setModalOpen(true)
                }}
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Notes modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-purple-600" />
              Poznámka
            </DialogTitle>
          </DialogHeader>
          {editingStep && (
            <div className="space-y-3">
              <Textarea
                value={editingStep.notes}
                onChange={e => setEditingStep({ ...editingStep, notes: e.target.value })}
                placeholder="Poznámka ke kroku..."
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveNotes}>
                  <Save className="h-4 w-4 mr-1" />
                  Uložit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
