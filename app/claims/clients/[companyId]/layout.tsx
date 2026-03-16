'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  FolderOpen,
  ClipboardList,
  MessageCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ClaimsCompany = {
  id: string
  name: string
  ico: string
  dic: string | null
  legal_form: string
  status: string | null
  email: string | null
  phone: string | null
  // aggregates from company-profile endpoint
  cases_total?: number
  cases_open?: number
  cases_closed?: number
  claimed_amount?: number
  approved_amount?: number
  paid_amount?: number
}

// ── Context ───────────────────────────────────────────────────────────────────

type ClaimsClientContextType = {
  company: ClaimsCompany
  companyId: string
  refetchData: () => void
}

const ClaimsClientContext = createContext<ClaimsClientContextType | null>(null)

export function useClaimsClient() {
  const ctx = useContext(ClaimsClientContext)
  if (!ctx) throw new Error('useClaimsClient must be used within ClaimsClientLayout')
  return ctx
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function ClaimsClientLayout({ children }: { children: ReactNode }) {
  const params = useParams()
  const pathname = usePathname() ?? ''
  const companyId = params?.companyId as string

  const [company, setCompany] = useState<ClaimsCompany | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/claims/company-profile?company_id=${companyId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      // API returns { profile: { company, claims_summary, accounting_summary } }
      const c = data.profile?.company ?? data.company
      const summary = data.profile?.claims_summary
      const openCount = summary
        ? (summary.total_cases - (summary.by_status?.closed ?? 0) - (summary.by_status?.rejected ?? 0) - (summary.by_status?.withdrawn ?? 0))
        : 0

      setCompany({
        ...c,
        cases_total: summary?.total_cases ?? 0,
        cases_open: openCount,
        cases_closed: (summary?.total_cases ?? 0) - openCount,
        claimed_amount: summary?.total_claimed ?? 0,
        approved_amount: summary?.total_approved ?? 0,
        paid_amount: summary?.total_paid ?? 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba načítání')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-9 bg-blue-50 dark:bg-blue-950/30 rounded-xl w-48" />
        <div className="h-20 bg-blue-50 dark:bg-blue-950/30 rounded-xl" />
        <div className="h-12 bg-blue-50 dark:bg-blue-950/30 rounded-xl" />
        <div className="h-64 bg-blue-50 dark:bg-blue-950/30 rounded-xl" />
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-400">
            Nepodařilo se načíst profil klienta: {error}
          </p>
        </div>
      </div>
    )
  }

  const basePath = `/claims/clients/${companyId}`

  const tabs: Array<{
    href: string
    label: string
    icon: typeof FolderOpen
    match: (p: string) => boolean
    badge?: number
  }> = [
    {
      href: `${basePath}/cases`,
      label: 'Spisy PÚ',
      icon: FolderOpen,
      match: (p) => p.includes('/cases'),
      badge: company.cases_open || 0,
    },
    {
      href: `${basePath}/tasks`,
      label: 'Úkoly',
      icon: ClipboardList,
      match: (p) => p.includes('/tasks'),
    },
    {
      href: `${basePath}/messages`,
      label: 'Zprávy',
      icon: MessageCircle,
      match: (p) => p.includes('/messages'),
    },
    {
      href: `${basePath}/files`,
      label: 'Soubory',
      icon: FileText,
      match: (p) => p.includes('/files'),
    },
    {
      href: `${basePath}/profile`,
      label: 'Firma',
      icon: Building2,
      match: (p) => p.includes('/profile'),
    },
  ]

  const formatCZK = (n?: number) =>
    n ? `${Math.round(n).toLocaleString('cs-CZ')} Kč` : '—'

  return (
    <ClaimsClientContext.Provider value={{ company, companyId, refetchData: fetchData }}>
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Back + action bar */}
        <div className="flex items-center justify-between gap-2">
          <Link href="/claims/cases">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Zpět na spisy</span>
              <span className="sm:hidden">Zpět</span>
            </Button>
          </Link>
          <Link href={`/claims/cases/new?company_id=${companyId}`}>
            <Button
              size="sm"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FolderOpen className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Nový spis</span>
            </Button>
          </Link>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1">
          {tabs.map((tab) => {
            const active = tab.match(pathname)
            const badge = tab.badge
            return (
              <Link key={tab.href} href={tab.href}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  size="sm"
                  className={`rounded-xl shrink-0 text-xs h-8 ${
                    active
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5 mr-1" />
                  {tab.label}
                  {badge !== undefined && badge > 0 && (
                    <span
                      className={`ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold rounded-full ${
                        active ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Company header card */}
        <Card className="rounded-xl shadow-sm border-0 bg-gradient-to-r from-white via-white to-blue-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-blue-900/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400" />
          <CardContent className="py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">

              {/* Name + badges */}
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0 mt-0.5 sm:mt-0">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white truncate">
                    {company.name}
                  </h1>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 text-[10px] sm:text-xs"
                    >
                      {company.legal_form}
                    </Badge>
                    {company.status === 'inactive' && (
                      <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 text-[10px] sm:text-xs">
                        Neaktivní
                      </Badge>
                    )}
                    {company.ico && (
                      <a
                        href={`https://ares.gov.cz/ekonomicke-subjekty-v-be/detail/ico/${company.ico}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        title="Zobrazit v ARES"
                      >
                        IČO: {company.ico}
                      </a>
                    )}
                    {company.dic && (
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                        DIČ: {company.dic}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 pl-[46px] sm:pl-0">
                {company.phone ? (
                  <a href={`tel:${company.phone}`} className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">{company.phone}</span>
                    <span className="sm:hidden">Volat</span>
                  </a>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Nezadáno</span>
                  </span>
                )}
                {company.email ? (
                  <a href={`mailto:${company.email}`} className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[160px] sm:max-w-[200px]">
                    <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{company.email}</span>
                    <span className="sm:hidden">Email</span>
                  </a>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="hidden sm:inline">Nezadáno</span>
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases metrics strip */}
        {(company.cases_total ?? 0) > 0 && (
          <div className="flex items-center gap-6 flex-wrap py-1 w-fit mx-auto text-sm">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-blue-500" />
              <span className="font-bold text-gray-900 dark:text-white">{company.cases_total}</span>
              <span className="text-gray-500">
                {company.cases_total === 1 ? 'spis' : (company.cases_total ?? 0) <= 4 ? 'spisy' : 'spisů'}
              </span>
            </div>
            {(company.cases_open ?? 0) > 0 && (
              <>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-gray-900 dark:text-white">{company.cases_open}</span>
                  <span className="text-gray-500">otevřených</span>
                </div>
              </>
            )}
            {(company.claimed_amount ?? 0) > 0 && (
              <>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Uplatněno:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCZK(company.claimed_amount)}</span>
                </div>
              </>
            )}
            {(company.paid_amount ?? 0) > 0 && (
              <>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Vyplaceno:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{formatCZK(company.paid_amount)}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sub-page content */}
        {children}

      </div>
    </ClaimsClientContext.Provider>
  )
}
