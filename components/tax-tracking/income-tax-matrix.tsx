'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, Calculator } from 'lucide-react'
import { IncomeTaxCell } from './income-tax-cell'
import { TaxEditModal } from './tax-edit-modal'
import { IncomeTaxDetailModal } from './income-tax-detail-modal'
import type { TaxPeriodData, TaxCompany } from '@/lib/types/tax'

const months = [
  'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer',
  'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'
]
const monthsShort = [
  'Le', 'Ún', 'Bř', 'Du', 'Kv', 'Čn',
  'Čc', 'Sr', 'Zá', 'Ří', 'Li', 'Pr'
]
const monthsFull = [
  'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
  'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'
]

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

export function IncomeTaxMatrix({ selectedYear }: { selectedYear: number }) {
  const [companies, setCompanies] = useState<TaxCompany[]>([])
  const [taxData, setTaxData] = useState<TaxPeriodData[]>([])
  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalCompanyId, setModalCompanyId] = useState('')
  const [modalCompanyName, setModalCompanyName] = useState('')
  const [modalPeriod, setModalPeriod] = useState('')

  // DPFO modal
  const [dpfoOpen, setDpfoOpen] = useState(false)
  const [dpfoCompanyId, setDpfoCompanyId] = useState('')
  const [dpfoCompanyName, setDpfoCompanyName] = useState('')

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

  // Tax data lookup
  const taxDataMap = useMemo(() => {
    const map = new Map<string, TaxPeriodData>()
    for (const d of taxData) {
      map.set(`${d.company_id}:${d.period}`, d)
    }
    return map
  }, [taxData])

  // YTD calculation for a company up to a given month
  const getYtd = useCallback((companyId: string, upToMonth: number): number => {
    let total = 0
    for (let m = 0; m <= upToMonth; m++) {
      const period = `${selectedYear}-${String(m + 1).padStart(2, '0')}`
      const d = taxDataMap.get(`${companyId}:${period}`)
      if (d) {
        total += (d.tax_base_override ?? (d.revenue - d.expenses))
      }
    }
    return total
  }, [selectedYear, taxDataMap])

  // Build billing units (ALL companies, not just VAT payers)
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

  // Group YTD sum
  const getGroupYtd = useCallback((companyIds: string[], upToMonth: number): number => {
    let total = 0
    for (const cId of companyIds) {
      total += getYtd(cId, upToMonth)
    }
    return total
  }, [getYtd])

  const handleCellClick = useCallback((companyId: string, companyName: string, monthIndex: number) => {
    const period = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`
    setModalCompanyId(companyId)
    setModalCompanyName(companyName)
    setModalPeriod(period)
    setModalOpen(true)
  }, [selectedYear])

  const handleSave = useCallback((updated: TaxPeriodData) => {
    setTaxData(prev => {
      const idx = prev.findIndex(d => d.company_id === updated.company_id && d.period === updated.period)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = updated
        return next
      }
      return [...prev, updated]
    })
  }, [])

  const modalData = useMemo(() =>
    taxDataMap.get(`${modalCompanyId}:${modalPeriod}`) || null,
    [taxDataMap, modalCompanyId, modalPeriod]
  )

  // Stats
  const stats = useMemo(() => {
    let totalProfit = 0
    let profitable = 0
    let lossmaking = 0
    for (const c of companies) {
      const ytd = getYtd(c.id, currentMonth)
      if (ytd > 0) { profitable++; totalProfit += ytd }
      else if (ytd < 0) { lossmaking++; totalProfit += ytd }
    }
    return { totalProfit, profitable, lossmaking }
  }, [companies, getYtd])

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
      <div className="mb-6 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-soft-sm">
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
            <div className="text-xs text-gray-500 dark:text-gray-400">Celkový základ daně YTD</div>
            <div className={`text-lg font-bold ${stats.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}{Math.round(stats.totalProfit).toLocaleString('cs-CZ')} Kč
            </div>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft-sm overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ minWidth: '1200px' }}>
          <thead className="bg-gradient-to-r from-purple-600 to-blue-600">
            <tr>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky left-0 bg-purple-600 z-10 min-w-[160px]">
                Firma
              </th>
              {months.map((month, index) => (
                <th
                  key={index}
                  className={`px-0.5 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                    index === currentMonth && selectedYear === currentYear
                      ? 'bg-white/20 text-white font-bold ring-2 ring-white/50 rounded'
                      : 'text-white'
                  }`}
                >
                  <span className="hidden sm:inline">{month}</span>
                  <span className="sm:hidden">{monthsShort[index]}</span>
                  {index === currentMonth && selectedYear === currentYear && (
                    <div className="text-xs font-normal">●</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {billingUnits.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
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
                    {isGroup && (
                      <tr
                        className="bg-purple-50 dark:bg-purple-900/20 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                        onClick={() => setCollapsedGroups(prev => {
                          const next = new Set(prev)
                          if (next.has(groupName!)) next.delete(groupName!)
                          else next.add(groupName!)
                          return next
                        })}
                      >
                        <td className="px-2 sm:px-4 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 sticky left-0 z-10 bg-purple-50 dark:bg-purple-900/20 select-none">
                          <span className="inline-flex items-center gap-1">
                            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                            {groupName}
                            <span className="ml-1 text-[10px] font-normal text-purple-500 dark:text-purple-400">
                              ({unit.companies.length} firem)
                            </span>
                          </span>
                        </td>
                        {/* Group aggregate cells */}
                        {months.map((_, monthIndex) => {
                          const isFuture = selectedYear > currentYear || (selectedYear === currentYear && monthIndex > currentMonth)
                          if (isFuture) {
                            return <td key={monthIndex} className="px-0.5 py-1.5 text-center"><div className="w-[88px] h-6 mx-auto" /></td>
                          }
                          const groupYtd = getGroupYtd(unit.companies.map(c => c.id), monthIndex)
                          if (groupYtd === 0) {
                            return <td key={monthIndex} className="px-0.5 py-1.5 text-center"><div className="w-[88px] h-6 mx-auto" /></td>
                          }
                          return (
                            <td key={monthIndex} className="px-0.5 py-1.5 text-center">
                              <div className={`text-[9px] leading-tight font-medium ${groupYtd >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                Σ {groupYtd >= 0 ? '+' : ''}{Math.round(groupYtd).toLocaleString('cs-CZ')}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )}

                    {/* Individual company rows */}
                    {(!isGroup || !isCollapsed) && unit.companies.map((company, cIndex) => (
                      <tr
                        key={company.id}
                        className={cIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}
                      >
                        <td className={`px-2 sm:px-4 py-1.5 text-sm font-medium text-gray-900 dark:text-white sticky left-0 z-10 ${cIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                          <div className="flex items-center gap-1">
                            <Link href={`/accountant/clients/${company.id}`} className="hover:text-purple-600 transition-colors min-w-0">
                              <div className="truncate max-w-[130px]">
                                <span className="font-semibold">{company.name}</span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1.5">
                                  {company.legal_form === 'fyzicka_osoba' ? 'FO' : company.legal_form.toUpperCase()}
                                </span>
                              </div>
                            </Link>
                            {company.legal_form === 'fyzicka_osoba' && (
                              <button
                                onClick={() => { setDpfoCompanyId(company.id); setDpfoCompanyName(company.name); setDpfoOpen(true) }}
                                className="shrink-0 p-0.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-500 dark:text-purple-400 transition-colors"
                                title="DPFO kalkulátor"
                              >
                                <Calculator className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        {months.map((_, monthIndex) => {
                          const period = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`
                          const isFuture = selectedYear > currentYear || (selectedYear === currentYear && monthIndex > currentMonth)
                          const cellData = taxDataMap.get(`${company.id}:${period}`) || null
                          const ytd = getYtd(company.id, monthIndex)

                          return (
                            <IncomeTaxCell
                              key={monthIndex}
                              data={cellData}
                              ytdResult={ytd}
                              companyName={company.name}
                              monthLabel={`${monthsFull[monthIndex]} ${selectedYear}`}
                              isFuture={isFuture}
                              onClick={() => handleCellClick(company.id, company.name, monthIndex)}
                            />
                          )
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <TaxEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        companyId={modalCompanyId}
        companyName={modalCompanyName}
        period={modalPeriod}
        data={modalData}
        onSave={handleSave}
      />

      {/* DPFO Calculator Modal */}
      <IncomeTaxDetailModal
        open={dpfoOpen}
        onOpenChange={setDpfoOpen}
        companyId={dpfoCompanyId}
        companyName={dpfoCompanyName}
        year={selectedYear}
      />
    </>
  )
}
