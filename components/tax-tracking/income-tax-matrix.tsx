'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronDown, Save, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { calculateIncomeTax, DEFAULT_TAX_RATES, type TaxRates, type TaxAnnualConfig, type IncomeTaxCalculation } from '@/lib/tax-calculator'
import type { TaxCompany, TaxAnnualConfigRow } from '@/lib/types/tax'

const currentYear = new Date().getFullYear()

type GroupInfo = {
  group_name: string
  billing_company_id: string | null
}

type BillingUnit = {
  type: 'group' | 'standalone'
  sortKey: string
  groupName: string | null
  companies: TaxCompany[]
}

function formatCZK(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ')
}

function CZK(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ') + ' Kč'
}

type ExpandedDetailProps = {
  config: Partial<TaxAnnualConfigRow>
  rates: TaxRates
  calc: IncomeTaxCalculation | null
  onConfigChange: (field: string, value: any) => void
  onSave: () => Promise<void>
  saving: boolean
  isFO: boolean
}

function InsuranceBreakdown({
  label,
  base,
  calculated,
  rateLabel,
  advancesPaid,
  onAdvancesChange,
  due,
}: {
  label: string
  base: number
  calculated: number
  rateLabel: string
  advancesPaid: number
  onAdvancesChange: (v: number) => void
  due: number
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800/50">
      <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{label}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Vym. zaklad</div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{CZK(base)}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Pojistne ({rateLabel})</div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{CZK(calculated)}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Zaplacene zalohy</div>
          <input
            type="number"
            value={advancesPaid || ''}
            onChange={e => onAdvancesChange(parseFloat(e.target.value) || 0)}
            className="h-8 w-full px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
            placeholder="0"
          />
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Doplatek/preplatek</div>
          <div className={`text-sm font-bold ${
            due > 0 ? 'text-red-600 dark:text-red-400' : due < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
          }`}>
            {due > 0 ? '+' : ''}{CZK(due)}
          </div>
        </div>
      </div>
    </div>
  )
}

