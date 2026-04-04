'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, ChevronDown, ChevronRight, Check, Clock, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_TAX_RATES, calculateDppo, type TaxRates } from '@/lib/tax-calculator'
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
  const [showAdjustments, setShowAdjustments] = useState(false)
  const [showDeductions, setShowDeductions] = useState(false)
  const [showCredits, setShowCredits] = useState(false)

  const revenue = localConfig.annual_revenue ?? yearTotals.revenue
  const expenses = localConfig.annual_expenses ?? yearTotals.expenses

  const dppo = calculateDppo({
    revenue,
    expenses,
    add_back: localConfig.dppo_add_back ?? 0,
    deductible: localConfig.dppo_deductible ?? 0,
    loss_deduction: localConfig.dppo_loss_deduction ?? 0,
    donations: localConfig.dppo_donations ?? 0,
    rd_deduction: localConfig.dppo_rd_deduction ?? 0,
    ztpp_employees: localConfig.dppo_ztpp_employees ?? 0,
    advances_paid: localConfig.dppo_advances_paid ?? 0,
  }, rates)

  // Auto-open sections with non-zero values
  useEffect(() => {
    if ((localConfig.dppo_add_back ?? 0) > 0 || (localConfig.dppo_deductible ?? 0) > 0) setShowAdjustments(true)
    if ((localConfig.dppo_loss_deduction ?? 0) > 0 || (localConfig.dppo_donations ?? 0) > 0 || (localConfig.dppo_rd_deduction ?? 0) > 0) setShowDeductions(true)
    if ((localConfig.dppo_ztpp_employees ?? 0) > 0) setShowCredits(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Daň z příjmů PO (DPPO)</div>

        {/* Příjmy a výdaje */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Příjmy a výdaje</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Příjmy</label>
              <input
                type="number"
                value={revenue || ''}
                onChange={e => updateField('annual_revenue', parseFloat(e.target.value) || 0)}
                className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Výdaje</label>
              <input
                type="number"
                value={expenses || ''}
                onChange={e => updateField('annual_expenses', parseFloat(e.target.value) || 0)}
                className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Účetní VH: <span className="font-semibold">{CZK(dppo.accountingProfit)}</span>
          </div>
        </div>

        {/* Úpravy ZD — collapsible */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
          <button
            onClick={() => setShowAdjustments(!showAdjustments)}
            className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white w-full"
          >
            {showAdjustments ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Úpravy základu daně (§23-§25)
            {!showAdjustments && (dppo.addBack > 0 || dppo.deductible > 0) && (
              <span className="text-[10px] text-gray-400 ml-auto">+{CZK(dppo.addBack)} / -{CZK(dppo.deductible)}</span>
            )}
          </button>
          {showAdjustments && (
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Připočitatelné (nedaňové náklady)</label>
                  <input
                    type="number"
                    value={(localConfig.dppo_add_back ?? 0) || ''}
                    onChange={e => updateField('dppo_add_back', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Odčitatelné (osvobozené výnosy)</label>
                  <input
                    type="number"
                    value={(localConfig.dppo_deductible ?? 0) || ''}
                    onChange={e => updateField('dppo_deductible', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Upravený ZD: <span className="font-semibold">{CZK(dppo.adjustedBase)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Odpočty — collapsible */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
          <button
            onClick={() => setShowDeductions(!showDeductions)}
            className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white w-full"
          >
            {showDeductions ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Odpočty (§34, §20)
            {!showDeductions && dppo.totalDeductions > 0 && (
              <span className="text-[10px] text-gray-400 ml-auto">-{CZK(dppo.totalDeductions)}</span>
            )}
          </button>
          {showDeductions && (
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ztráta z min. let</label>
                  <input
                    type="number"
                    value={(localConfig.dppo_loss_deduction ?? 0) || ''}
                    onChange={e => updateField('dppo_loss_deduction', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
                  />
                  <span className="text-[10px] text-gray-400">max {CZK(Math.max(0, dppo.adjustedBase))}</span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Dary (§20/8)</label>
                  <input
                    type="number"
                    value={(localConfig.dppo_donations ?? 0) || ''}
                    onChange={e => updateField('dppo_donations', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
                  />
                  <span className="text-[10px] text-gray-400">min 2 000, max 10% = {CZK(dppo.donationsLimit)}</span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Výzkum a vývoj</label>
                  <input
                    type="number"
                    value={(localConfig.dppo_rd_deduction ?? 0) || ''}
                    onChange={e => updateField('dppo_rd_deduction', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                ZD po odpočtech: <span className="font-semibold">{CZK(dppo.baseAfterDeductions)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Výpočet daně */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-1">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Výpočet daně</div>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div>Zaokrouhlený ZD: <span className="font-semibold">{CZK(dppo.roundedBase)}</span></div>
            <div>Sazba: <span className="font-semibold">{Math.round(dppo.taxRate * 100)} %</span></div>
            <div>Hrubá daň: <span className="font-semibold">{CZK(dppo.grossTax)}</span></div>
          </div>
        </div>

        {/* Slevy — collapsible */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
          <button
            onClick={() => setShowCredits(!showCredits)}
            className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white w-full"
          >
            {showCredits ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Slevy na dani (§35)
            {!showCredits && dppo.ztppCredit > 0 && (
              <span className="text-[10px] text-gray-400 ml-auto">-{CZK(dppo.ztppCredit)}</span>
            )}
          </button>
          {showCredits && (
            <div className="mt-2 space-y-2">
              <div className="max-w-xs">
                <label className="text-xs text-gray-500 block mb-1">Počet ZTP zaměstnanců</label>
                <input
                  type="number"
                  min={0}
                  value={(localConfig.dppo_ztpp_employees ?? 0) || ''}
                  onChange={e => updateField('dppo_ztpp_employees', parseInt(e.target.value) || 0)}
                  className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
                />
                <span className="text-[10px] text-gray-400">{(localConfig.dppo_ztpp_employees ?? 0)} x 18 000 = {CZK(dppo.ztppCredit)}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Daň po slevách: <span className="font-semibold">{CZK(dppo.netTax)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Zálohy a doplatek */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-3">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Zálohy a doplatek</div>
          <div className="max-w-xs">
            <label className="text-xs text-gray-500 block mb-1">Zaplacené zálohy na DPPO</label>
            <input
              type="number"
              value={(localConfig.dppo_advances_paid ?? 0) || ''}
              onChange={e => updateField('dppo_advances_paid', parseFloat(e.target.value) || 0)}
              className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
            />
          </div>
          <div className={`p-3 rounded-lg text-center font-bold text-lg ${dppo.taxDue > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : dppo.taxDue < 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {dppo.taxDue > 0 ? `Doplatek: ${CZK(dppo.taxDue)}` : dppo.taxDue < 0 ? `Přeplatek: ${CZK(Math.abs(dppo.taxDue))}` : 'Vyrovnáno'}
          </div>
        </div>

        {/* Poznámka */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
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
