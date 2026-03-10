'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Save, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import type { TaxPeriodData } from '@/lib/types/tax'

const MONTHS = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen',
  'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']

function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  return `${MONTHS[parseInt(month) - 1]} ${year}`
}

type TaxEditModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName: string
  period: string
  data: TaxPeriodData | null
  onSave: (updated: TaxPeriodData) => void
}

export function TaxEditModal({ open, onOpenChange, companyId, companyName, period, data, onSave }: TaxEditModalProps) {
  const [revenue, setRevenue] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [vatOutput, setVatOutput] = useState(0)
  const [vatInput, setVatInput] = useState(0)
  const [vatOverride, setVatOverride] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) {
      setRevenue(data.revenue)
      setExpenses(data.expenses)
      setVatOutput(data.vat_output)
      setVatInput(data.vat_input)
      setVatOverride(data.vat_result !== null ? String(data.vat_result) : '')
      setNotes(data.notes || '')
    } else {
      setRevenue(0)
      setExpenses(0)
      setVatOutput(0)
      setVatInput(0)
      setVatOverride('')
      setNotes('')
    }
  }, [data, open])

  const autoVatResult = vatOutput - vatInput
  const effectiveVatResult = vatOverride !== '' ? parseFloat(vatOverride) || 0 : autoVatResult
  const taxBase = revenue - expenses

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/tax-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          period,
          revenue,
          expenses,
          vat_output: vatOutput,
          vat_input: vatInput,
          vat_result: vatOverride !== '' ? parseFloat(vatOverride) || 0 : null,
          notes: notes || null,
        }),
      })

      if (!res.ok) throw new Error('Save failed')

      const saved = await res.json()
      onSave(saved)
      toast.success(`Daňová data ${formatPeriod(period)} uložena`)
      onOpenChange(false)
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = useMemo(() => {
    if (!data) return revenue !== 0 || expenses !== 0 || vatOutput !== 0 || vatInput !== 0 || notes !== ''
    return (
      revenue !== data.revenue ||
      expenses !== data.expenses ||
      vatOutput !== data.vat_output ||
      vatInput !== data.vat_input ||
      (vatOverride !== '' ? parseFloat(vatOverride) : null) !== data.vat_result ||
      (notes || '') !== (data.notes || '')
    )
  }, [data, revenue, expenses, vatOutput, vatInput, vatOverride, notes])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-600" />
            {companyName}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {formatPeriod(period)}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Příjmy (Kč)</label>
              <Input
                type="number"
                value={revenue || ''}
                onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Výdaje (Kč)</label>
              <Input
                type="number"
                value={expenses || ''}
                onChange={(e) => setExpenses(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Základ daně</div>
            <div className={`text-lg font-bold ${taxBase >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {taxBase.toLocaleString('cs-CZ')} Kč
            </div>
          </div>

          <div className="border-t dark:border-gray-700 pt-3">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">DPH</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">DPH výstup (Kč)</label>
                <Input
                  type="number"
                  value={vatOutput || ''}
                  onChange={(e) => setVatOutput(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">DPH vstup (Kč)</label>
                <Input
                  type="number"
                  value={vatInput || ''}
                  onChange={(e) => setVatInput(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">DPH výsledek</span>
              {vatOverride === '' && (
                <span className="text-[10px] text-gray-400">auto: výstup − vstup</span>
              )}
            </div>
            <div className={`text-lg font-bold ${effectiveVatResult > 0 ? 'text-red-600 dark:text-red-400' : effectiveVatResult < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
              {effectiveVatResult > 0 ? '+' : ''}{effectiveVatResult.toLocaleString('cs-CZ')} Kč
              <span className="text-xs font-normal ml-1 text-gray-400">
                {effectiveVatResult > 0 ? '(odvod)' : effectiveVatResult < 0 ? '(nadměrný odpočet)' : ''}
              </span>
            </div>
            <div className="mt-2">
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Override (prázdné = auto)</label>
              <Input
                type="number"
                value={vatOverride}
                onChange={(e) => setVatOverride(e.target.value)}
                placeholder={`Auto: ${autoVatResult.toLocaleString('cs-CZ')}`}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="pt-2 border-t dark:border-gray-700">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">
              Poznámka
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Poznámka k období..."
              rows={2}
              className="resize-none"
            />
          </div>
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
