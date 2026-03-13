'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Link2 } from 'lucide-react'
import { PaymentCell } from './payment-cell'
import { BillingEntitySelector } from './billing-entity-selector'

const months = [
  'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer',
  'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'
]
const monthsShort = [
  'Le', 'Ún', 'Bř', 'Du', 'Kv', 'Čn',
  'Čc', 'Sr', 'Zá', 'Ří', 'Li', 'Pr'
]

const currentMonth = new Date().getMonth()
const currentYear = new Date().getFullYear()

type PaymentCompany = {
  id: string
  name: string
  group_name: string | null
  status: string
  monthly_reporting: boolean
  billing_settings: {
    monthly_fee?: number
    client_since?: string
  } | null
  raynet_company_id: number | null
  managing_director?: string | null
}

type Payment = {
  company_id: string
  period: string
  paid: boolean
  paid_at: string | null
}

type GroupInfo = {
  group_name: string
  billing_company_id: string | null
}

type ExtraWork = {
  company_id: string
  period: string
  total_minutes: number
}

export function PaymentMatrix({ selectedYear }: { selectedYear: number }) {
  const [companies, setCompanies] = useState<PaymentCompany[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [groups, setGroups] = useState<GroupInfo[]>([])
  const [extraWork, setExtraWork] = useState<ExtraWork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/accountant/payments?year=${selectedYear}`)
      if (!res.ok) throw new Error('Failed to fetch payments')
      const json = await res.json()
      setCompanies(json.companies || [])
      setPayments(json.payments || [])
      setGroups(json.groups || [])
      setExtraWork(json.extraWork || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  // Payment lookup map
  const paymentMap = useMemo(() => {
    const map = new Map<string, Payment>()
    for (const p of payments) {
      map.set(`${p.company_id}:${p.period}`, p)
    }
    return map
  }, [payments])

  // Extra work lookup
  const extraWorkMap = useMemo(() => {
    const map = new Set<string>()
    for (const ew of extraWork) {
      if (ew.total_minutes > 0) map.add(`${ew.company_id}:${ew.period}`)
    }
    return map
  }, [extraWork])

  // Group billing entity map
  const groupBillingMap = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const g of groups) {
      map.set(g.group_name, g.billing_company_id)
    }
    return map
  }, [groups])

  // Build billing units: groups → 1 row, standalone → 1 row
  // Filter out: inactive, no monthly_reporting, zero fee without group (unless onboarding)
  const billingUnits = useMemo(() => {
    const activeCompanies = companies.filter(c =>
      c.status !== 'inactive' && c.monthly_reporting !== false
    )

    type BillingUnit = {
      type: 'group' | 'standalone'
      sortKey: string
      groupName: string | null
      billingCompanyId: string | null
      companies: PaymentCompany[]
    }

    const groupMap = new Map<string, PaymentCompany[]>()
    const standalone: PaymentCompany[] = []

    for (const c of activeCompanies) {
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
        billingCompanyId: groupBillingMap.get(groupName) || null,
        companies: groupCompanies.sort((a, b) => a.name.localeCompare(b.name, 'cs')),
      })
    }

    for (const c of standalone) {
      units.push({
        type: 'standalone',
        sortKey: c.name.toLowerCase(),
        groupName: null,
        billingCompanyId: null,
        companies: [c],
      })
    }

    return units.sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'cs'))
  }, [companies, groupBillingMap])

  const handlePaymentChange = useCallback(async (companyId: string, period: string, paid: boolean, paidAt: string | null) => {
    // Optimistic update
    setPayments(prev => {
      const existing = prev.find(p => p.company_id === companyId && p.period === period)
      if (existing) {
        return prev.map(p =>
          p.company_id === companyId && p.period === period
            ? { ...p, paid, paid_at: paidAt }
            : p
        )
      }
      return [...prev, { company_id: companyId, period, paid, paid_at: paidAt }]
    })

    try {
      await fetch('/api/accountant/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, period, paid, paid_at: paidAt }),
      })
    } catch {
      // Revert on error — refetch
      fetchData()
    }
  }, [fetchData])

  const handleBillingEntitySelect = useCallback(async (groupName: string, companyId: string) => {
    // Optimistic update
    setGroups(prev =>
      prev.map(g => g.group_name === groupName ? { ...g, billing_company_id: companyId } : g)
    )

    try {
      await fetch('/api/accountant/payments/billing-entity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: groupName, billing_company_id: companyId }),
      })
    } catch {
      // Revert
      setGroups(prev =>
        prev.map(g => g.group_name === groupName ? { ...g, billing_company_id: null } : g)
      )
    }
  }, [])

  const getPaymentStatus = useCallback((companyId: string, monthIndex: number): 'paid' | 'unpaid' | 'future' => {
    if (selectedYear > currentYear || (selectedYear === currentYear && monthIndex > currentMonth)) {
      return 'future'
    }
    const period = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`
    const payment = paymentMap.get(`${companyId}:${period}`)
    return payment?.paid ? 'paid' : 'unpaid'
  }, [selectedYear, paymentMap])

  // Stats
  const stats = useMemo(() => {
    let paid = 0
    let unpaid = 0
    for (const unit of billingUnits) {
      const targetCompanyId = unit.type === 'group'
        ? (unit.billingCompanyId || unit.companies[0]?.id)
        : unit.companies[0]?.id
      if (!targetCompanyId) continue
      for (let m = 0; m < 12; m++) {
        const s = getPaymentStatus(targetCompanyId, m)
        if (s === 'paid') paid++
        if (s === 'unpaid') unpaid++
      }
    }
    return { paid, unpaid }
  }, [billingUnits, getPaymentStatus])

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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded bg-red-500 border-2 border-red-600 flex items-center justify-center">
              <span className="text-sm text-white font-bold">{stats.unpaid}</span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs text-gray-500 dark:text-gray-400">Nezaplaceno</div>
              <div className="text-lg font-bold text-red-700 dark:text-red-400">{stats.unpaid}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded bg-green-500 border-2 border-green-600 flex items-center justify-center">
              <span className="text-sm text-white font-bold">{stats.paid}</span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs text-gray-500 dark:text-gray-400">Zaplaceno</div>
              <div className="text-lg font-bold text-green-700 dark:text-green-400">{stats.paid}</div>
            </div>
          </div>
          <div className="border-l pl-3 ml-1 hidden sm:flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500"></span> Zaplaceno
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500"></span> Nezaplaceno
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-300 border border-gray-400"></span> Vícepráce
            </span>
          </div>
        </div>
      </div>

      {/* Payment Matrix Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft-sm overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ minWidth: '600px' }}>
          <thead className="bg-gradient-to-r from-purple-600 to-blue-600">
            <tr>
              <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky left-0 bg-purple-600 z-10 max-w-[140px] sm:max-w-none">
                Klient
              </th>
              {months.map((month, index) => (
                <th
                  key={index}
                  className={`px-1 sm:px-2 py-3 text-center text-xs font-medium uppercase tracking-wider ${
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
                  Žádní klienti k zobrazení
                </td>
              </tr>
            ) : (
              billingUnits.map((unit, unitIndex) => {
                // For groups: use billing entity or first company as payment target
                const billingCompanyId = unit.type === 'group'
                  ? (unit.billingCompanyId || unit.companies[0]?.id)
                  : unit.companies[0]?.id
                const displayName = unit.type === 'group'
                  ? unit.groupName!
                  : unit.companies[0]?.name

                if (!billingCompanyId) return null

                // Check extra work for any company in the unit
                const unitCompanyIds = unit.companies.map(c => c.id)
                const hasRaynet = unit.companies.some(c => c.raynet_company_id)

                return (
                  <tr
                    key={unit.type === 'group' ? `g-${unit.groupName}` : `s-${unit.companies[0].id}`}
                    className={unitIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}
                  >
                    <td className={`px-2 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-900 dark:text-white sticky left-0 z-10 max-w-[140px] sm:max-w-none ${unitIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/accountant/clients/${unit.type === 'group' ? (unit.billingCompanyId || unit.companies[0]?.id) : unit.companies[0]?.id}`}
                          className="font-semibold truncate flex items-center gap-1 hover:text-purple-600 transition-colors"
                        >
                          {unit.type === 'group' && (
                            <span className="text-purple-500 text-xs shrink-0" title="Skupina">●</span>
                          )}
                          {displayName}
                        </Link>
                        {hasRaynet && (
                          <span title="Propojeno s Raynet CRM" className="shrink-0">
                            <Link2 className="h-3 w-3 text-blue-500" />
                          </span>
                        )}
                        {unit.type === 'group' && (
                          <BillingEntitySelector
                            groupName={unit.groupName!}
                            companies={unit.companies.map(c => ({ id: c.id, name: c.name }))}
                            currentBillingId={unit.billingCompanyId}
                            onSelect={handleBillingEntitySelect}
                          />
                        )}
                      </div>
                      {unit.companies[0]?.managing_director && unit.type !== 'group' && (
                        <div className="text-[10px] text-gray-400 font-normal truncate">{unit.companies[0].managing_director}</div>
                      )}
                    </td>
                    {months.map((monthName, monthIndex) => {
                      const status = getPaymentStatus(billingCompanyId, monthIndex)
                      const period = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`
                      const hasExtra = unitCompanyIds.some(id => extraWorkMap.has(`${id}:${period}`))
                      const payment = paymentMap.get(`${billingCompanyId}:${period}`)

                      return (
                        <PaymentCell
                          key={monthIndex}
                          status={status}
                          hasExtraWork={hasExtra}
                          paidAt={payment?.paid_at ?? null}
                          period={period}
                          companyName={displayName || ''}
                          monthLabel={`${monthName} ${selectedYear}`}
                          onPaymentChange={status !== 'future' ? (paid, paidAt) => handlePaymentChange(billingCompanyId, period, paid, paidAt) : undefined}
                        />
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
