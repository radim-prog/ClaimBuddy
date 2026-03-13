'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, ChevronDown, ChevronRight, Check, Clock, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_TAX_RATES, type TaxRates } from '@/lib/tax-calculator'
import type { TaxAnnualConfigRow, EmployeeTaxReturnRow } from '@/lib/types/tax'
import type { Employee } from '@/lib/types/employee'
import { EmployeeTaxDetail } from './employee-tax-detail'

function CZK(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ') + ' Kč'
}

type Props = {
  companyId: string
  company: { name: string; legal_form: string; has_employees: boolean }
  year: number
  config: Partial<TaxAnnualConfigRow>
  yearTotals: { revenue: number; expenses: number }
  rates: TaxRates | null
  employees: Employee[]
  onConfigUpdate: (c: Partial<TaxAnnualConfigRow>) => void
}

export function SroTaxWorkspace({ companyId, company, year, config, yearTotals, rates: ratesProp, employees, onConfigUpdate }: Props) {
  const rates = ratesProp || DEFAULT_TAX_RATES
  const [localConfig, setLocalConfig] = useState<Partial<TaxAnnualConfigRow>>(config)
  const [saving, setSaving] = useState(false)
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [employeeReturns, setEmployeeReturns] = useState<Record<string, Partial<EmployeeTaxReturnRow>>>({})
  const [returnsLoaded, setReturnsLoaded] = useState(false)

  const dppoRate = rates.dppo_rate ?? 0.21
  const revenue = localConfig.annual_revenue ?? yearTotals.revenue
  const expenses = localConfig.annual_expenses ?? yearTotals.expenses
  const taxBase = revenue - expenses
  const dppoTax = Math.round(Math.max(0, taxBase) * dppoRate)

  // Load employee tax returns
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/accountant/employee-tax-returns?company_id=${companyId}&year=${year}`)
        if (res.ok) {
          const data = await res.json()
          const map: Record<string, Partial<EmployeeTaxReturnRow>> = {}
          for (const r of data.returns || []) {
            map[r.employee_id] = r
          }
          setEmployeeReturns(map)
        }
      } catch {
        // ignore
      } finally {
        setReturnsLoaded(true)
      }
    }
    load()
  }, [companyId, year])

  function updateField(field: string, value: any) {
    setLocalConfig(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/tax-annual', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          year,
          ...localConfig,
          annual_revenue: revenue,
          annual_expenses: expenses,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      onConfigUpdate(data)
      toast.success('Uloženo')
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  function handleEmployeeSaved(saved: EmployeeTaxReturnRow) {
    setEmployeeReturns(prev => ({ ...prev, [saved.employee_id]: saved }))
  }

  const activeEmployees = employees.filter(e => e.active)

  const statusIcon = (status: string | undefined) => {
    if (status === 'completed') return <Check className="h-3.5 w-3.5 text-green-500" />
    if (status === 'in_progress') return <Clock className="h-3.5 w-3.5 text-amber-500" />
    return <Minus className="h-3.5 w-3.5 text-gray-300" />
  }

  const statusLabel = (status: string | undefined) => {
    if (status === 'completed') return 'Hotovo'
    if (status === 'in_progress') return 'Rozprac.'
    return 'Nezačato'
  }

  const contractLabel = (type: string) => {
    if (type === 'hpp') return 'HPP'
    if (type === 'dpp') return 'DPP'
    if (type === 'dpc') return 'DPČ'
    return type
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-5 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-soft-sm"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Uložit
        </button>
      </div>

      {/* DPPO */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Daň z příjmů PO (DPPO)</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Příjmy</label>
            <input
              type="number"
              value={(localConfig.annual_revenue ?? yearTotals.revenue) || ''}
              onChange={e => updateField('annual_revenue', parseFloat(e.target.value) || 0)}
              className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Výdaje</label>
            <input
              type="number"
              value={(localConfig.annual_expenses ?? yearTotals.expenses) || ''}
              onChange={e => updateField('annual_expenses', parseFloat(e.target.value) || 0)}
              className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Základ (sazba {(dppoRate * 100).toFixed(0)}%)</label>
            <div className="h-9 flex items-center text-sm font-semibold">{CZK(taxBase)}</div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Daň</label>
            <div className={`h-9 flex items-center text-sm font-bold ${dppoTax > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
              {CZK(dppoTax)}
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Poznámka</label>
          <textarea
            rows={2}
            value={localConfig.notes || ''}
            onChange={e => updateField('notes', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
            placeholder="Poznámka k DPPO..."
          />
        </div>
      </div>

      {/* ROČNÍ ZÚČTOVÁNÍ ZAMĚSTNANCŮ */}
      {company.has_employees && activeEmployees.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Roční zúčtování zaměstnanců ({activeEmployees.length})
          </div>

          {!returnsLoaded ? (
            <div className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          ) : (
            <div className="space-y-2">
              {activeEmployees.map(emp => {
                const ret = employeeReturns[emp.id] || {}
                const isExpanded = expandedEmployee === emp.id
                return (
                  <div key={emp.id} className="space-y-0">
                    <button
                      onClick={() => setExpandedEmployee(isExpanded ? null : emp.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
                      <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                        {emp.first_name} {emp.last_name}
                      </span>
                      <span className="text-xs text-gray-500 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                        {contractLabel(emp.contract_type)}
                      </span>
                      {emp.tax_declaration && (
                        <span className="text-xs text-green-600 dark:text-green-400">Prohlášení ✓</span>
                      )}
                      <div className="flex items-center gap-1.5 min-w-[80px]">
                        {statusIcon(ret.status)}
                        <span className="text-xs text-gray-500">{statusLabel(ret.status)}</span>
                      </div>
                      {ret.status === 'completed' && ret.tax_advances_paid !== undefined && (ret.gross_income || 0) > 0 && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {/* Quick calculation for display */}
                        </span>
                      )}
                    </button>
                    {isExpanded && (
                      <EmployeeTaxDetail
                        companyId={companyId}
                        employeeId={emp.id}
                        employeeName={`${emp.first_name} ${emp.last_name}`}
                        year={year}
                        data={ret}
                        rates={rates}
                        onSaved={handleEmployeeSaved}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
