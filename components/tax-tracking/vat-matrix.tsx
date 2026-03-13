'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronRight, Save, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TaxPeriodData, TaxCompany } from '@/lib/types/tax'

const monthsShort = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']

const currentMonth = new Date().getMonth()
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

function isQuarterEnd(monthIndex: number): boolean {
  return (monthIndex + 1) % 3 === 0
}

function formatCZK(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ')
}

type RowData = {
  vat_output: number
  vat_input: number
  notes: string
}

function CompanyRow({
  company,
  data,
  period,
  isQuarterlyInterim,
  onSave,
}: {
  company: TaxCompany
  data: TaxPeriodData | null
  period: string
  isQuarterlyInterim: boolean
  onSave: (companyId: string, values: RowData) => Promise<void>
}) {
  const [values, setValues] = useState<RowData>({
    vat_output: data?.vat_output ?? 0,
    vat_input: data?.vat_input ?? 0,
    notes: data?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const initialRef = useRef(JSON.stringify(values))

  // Reset when data/period changes
  useEffect(() => {
    const newVals: RowData = {
      vat_output: data?.vat_output ?? 0,
      vat_input: data?.vat_input ?? 0,
      notes: data?.notes ?? '',
    }
    setValues(newVals)
    initialRef.current = JSON.stringify(newVals)
    setSaved(false)
  }, [data, period])

  const vatResult = values.vat_output - values.vat_input
  const isDirty = JSON.stringify(values) !== initialRef.current

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(company.id, values)
      initialRef.current = JSON.stringify(values)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className={`border-b border-gray-100 dark:border-gray-700/50 ${isQuarterlyInterim ? 'opacity-60' : ''}`}>
      <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
        <Link href={`/accountant/clients/${company.id}`} className="hover:text-purple-600 transition-colors">
          <span className="font-semibold">{company.name}</span>
        </Link>
        {company.vat_period === 'quarterly' && (
          <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">Q</span>
        )}
        {company.managing_director && (
          <div className="text-[10px] text-gray-400 font-normal">{company.managing_director}</div>
        )}
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          value={values.vat_output || ''}
          onChange={e => setValues(prev => ({ ...prev, vat_output: parseFloat(e.target.value) || 0 }))}
          className="w-full h-8 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
          placeholder="0"
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          value={values.vat_input || ''}
          onChange={e => setValues(prev => ({ ...prev, vat_input: parseFloat(e.target.value) || 0 }))}
          className="w-full h-8 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
          placeholder="0"
        />
      </td>
      <td className="px-3 py-2 text-sm font-semibold text-right whitespace-nowrap">
        <span className={vatResult > 0 ? 'text-red-600 dark:text-red-400' : vatResult < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
          {vatResult > 0 ? '+' : ''}{formatCZK(vatResult)} Kč
        </span>
      </td>
      <td className="px-2 py-2">
        <input
          type="text"
          value={values.notes}
          onChange={e => setValues(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full h-8 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Poznámka..."
        />
      </td>
      <td className="px-2 py-2 text-center">
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
            saved
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : isDirty
                ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed'
          }`}
          title="Uložit"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        </button>
      </td>
    </tr>
  )
}

export function VatMatrix({ selectedYear }: { selectedYear: number }) {
  const [companies, setCompanies] = useState<TaxCompany[]>([])
  const [taxData, setTaxData] = useState<TaxPeriodData[]>([])
  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [selectedMonth, setSelectedMonth] = useState(() =>
    selectedYear === currentYear ? currentMonth : 0
  )

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/accountant/tax-data?year=${selectedYear}`)
      if (!res.ok) throw new Error('Failed to fetch tax data')
      const json = await res.json()
      setCompanies(json.companies || [])
      setTaxData(json.taxData || [])
      setGroups(json.groups || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset month when year changes
  useEffect(() => {
    setSelectedMonth(selectedYear === currentYear ? currentMonth : 0)
  }, [selectedYear])

  const vatCompanies = useMemo(() =>
    companies.filter(c => c.vat_payer),
    [companies]
  )

  const taxDataMap = useMemo(() => {
    const map = new Map<string, TaxPeriodData>()
    for (const d of taxData) {
      map.set(`${d.company_id}:${d.period}`, d)
    }
    return map
  }, [taxData])

  const period = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  // Build billing units
  const billingUnits = useMemo(() => {
    const groupMap = new Map<string, TaxCompany[]>()
    const standalone: TaxCompany[] = []

    for (const c of vatCompanies) {
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
  }, [vatCompanies])

  // Group sum for the current month
  const getGroupSum = useCallback((companyIds: string[]) => {
    let vatOutput = 0, vatInput = 0
    for (const cId of companyIds) {
      const d = taxDataMap.get(`${cId}:${period}`)
      if (d) {
        vatOutput += d.vat_output
        vatInput += d.vat_input
      }
    }
    return { vatOutput, vatInput, vatResult: vatOutput - vatInput }
  }, [taxDataMap, period])

  const handleRowSave = useCallback(async (companyId: string, values: RowData) => {
    const res = await fetch('/api/accountant/tax-data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        period,
        revenue: 0,
        expenses: 0,
        vat_output: values.vat_output,
        vat_input: values.vat_input,
        vat_result: null,
        notes: values.notes || null,
      }),
    })

    if (!res.ok) throw new Error('Save failed')

    const saved = await res.json()
    setTaxData(prev => {
      const idx = prev.findIndex(d => d.company_id === companyId && d.period === period)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    toast.success('Uloženo')
  }, [period])

  // Stats
  const stats = useMemo(() => {
    let totalVat = 0
    let filled = 0
    let empty = 0
    for (const c of vatCompanies) {
      for (let m = 0; m < 12; m++) {
        if (selectedYear > currentYear || (selectedYear === currentYear && m > currentMonth)) continue
        const p = `${selectedYear}-${String(m + 1).padStart(2, '0')}`
        const d = taxDataMap.get(`${c.id}:${p}`)
        if (d && (d.vat_output > 0 || d.vat_input > 0)) {
          filled++
          totalVat += d.vat_result ?? (d.vat_output - d.vat_input)
        } else {
          empty++
        }
      }
    }
    return { totalVat, filled, empty }
  }, [vatCompanies, taxDataMap, selectedYear])

  // Per-month indicator: has any data for that month?
  const monthHasData = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const p = `${selectedYear}-${String(m + 1).padStart(2, '0')}`
      return vatCompanies.some(c => {
        const d = taxDataMap.get(`${c.id}:${p}`)
        return d && (d.vat_output > 0 || d.vat_input > 0)
      })
    })
  }, [vatCompanies, taxDataMap, selectedYear])

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
              <span className="text-sm text-white font-bold">{vatCompanies.length}</span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs text-gray-500 dark:text-gray-400">Plátců DPH</div>
              <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{vatCompanies.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded bg-green-500 border-2 border-green-600 flex items-center justify-center">
              <span className="text-sm text-white font-bold">{stats.filled}</span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs text-gray-500 dark:text-gray-400">Vyplněno</div>
              <div className="text-lg font-bold text-green-700 dark:text-green-400">{stats.filled}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded bg-gray-300 dark:bg-gray-600 border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center">
              <span className="text-sm text-white font-bold">{stats.empty}</span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs text-gray-500 dark:text-gray-400">Prázdné</div>
              <div className="text-lg font-bold text-gray-500 dark:text-gray-400">{stats.empty}</div>
            </div>
          </div>
          <div className="border-l pl-3 ml-1 hidden sm:block">
            <div className="text-xs text-gray-500 dark:text-gray-400">Celkové DPH {selectedYear}</div>
            <div className={`text-lg font-bold ${stats.totalVat > 0 ? 'text-red-600 dark:text-red-400' : stats.totalVat < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
              {stats.totalVat > 0 ? '+' : ''}{Math.round(stats.totalVat).toLocaleString('cs-CZ')} Kč
            </div>
          </div>
        </div>
      </div>

      {/* Month selector bar */}
      <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-soft-sm overflow-hidden">
        <div className="flex">
          {monthsShort.map((m, i) => {
            const isSelected = selectedMonth === i
            const isFuture = selectedYear > currentYear || (selectedYear === currentYear && i > currentMonth)
            const hasData = monthHasData[i]

            return (
              <button
                key={i}
                onClick={() => !isFuture && setSelectedMonth(i)}
                disabled={isFuture}
                className={`flex-1 py-2.5 text-center text-xs font-medium transition-all relative ${
                  isSelected
                    ? 'bg-purple-600 text-white'
                    : isFuture
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                {m}
                {/* Dot indicator for months with data */}
                {hasData && !isSelected && !isFuture && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400"></span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft-sm overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-purple-600 to-blue-600">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider min-w-[160px]">Firma</th>
              <th className="px-2 py-3 text-right text-xs font-medium text-white uppercase tracking-wider min-w-[110px]">DPH výstup</th>
              <th className="px-2 py-3 text-right text-xs font-medium text-white uppercase tracking-wider min-w-[110px]">DPH vstup</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider min-w-[120px]">DPH výsledek</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-white uppercase tracking-wider min-w-[130px]">Poznámka</th>
              <th className="px-2 py-3 text-center text-xs font-medium text-white uppercase tracking-wider w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {billingUnits.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  Žádní plátci DPH k zobrazení
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
                      const hasData = sum.vatOutput > 0 || sum.vatInput > 0
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
                              <td className="px-2 py-2 text-right text-xs font-medium text-purple-600 dark:text-purple-400">Σ {formatCZK(sum.vatOutput)}</td>
                              <td className="px-2 py-2 text-right text-xs font-medium text-purple-600 dark:text-purple-400">Σ {formatCZK(sum.vatInput)}</td>
                              <td className="px-3 py-2 text-right text-xs font-bold">
                                <span className={sum.vatResult > 0 ? 'text-red-600 dark:text-red-400' : sum.vatResult < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                                  Σ {sum.vatResult > 0 ? '+' : ''}{formatCZK(sum.vatResult)} Kč
                                </span>
                              </td>
                            </>
                          ) : (
                            <td colSpan={3}></td>
                          )}
                          <td colSpan={2}></td>
                        </tr>
                      )
                    })()}

                    {/* Individual company rows */}
                    {(!isGroup || !isCollapsed) && unit.companies.map((company) => {
                      const cellData = taxDataMap.get(`${company.id}:${period}`) || null
                      const isQuarterlyInterim = company.vat_period === 'quarterly' && !isQuarterEnd(selectedMonth)

                      return (
                        <CompanyRow
                          key={`${company.id}-${period}`}
                          company={company}
                          data={cellData}
                          period={period}
                          isQuarterlyInterim={isQuarterlyInterim}
                          onSave={handleRowSave}
                        />
                      )
                    })}
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
