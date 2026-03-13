'use client'

import { useState, useMemo } from 'react'
import { Save, Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { calculateEmployeeTax, DEFAULT_TAX_RATES, type TaxRates, type EmployeeTaxConfig } from '@/lib/tax-calculator'
import type { EmployeeTaxReturnRow } from '@/lib/types/tax'

function CZK(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ') + ' Kč'
}

type Props = {
  companyId: string
  employeeId: string
  employeeName: string
  year: number
  data: Partial<EmployeeTaxReturnRow>
  rates: TaxRates | null
  onSaved: (data: EmployeeTaxReturnRow) => void
}

export function EmployeeTaxDetail({ companyId, employeeId, employeeName, year, data, rates: ratesProp, onSaved }: Props) {
  const rates = ratesProp || DEFAULT_TAX_RATES
  const [local, setLocal] = useState<Partial<EmployeeTaxReturnRow>>(data)
  const [saving, setSaving] = useState(false)

  function updateField(field: string, value: any) {
    setLocal(prev => ({ ...prev, [field]: value }))
  }

  const taxConfig: EmployeeTaxConfig = {
    gross_income: local.gross_income || 0,
    mortgage_interest: local.mortgage_interest || 0,
    dip_contributions: local.dip_contributions || 0,
    savings_contributions: local.savings_contributions || 0,
    life_insurance: local.life_insurance || 0,
    other_deductions: local.other_deductions || 0,
    taxpayer_discount: local.taxpayer_discount ?? true,
    children_count: local.children_count || 0,
    children_details: local.children_details || [],
    disability_credit: local.disability_credit || 0,
    student: local.student ?? false,
    other_credits: local.other_credits || 0,
    tax_advances_paid: local.tax_advances_paid || 0,
  }

  const calc = useMemo(() => calculateEmployeeTax(taxConfig, rates), [taxConfig, rates])

  function addChild() {
    const details = [...(local.children_details || [])]
    details.push({ order: details.length + 1, ztpp: false })
    setLocal(prev => ({ ...prev, children_details: details, children_count: details.length }))
  }

  function removeChild(index: number) {
    const details = [...(local.children_details || [])]
    details.splice(index, 1)
    details.forEach((d, i) => { d.order = i + 1 })
    setLocal(prev => ({ ...prev, children_details: details, children_count: details.length }))
  }

  function toggleChildZtpp(index: number) {
    const details = [...(local.children_details || [])]
    details[index] = { ...details[index], ztpp: !details[index].ztpp }
    setLocal(prev => ({ ...prev, children_details: details }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/employee-tax-returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          employee_id: employeeId,
          year,
          ...local,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const saved = await res.json()
      onSaved(saved)
      toast.success(`${employeeName} — uloženo`)
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{employeeName} — {year}</h4>
        <div className="flex items-center gap-2">
          <select
            value={local.status || 'not_started'}
            onChange={e => updateField('status', e.target.value)}
            className="h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="not_started">Nezačato</option>
            <option value="in_progress">Rozpracováno</option>
            <option value="completed">Hotovo</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-8 px-3 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Uložit
          </button>
        </div>
      </div>

      {/* Hrubý příjem */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">Hrubý příjem (roční)</label>
        <input
          type="number"
          value={local.gross_income || ''}
          onChange={e => updateField('gross_income', parseFloat(e.target.value) || 0)}
          className="h-9 w-full max-w-xs px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
          placeholder="0"
        />
      </div>

      {/* Odpočty */}
      <div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Odpočty</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { key: 'mortgage_interest', label: 'Hypotéka' },
            { key: 'dip_contributions', label: 'DIP' },
            { key: 'savings_contributions', label: 'Spoření' },
            { key: 'life_insurance', label: 'Živ. pojištění' },
            { key: 'other_deductions', label: 'Ostatní' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
              <input
                type="number"
                value={(local as any)[f.key] || ''}
                onChange={e => updateField(f.key, parseFloat(e.target.value) || 0)}
                className="h-8 w-full px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-right"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Slevy */}
      <div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Slevy</div>
        <div className="flex flex-wrap gap-4 items-start">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={local.taxpayer_discount ?? true} onChange={e => updateField('taxpayer_discount', e.target.checked)} className="rounded border-gray-300" />
            Poplatník
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={local.student ?? false} onChange={e => updateField('student', e.target.checked)} className="rounded border-gray-300" />
            Student
          </label>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Invalidita</label>
            <select
              value={local.disability_credit || 0}
              onChange={e => updateField('disability_credit', parseInt(e.target.value))}
              className="h-8 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option value={0}>Žádná</option>
              <option value={1}>1. stupeň ({CZK(rates.disability_credit_1)})</option>
              <option value={2}>2. stupeň ({CZK(rates.disability_credit_2)})</option>
              <option value={3}>3. stupeň ({CZK(rates.disability_credit_3)})</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Ostatní slevy</label>
            <input type="number" value={local.other_credits || ''} onChange={e => updateField('other_credits', parseFloat(e.target.value) || 0)}
              className="h-8 w-24 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-right" placeholder="0" />
          </div>
        </div>
        {/* Children */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Děti:</span>
            <button onClick={addChild} className="h-6 px-2 text-xs text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded flex items-center gap-1 transition-colors">
              <Plus className="h-3 w-3" /> Přidat
            </button>
          </div>
          {(local.children_details || []).map((child, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-14">{child.order}. dítě</span>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={child.ztpp} onChange={() => toggleChildZtpp(i)} className="rounded border-gray-300" />
                <span className="text-xs">ZTP/P</span>
              </label>
              <button onClick={() => removeChild(i)} className="p-0.5 text-gray-400 hover:text-red-500"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Zálohy */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">Zálohy na dani (sražené)</label>
        <input
          type="number"
          value={local.tax_advances_paid || ''}
          onChange={e => updateField('tax_advances_paid', parseFloat(e.target.value) || 0)}
          className="h-9 w-full max-w-xs px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
          placeholder="0"
        />
      </div>

      {/* Výpočet */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase">Výpočet</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-400">Základ</div>
            <div className="font-medium">{CZK(calc.grossIncome)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Odpočty</div>
            <div className="font-medium">-{CZK(calc.totalDeductions)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Upravený základ</div>
            <div className="font-medium">{CZK(calc.roundedBase)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Hrubá daň</div>
            <div className="font-medium">{CZK(calc.grossTax)}</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 pt-1">
          Daň 15%: {CZK(calc.taxRate1Amount)} | 23%: {CZK(calc.taxRate2Amount)} | Slevy: -{CZK(calc.totalCredits)}
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
          <div>
            <div className="text-xs text-gray-400">Čistá daň</div>
            <div className="font-semibold">{CZK(calc.netTax)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Zálohy</div>
            <div className="font-medium">-{CZK(calc.taxAdvancesPaid)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">{calc.taxDue > 0 ? 'Nedoplatek' : 'Přeplatek'}</div>
            <div className={`font-bold text-lg ${calc.taxDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {calc.taxDue > 0 ? '+' : ''}{CZK(calc.taxDue)}
            </div>
          </div>
        </div>
      </div>

      {/* Poznámka */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">Poznámka</label>
        <textarea
          rows={2}
          value={local.notes || ''}
          onChange={e => updateField('notes', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
          placeholder="Poznámka..."
        />
      </div>
    </div>
  )
}