function ExpandedDetail({ config, rates, calc, onConfigChange, onSave, saving, isFO }: ExpandedDetailProps) {
  if (!isFO) {
    return (
      <tr>
        <td colSpan={9} className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Poznamka</label>
              <input
                type="text"
                value={config.notes || ''}
                onChange={e => onConfigChange('notes', e.target.value)}
                className="h-8 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 w-64"
                placeholder="Poznamka..."
              />
            </div>
            <button
              onClick={onSave}
              disabled={saving}
              className="h-8 px-4 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Ulozit
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td colSpan={9} className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80">
        <div className="max-w-3xl space-y-3">
          {/* Odpocty */}
          <div>
            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Odpocty</div>
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Hypoteka</label>
                <input
                  type="number"
                  value={config.mortgage_interest || ''}
                  onChange={e => onConfigChange('mortgage_interest', parseFloat(e.target.value) || 0)}
                  className="h-8 w-28 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Sporeni</label>
                <input
                  type="number"
                  value={config.savings_contributions || ''}
                  onChange={e => onConfigChange('savings_contributions', parseFloat(e.target.value) || 0)}
                  className="h-8 w-28 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Ostatni</label>
                <input
                  type="number"
                  value={config.other_deductions || ''}
                  onChange={e => onConfigChange('other_deductions', parseFloat(e.target.value) || 0)}
                  className="h-8 w-28 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Slevy */}
          <div>
            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Slevy</div>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={config.taxpayer_discount ?? true}
                  onChange={e => onConfigChange('taxpayer_discount', e.target.checked)}
                  className="rounded"
                />
                Poplatnik ({CZK(rates.taxpayer_discount)})
              </label>
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Deti</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={config.children_count || ''}
                  onChange={e => onConfigChange('children_count', parseInt(e.target.value) || 0)}
                  className="h-8 w-16 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Ostatni slevy</label>
                <input
                  type="number"
                  value={config.other_credits || ''}
                  onChange={e => onConfigChange('other_credits', parseFloat(e.target.value) || 0)}
                  className="h-8 w-28 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Socialni pojisteni - breakdown */}
          {calc && (
            <InsuranceBreakdown
              label="Socialni pojisteni"
              base={calc.socialBase}
              calculated={calc.socialCalculated}
              rateLabel={`${(rates.social_insurance_rate * 100).toFixed(1)}%`}
              advancesPaid={config.social_advances_paid ?? 0}
              onAdvancesChange={v => onConfigChange('social_advances_paid', v)}
              due={calc.socialDue}
            />
          )}

          {/* Zdravotni pojisteni - breakdown */}
          {calc && (
            <InsuranceBreakdown
              label="Zdravotni pojisteni"
              base={calc.healthBase}
              calculated={calc.healthCalculated}
              rateLabel={`${(rates.health_insurance_rate * 100).toFixed(1)}%`}
              advancesPaid={config.health_advances_paid ?? 0}
              onAdvancesChange={v => onConfigChange('health_advances_paid', v)}
              due={calc.healthDue}
            />
          )}

          {/* Poznamka + save */}
          <div className="flex items-end gap-3 pt-1 border-t dark:border-gray-700">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 block mb-0.5">Poznamka</label>
              <input
                type="text"
                value={config.notes || ''}
                onChange={e => onConfigChange('notes', e.target.value)}
                className="h-8 w-full px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
                placeholder="Poznamka k rocni kalkulaci..."
              />
            </div>
            <button
              onClick={onSave}
              disabled={saving}
              className="h-8 px-4 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Ulozit
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

function CompanyRow({
  company,
  annualConfig,
  monthlyTotals,
  rates,
  year,
  onSave,
}: {
  company: TaxCompany
  annualConfig: Partial<TaxAnnualConfigRow> | null
  monthlyTotals: { revenue: number; expenses: number } | null
  rates: TaxRates
  year: number
  onSave: (companyId: string, data: any) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMain, setSavedMain] = useState(false)

  // Local state for revenue/expenses (editable inline)
  const [revenue, setRevenue] = useState<number>(
    annualConfig?.annual_revenue ?? monthlyTotals?.revenue ?? 0
  )
  const [expenses, setExpenses] = useState<number>(
    annualConfig?.annual_expenses ?? monthlyTotals?.expenses ?? 0
  )

  // Local state for expanded detail config
  const [config, setConfig] = useState<Partial<TaxAnnualConfigRow>>({
    mortgage_interest: annualConfig?.mortgage_interest ?? 0,
    savings_contributions: annualConfig?.savings_contributions ?? 0,
    other_deductions: annualConfig?.other_deductions ?? 0,
    taxpayer_discount: annualConfig?.taxpayer_discount ?? true,
    children_count: annualConfig?.children_count ?? 0,
    other_credits: annualConfig?.other_credits ?? 0,
    social_advances_paid: annualConfig?.social_advances_paid ?? 0,
    health_advances_paid: annualConfig?.health_advances_paid ?? 0,
    notes: annualConfig?.notes ?? '',
  })

  const initialRevRef = useRef(revenue)
  const initialExpRef = useRef(expenses)

  // Reset on prop change
  useEffect(() => {
    const rev = annualConfig?.annual_revenue ?? monthlyTotals?.revenue ?? 0
    const exp = annualConfig?.annual_expenses ?? monthlyTotals?.expenses ?? 0
    setRevenue(rev)
    setExpenses(exp)
    initialRevRef.current = rev
    initialExpRef.current = exp
    setConfig({
      mortgage_interest: annualConfig?.mortgage_interest ?? 0,
      savings_contributions: annualConfig?.savings_contributions ?? 0,
      other_deductions: annualConfig?.other_deductions ?? 0,
      taxpayer_discount: annualConfig?.taxpayer_discount ?? true,
      children_count: annualConfig?.children_count ?? 0,
      other_credits: annualConfig?.other_credits ?? 0,
      social_advances_paid: annualConfig?.social_advances_paid ?? 0,
      health_advances_paid: annualConfig?.health_advances_paid ?? 0,
      notes: annualConfig?.notes ?? '',
    })
  }, [annualConfig, monthlyTotals])

  const isFO = company.legal_form === 'fyzicka_osoba'
  const taxBase = revenue - expenses

  // Calculate DPFO for FO companies
  const calc: IncomeTaxCalculation | null = useMemo(() => {
    if (!isFO) return null
    const taxConfig: TaxAnnualConfig = {
      mortgage_interest: config.mortgage_interest ?? 0,
      savings_contributions: config.savings_contributions ?? 0,
      other_deductions: config.other_deductions ?? 0,
      taxpayer_discount: config.taxpayer_discount ?? true,
      children_count: config.children_count ?? 0,
      children_details: [],
      other_credits: config.other_credits ?? 0,
      social_advances_paid: config.social_advances_paid ?? 0,
      health_advances_paid: config.health_advances_paid ?? 0,
      initial_tax_base: null,
    }
    return calculateIncomeTax({ revenue, expenses }, taxConfig, rates)
  }, [revenue, expenses, config, rates, isFO])

  // s.r.o. simplified: just tax base * 21% (CIT)
  const sroTax = !isFO ? Math.max(0, Math.round(taxBase * 0.21)) : 0

  const netTax = isFO ? Math.max(0, calc?.netTax ?? 0) : sroTax
  const socialDue = isFO ? Math.max(0, calc?.socialDue ?? 0) : 0
  const healthDue = isFO ? Math.max(0, calc?.healthDue ?? 0) : 0
  const totalDue = isFO ? (calc?.totalDue ?? 0) : sroTax

  const isMainDirty = revenue !== initialRevRef.current || expenses !== initialExpRef.current

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await onSave(company.id, {
        company_id: company.id,
        year,
        annual_revenue: revenue,
        annual_expenses: expenses,
        ...config,
        children_details: [],
        initial_tax_base: null,
      })
      initialRevRef.current = revenue
      initialExpRef.current = expenses
      setSavedMain(true)
      setTimeout(() => setSavedMain(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMainRow = async () => {
    setSaving(true)
    try {
      await onSave(company.id, {
        company_id: company.id,
        year,
        annual_revenue: revenue,
        annual_expenses: expenses,
      })
      initialRevRef.current = revenue
      initialExpRef.current = expenses
      setSavedMain(true)
      setTimeout(() => setSavedMain(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <tr className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
          <Link href={`/accountant/clients/${company.id}`} className="hover:text-purple-600 transition-colors">
            <span className="font-semibold">{company.name}</span>
          </Link>
          {isFO && (
            <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">FO</span>
          )}
        </td>
        <td className="px-2 py-2">
          <input
            type="number"
            value={revenue || ''}
            onChange={e => setRevenue(parseFloat(e.target.value) || 0)}
            className="w-full h-8 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
            placeholder="0"
          />
        </td>
        <td className="px-2 py-2">
          <input
            type="number"
            value={expenses || ''}
            onChange={e => setExpenses(parseFloat(e.target.value) || 0)}
            className="w-full h-8 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
            placeholder="0"
          />
        </td>
        <td className="px-3 py-2 text-sm text-right whitespace-nowrap">
          <span className={taxBase >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
            {formatCZK(taxBase)}
          </span>
        </td>
        <td className="px-3 py-2 text-sm text-right whitespace-nowrap text-gray-700 dark:text-gray-300">
          {formatCZK(netTax)}
        </td>
        {isFO ? (
          <>
            <td className="px-3 py-2 text-sm text-right whitespace-nowrap text-gray-700 dark:text-gray-300">{formatCZK(socialDue)}</td>
            <td className="px-3 py-2 text-sm text-right whitespace-nowrap text-gray-700 dark:text-gray-300">{formatCZK(healthDue)}</td>
          </>
        ) : (
          <>
            <td className="px-3 py-2 text-sm text-right text-gray-400">—</td>
            <td className="px-3 py-2 text-sm text-right text-gray-400">—</td>
          </>
        )}
        <td className="px-3 py-2 text-sm text-right whitespace-nowrap font-bold">
          <span className={totalDue > 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}>
            {formatCZK(totalDue)}
          </span>
        </td>
        <td className="px-2 py-2 text-center">
          <div className="flex items-center gap-1 justify-center">
            {isMainDirty && (
              <button
                onClick={handleSaveMainRow}
                disabled={saving}
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 transition-all"
                title="Uložit příjmy/výdaje"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedMain ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
              title="Detail"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <ExpandedDetail
          config={config}
          rates={rates}
          calc={calc}
          onConfigChange={handleConfigChange}
          onSave={handleSaveAll}
          saving={saving}
          isFO={isFO}
        />
      )}
    </>
  )
}

export function IncomeTaxMatrix({ selectedYear }: { selectedYear: number }) {
  const [companies, setCompanies] = useState<TaxCompany[]>([])
  const [configs, setConfigs] = useState<Record<string, Partial<TaxAnnualConfigRow>>>({})
  const [monthlyTotals, setMonthlyTotals] = useState<Record<string, { revenue: number; expenses: number }>>({})
  const [rates, setRates] = useState<TaxRates>(DEFAULT_TAX_RATES)
  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/accountant/tax-annual?year=${selectedYear}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setCompanies(json.companies || [])
      setConfigs(json.configs || {})
      setMonthlyTotals(json.monthlyTotals || {})
      setGroups(json.groups || [])
      if (json.rates) {
        setRates({ ...DEFAULT_TAX_RATES, ...json.rates })
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  // Build billing units (ALL companies)
  const billingUnits = useMemo(() => {
    const groupMap = new Map<string, TaxCompany[]>()
    const standalone: TaxCompany[] = []

    for (const c of companies) {
      if (c.group_name) {
        const arr = groupMap.get(c.group_name) || []
        arr.push(c)
        groupMap.set(c.group_name, arr)
      } else {
        standalone.push(c)
      }
    }

    const units: BillingUnit[] = []

    for (const [groupName, groupCompanies] of groupMap) {
      units.push({
        type: 'group',
        sortKey: groupName.toLowerCase(),
        groupName,
        companies: groupCompanies.sort((a, b) => a.name.localeCompare(b.name, 'cs')),
      })
    }

    for (const c of standalone) {
      units.push({
        type: 'standalone',
        sortKey: c.name.toLowerCase(),
        groupName: null,
        companies: [c],
      })
    }

    return units.sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'cs'))
  }, [companies])

  // Get revenue/expenses for a company
  const getCompanyTotals = useCallback((companyId: string) => {
    const cfg = configs[companyId]
    const mt = monthlyTotals[companyId]
    return {
      revenue: cfg?.annual_revenue ?? mt?.revenue ?? 0,
      expenses: cfg?.annual_expenses ?? mt?.expenses ?? 0,
    }
  }, [configs, monthlyTotals])

  // Group sums
  const getGroupSum = useCallback((companyIds: string[]) => {
    let revenue = 0, expenses = 0, taxBase = 0
    for (const cId of companyIds) {
      const t = getCompanyTotals(cId)
      revenue += t.revenue
      expenses += t.expenses
      taxBase += t.revenue - t.expenses
    }
    return { revenue, expenses, taxBase }
  }, [getCompanyTotals])

  const handleSave = useCallback(async (companyId: string, data: any) => {
    const res = await fetch('/api/accountant/tax-annual', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Save failed')

    const saved = await res.json()
    // Update local state
    setConfigs(prev => ({ ...prev, [companyId]: saved }))
    toast.success('Uloženo')
  }, [])

  // Stats
  const stats = useMemo(() => {
    let totalBase = 0
    let profitable = 0
    let lossmaking = 0
    for (const c of companies) {
      const t = getCompanyTotals(c.id)
      const base = t.revenue - t.expenses
      if (base > 0) { profitable++; totalBase += base }
      else if (base < 0) { lossmaking++; totalBase += base }
    }
    return { totalBase, profitable, lossmaking }
  }, [companies, getCompanyTotals])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-400">Chyba: {error}</p>
        <button onClick={fetchData} className="mt-2 text-sm text-red-600 underline hover:text-red-800">Zkusit znovu</button>
      </div>
    )
  }

  return (
    <>
      {/* Stats */}
      <div className="mb-4 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-soft-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded bg-purple-500 border-2 border-purple-600 flex items-center justify-center">
              <span className="text-sm text-white font-bold">{companies.length}</span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs text-gray-500 dark:text-gray-400">Firem celkem</div>
              <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{companies.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded bg-green-500 border-2 border-green-600 flex items-center justify-center">
              <span className="text-sm text-white font-bold">{stats.profitable}</span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs text-gray-500 dark:text-gray-400">V zisku</div>
              <div className="text-lg font-bold text-green-700 dark:text-green-400">{stats.profitable}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded bg-red-500 border-2 border-red-600 flex items-center justify-center">
              <span className="text-sm text-white font-bold">{stats.lossmaking}</span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs text-gray-500 dark:text-gray-400">Ve ztrátě</div>
              <div className="text-lg font-bold text-red-700 dark:text-red-400">{stats.lossmaking}</div>
            </div>
          </div>
          <div className="border-l pl-3 ml-1 hidden sm:block">
            <div className="text-xs text-gray-500 dark:text-gray-400">Celkový základ daně {selectedYear}</div>
            <div className={`text-lg font-bold ${stats.totalBase >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {stats.totalBase >= 0 ? '+' : ''}{Math.round(stats.totalBase).toLocaleString('cs-CZ')} Kč
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft-sm overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-purple-600 to-blue-600">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider min-w-[160px]">Firma</th>
              <th className="px-2 py-3 text-right text-xs font-medium text-white uppercase tracking-wider min-w-[110px]">Příjmy</th>
              <th className="px-2 py-3 text-right text-xs font-medium text-white uppercase tracking-wider min-w-[110px]">Výdaje</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider min-w-[90px]">Základ</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider min-w-[80px]">Daň</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider min-w-[80px]">Soc.</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider min-w-[80px]">Zdrav.</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider min-w-[90px]">CELKEM</th>
              <th className="px-2 py-3 text-center text-xs font-medium text-white uppercase tracking-wider w-16"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {billingUnits.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  Žádné firmy k zobrazení
                </td>
              </tr>
            ) : (
              billingUnits.map((unit) => {
                const isGroup = unit.type === 'group'
                const groupName = unit.groupName
                const isCollapsed = groupName ? collapsedGroups.has(groupName) : false

                return (
                  <React.Fragment key={isGroup ? `g-${groupName}` : `s-${unit.companies[0].id}`}>
                    {/* Group header */}
                    {isGroup && (() => {
                      const sum = getGroupSum(unit.companies.map(c => c.id))
                      const hasData = sum.revenue > 0 || sum.expenses > 0
                      return (
                        <tr
                          className="bg-purple-50 dark:bg-purple-900/20 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                          onClick={() => setCollapsedGroups(prev => {
                            const next = new Set(prev)
                            if (next.has(groupName!)) next.delete(groupName!)
                            else next.add(groupName!)
                            return next
                          })}
                        >
                          <td className="px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 select-none">
                            <span className="inline-flex items-center gap-1">
                              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                              {groupName}
                              <span className="ml-1 text-[10px] font-normal text-purple-500 dark:text-purple-400">
                                ({unit.companies.length} firem)
                              </span>
                            </span>
                          </td>
                          {hasData ? (
                            <>
                              <td className="px-2 py-2 text-right text-xs font-medium text-purple-600 dark:text-purple-400">Σ {formatCZK(sum.revenue)}</td>
                              <td className="px-2 py-2 text-right text-xs font-medium text-purple-600 dark:text-purple-400">Σ {formatCZK(sum.expenses)}</td>
                              <td className="px-3 py-2 text-right text-xs font-bold">
                                <span className={sum.taxBase >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                  Σ {formatCZK(sum.taxBase)}
                                </span>
                              </td>
                              <td colSpan={4}></td>
                            </>
                          ) : (
                            <td colSpan={7}></td>
                          )}
                          <td></td>
                        </tr>
                      )
                    })()}

                    {/* Individual company rows */}
                    {(!isGroup || !isCollapsed) && unit.companies.map((company) => (
                      <CompanyRow
                        key={`${company.id}-${selectedYear}`}
                        company={company}
                        annualConfig={configs[company.id] || null}
                        monthlyTotals={monthlyTotals[company.id] || null}
                        rates={rates}
                        year={selectedYear}
                        onSave={handleSave}
                      />
                    ))}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
