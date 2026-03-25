'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Shield,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  ChevronRight,
  Loader2,
  Banknote,
  Target,
  ArrowUpRight,
} from 'lucide-react'
import type { InsuranceCase } from '@/lib/types/insurance'
import { insuranceStatusLabel, insuranceStatusColor, insuranceTypeLabel } from '@/lib/types/insurance'

interface ClaimsStats {
  total: number
  active: number
  waiting: number
  resolved_this_month: number
  total_claimed: number
  total_paid: number
  success_rate: number
}

function formatCurrency(amount: number): string {
  if (amount === 0) return '0 Kč'
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} mil. Kč`
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} tis. Kč`
  return `${amount.toLocaleString('cs-CZ')} Kč`
}

export default function ClaimsDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<ClaimsStats | null>(null)
  const [recentCases, setRecentCases] = useState<InsuranceCase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, casesRes] = await Promise.all([
          fetch('/api/claims/stats'),
          fetch('/api/claims/cases?limit=10'),
        ])

        if (statsRes.ok) {
          setStats(await statsRes.json())
        }

        if (casesRes.ok) {
          const data = await casesRes.json()
          setRecentCases(data.cases || [])
        }
      } catch {
        // Stats/cases fetch is optional — dashboard shows empty state
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredCases = useMemo(() => {
    if (!search.trim()) return recentCases
    const q = search.toLowerCase()
    return recentCases.filter(
      (c) =>
        c.case_number?.toLowerCase().includes(q) ||
        c.event_description?.toLowerCase().includes(q) ||
        (c as Record<string, unknown>).company_name?.toString().toLowerCase().includes(q)
    )
  }, [recentCases, search])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pojistné události</h1>
          <p className="text-muted-foreground mt-1">Přehled a správa pojistných událostí</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const hasData = stats && stats.total > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pojistné události</h1>
          <p className="text-muted-foreground mt-1">
            {hasData
              ? `${stats.total} spisů celkem, ${stats.active} aktivních`
              : 'Přehled a správa pojistných událostí'}
          </p>
        </div>
        <Link href="/accountant/claims/cases/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nový spis
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/accountant/claims/cases?status=gathering_docs">
          <Card className="rounded-xl hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktivní spisy</p>
                  <p className="text-2xl font-bold mt-1">{stats?.active ?? 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/accountant/claims/cases?status=under_review">
          <Card className="rounded-xl hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Čeká na pojišťovnu</p>
                  <p className="text-2xl font-bold mt-1">{stats?.waiting ?? 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/accountant/claims/cases?status=approved">
          <Card className="rounded-xl hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vyřešeno tento měsíc</p>
                  <p className="text-2xl font-bold mt-1">{stats?.resolved_this_month ?? 0}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Celkem nárokováno</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats?.total_claimed ?? 0)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary metrics */}
      {hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Celkem vyplaceno</p>
                <p className="text-lg font-bold">{formatCurrency(stats.total_paid)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                <Target className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Úspěšnost</p>
                <p className="text-lg font-bold">{stats.success_rate} %</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">K doplnění</p>
                <p className="text-lg font-bold">{stats.waiting}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent cases table */}
      <Card className="rounded-xl">
        <div className="p-5 border-b">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Nedávné spisy</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hledat spis..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-48 h-9 text-sm rounded-lg"
                />
              </div>
              <Link href="/accountant/claims/cases">
                <Button variant="outline" size="sm" className="text-sm">
                  Všechny spisy
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {filteredCases.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-base font-semibold">
              {search ? 'Žádné výsledky' : 'Žádné spisy'}
            </h3>
            <p className="text-muted-foreground mt-1 text-sm max-w-sm">
              {search
                ? 'Zkuste upravit hledaný výraz.'
                : 'Vytvořte první spis pojistné události pro zahájení práce.'}
            </p>
            {!search && (
              <Link href="/accountant/claims/cases/new" className="mt-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nový spis
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-5 py-3 font-medium text-muted-foreground">Č. spisu</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Klient</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Typ</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-right">Nárokováno</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Aktualizace</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => {
                  const caseAny = c as Record<string, unknown>
                  const companyObj = caseAny.companies as Record<string, unknown> | undefined
                  const companyName = (caseAny.company_name as string) || (companyObj?.name as string) || '—'
                  const statusColors = insuranceStatusColor(c.status)
                  return (
                    <tr
                      key={c.id}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/accountant/claims/cases/${c.id}`)}
                    >
                      <td className="px-5 py-3 font-mono text-xs font-medium">
                        <Link href={`/accountant/claims/cases/${c.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                          {c.case_number || '—'}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-medium truncate max-w-[200px]">
                        {companyName}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {insuranceTypeLabel(c.insurance_type)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={`text-xs ${statusColors}`}>
                          {insuranceStatusLabel(c.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {c.claimed_amount
                          ? `${c.claimed_amount.toLocaleString('cs-CZ')} Kč`
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {c.updated_at
                          ? new Date(c.updated_at).toLocaleDateString('cs-CZ')
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/accountant/claims/cases/new">
          <Card className="rounded-xl hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold">Nový spis</p>
                <p className="text-sm text-muted-foreground">Založit novou pojistnou událost</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/accountant/claims/cases?status=additional_info">
          <Card className="rounded-xl hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold">K doplnění</p>
                <p className="text-sm text-muted-foreground">Spisy čekající na podklady od klienta</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
