'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Save,
  FileText,
  CreditCard,
  Receipt,
} from 'lucide-react'
import { toast } from 'sonner'
import { addActivity } from '@/lib/activity-store'

type ClosureData = {
  id: string
  company_id: string
  period: string
  status: string
  bank_statement_status: string
  expense_documents_status: string
  income_invoices_status: string
  notes: string | null
  updated_by: string | null
  updated_at: string
}

type ClosureDetailModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  closure: ClosureData | null
  companyName: string
  onSave: (updated: ClosureData) => void
}

const STATUS_OPTIONS = [
  { value: 'missing', label: 'Chybí', icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  { value: 'uploaded', label: 'Nahráno', icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { value: 'approved', label: 'Schváleno', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
]

const DOC_TYPES = [
  { key: 'bank_statement_status' as const, label: 'Bankovní výpisy', icon: CreditCard },
  { key: 'expense_documents_status' as const, label: 'Nákladové doklady', icon: Receipt },
  { key: 'income_invoices_status' as const, label: 'Příjmové faktury', icon: FileText },
]

function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  const months = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen',
    'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']
  return `${months[parseInt(month) - 1]} ${year}`
}

export function ClosureDetailModal({ open, onOpenChange, closure, companyName, onSave }: ClosureDetailModalProps) {
  const [bankStatus, setBankStatus] = useState('missing')
  const [expenseStatus, setExpenseStatus] = useState('missing')
  const [incomeStatus, setIncomeStatus] = useState('missing')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (closure) {
      setBankStatus(closure.bank_statement_status)
      setExpenseStatus(closure.expense_documents_status)
      setIncomeStatus(closure.income_invoices_status)
      setNotes(closure.notes || '')
    }
  }, [closure])

  if (!closure) return null

  const statusSetters: Record<string, (v: string) => void> = {
    bank_statement_status: setBankStatus,
    expense_documents_status: setExpenseStatus,
    income_invoices_status: setIncomeStatus,
  }

  const statusValues: Record<string, string> = {
    bank_statement_status: bankStatus,
    expense_documents_status: expenseStatus,
    income_invoices_status: incomeStatus,
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 300))

    const allApproved = bankStatus === 'approved' && expenseStatus === 'approved' && incomeStatus === 'approved'
    const anyMissing = bankStatus === 'missing' || expenseStatus === 'missing' || incomeStatus === 'missing'

    const updated: ClosureData = {
      ...closure,
      bank_statement_status: bankStatus,
      expense_documents_status: expenseStatus,
      income_invoices_status: incomeStatus,
      status: allApproved ? 'closed' : anyMissing ? 'open' : 'pending_review',
      notes: notes || null,
      updated_by: 'Jana Svobodová',
      updated_at: new Date().toISOString(),
    }

    onSave(updated)

    // Record activity
    const changes: string[] = []
    if (bankStatus !== closure.bank_statement_status) changes.push(`výpisy: ${bankStatus}`)
    if (expenseStatus !== closure.expense_documents_status) changes.push(`náklady: ${expenseStatus}`)
    if (incomeStatus !== closure.income_invoices_status) changes.push(`příjmy: ${incomeStatus}`)

    if (changes.length > 0) {
      addActivity({
        type: 'closure_status_changed',
        company_id: closure.company_id,
        company_name: companyName,
        title: `Uzávěrka ${formatPeriod(closure.period)} změněna`,
        description: changes.join(', '),
        created_by: 'Jana Svobodová',
      })
    }

    setSaving(false)
    toast.success(`Uzávěrka ${formatPeriod(closure.period)} aktualizována`)
    onOpenChange(false)
  }

  const hasChanges =
    bankStatus !== closure.bank_statement_status ||
    expenseStatus !== closure.expense_documents_status ||
    incomeStatus !== closure.income_invoices_status ||
    (notes || '') !== (closure.notes || '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            {companyName}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {formatPeriod(closure.period)}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {DOC_TYPES.map((docType) => {
            const currentStatus = statusValues[docType.key]
            const statusConfig = STATUS_OPTIONS.find(s => s.value === currentStatus)
            const Icon = docType.icon

            return (
              <div key={docType.key} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{docType.label}</span>
                </div>
                <Select
                  value={currentStatus}
                  onValueChange={(value) => statusSetters[docType.key](value)}
                >
                  <SelectTrigger className={`w-40 ${statusConfig?.bg || ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => {
                      const StatusIcon = opt.icon
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className={`flex items-center gap-1.5 ${opt.color}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )
          })}

          <div className="pt-2 border-t dark:border-gray-700">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">
              Poznámka k měsíci
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Např. Čekám na fakturu od dodavatele X..."
              rows={3}
              className="resize-none"
            />
          </div>

          {closure.updated_by && (
            <div className="text-xs text-gray-400 dark:text-gray-400 pt-1">
              Naposledy upravil/a: {closure.updated_by} ({new Date(closure.updated_at).toLocaleString('cs-CZ')})
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Zrušit
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            size="sm"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? 'Ukládám...' : 'Uložit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
