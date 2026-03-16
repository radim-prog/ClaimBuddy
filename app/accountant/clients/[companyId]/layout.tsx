'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  FileText,
  Pencil,
  Users,
  FolderOpen,
  Clock,
  Car,
  Calculator,
  ClipboardList,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Briefcase,
  Activity,
  FileSignature,
  Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EditClientModal } from '@/components/edit-client-modal'
import { OnboardingSection } from '@/components/onboarding-section'
import { UrgencyEmailModal } from '@/components/urgency-email-modal'
import { Employee } from '@/lib/types/employee'
import { Asset } from '@/lib/types/asset'
import { Insurance } from '@/lib/types/insurance'
import { ClientOnboarding } from '@/lib/types/onboarding'
import type { Task } from '@/lib/types/tasks'
import { useAttention } from '@/lib/contexts/attention-context'
import type { HubStats } from '@/lib/types/drive'
import { czechPlural } from '@/lib/utils'
import { MessagePopupDialog } from '@/components/komunikace/message-popup-dialog'

// ============================================
// TYPES (shared across sub-pages)
// ============================================

export type Company = {
  id: string
  name: string
  group_name: string | null
  ico: string
  dic: string | null
  vat_payer: boolean
  vat_period: 'monthly' | 'quarterly' | null
  legal_form: string
  status?: string
  street: string | null
  city: string | null
  zip: string | null
  bank_account?: string | null
  health_insurance_company: string | null
  has_employees: boolean
  employee_count: number
  data_box: { id: string; login?: string; password?: string } | null
  phone?: string
  email?: string
  accounting_start_date?: string | null
  managing_director?: string | null
}

export type StatusType = 'missing' | 'uploaded' | 'approved'

export type MonthlyClosure = {
  id: string
  company_id: string
  period: string
  status: string
  bank_statement_status: StatusType
  expense_documents_status: StatusType
  income_invoices_status: StatusType
  notes: string | null
  updated_by: string | null
  updated_at: string
}

// Mapping zdravotnich pojistoven (shared)
export const healthInsuranceLabels: Record<string, string> = {
  vzp: 'VZP (111)',
  vozp: 'VOZP (201)',
  cpzp: 'CPZP (205)',
  ozp: 'OZP (207)',
  zpmv: 'ZP MV (211)',
  rbp: 'RBP (213)',
  zpma: 'ZP M-A (217)',
}

// ============================================
// COMPANY CONTEXT
// ============================================

type CompanyContextType = {
  company: Company
  companyId: string
  closures: MonthlyClosure[]
  employees: Employee[]
  assets: Asset[]
  insurances: Insurance[]
  tasks: Task[]
  onboarding: ClientOnboarding | null
  setOnboarding: (o: ClientOnboarding | null) => void
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
  setEmployees: (employees: Employee[]) => void
  setAssets: (assets: Asset[]) => void
  setInsurances: (insurances: Insurance[]) => void
  refetchData: () => void
}

const CompanyContext = createContext<CompanyContextType | null>(null)

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider (layout.tsx)')
  return ctx
}

// ============================================
// LAYOUT COMPONENT
// ============================================

export default function ClientDetailLayout({ children }: { children: ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const companyId = params.companyId as string

  const [company, setCompany] = useState<Company | null>(null)
  const [closures, setClosures] = useState<MonthlyClosure[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [insurances, setInsurances] = useState<Insurance[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [onboarding, setOnboarding] = useState<ClientOnboarding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [urgencyModalOpen, setUrgencyModalOpen] = useState(false)
  const [messagePopupOpen, setMessagePopupOpen] = useState(false)
  const [hubStats, setHubStats] = useState<HubStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [healthScore, setHealthScore] = useState<number | null>(null)
  const attentionCtx = useAttention()
  const attention = attentionCtx.getCompanyAttention(companyId)

  // Current period for urgency modal
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() // 0-indexed
  const currentPeriod = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const companyRes = await fetch(`/api/accountant/companies/${companyId}`)
      if (!companyRes.ok) throw new Error('Failed to fetch company')
      const companyData = await companyRes.json()
      setCompany(companyData.company)
      setClosures(companyData.closures || [])

      // Fetch employees, assets, insurances from calendar API
      const calendarRes = await fetch(`/api/accountant/companies/${companyId}/calendar`)
      if (calendarRes.ok) {
        const calData = await calendarRes.json()
        setEmployees(calData.employees || [])
        setAssets(calData.assets || [])
        setInsurances(calData.insurances || [])
      }

      // Fetch tasks
      const tasksRes = await fetch(`/api/tasks?company_id=${companyId}`)
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData.tasks || [])
      }

      // Fetch hub stats for metrics strip
      try {
        const hubRes = await fetch(`/api/drive/hub-stats?companyId=${companyId}`)
        if (hubRes.ok) {
          const hubData = await hubRes.json()
          setHubStats(hubData)
        }
      } catch {
        // hub stats optional
      } finally {
        setStatsLoading(false)
      }

      // Fetch health score (cached from companies table)
      try {
        const hsRes = await fetch(`/api/accountant/health-scores/${companyId}`)
        if (hsRes.ok) {
          const hsData = await hsRes.json()
          setHealthScore(hsData.score ?? null)
        }
      } catch {
        // health score optional
      }

      // Fetch onboarding data if company is in onboarding status
      if (companyData.company.status === 'onboarding') {
        const onboardingRes = await fetch(`/api/accountant/onboarding?company_id=${companyId}`)
        if (onboardingRes.ok) {
          const onboardingData = await onboardingRes.json()
          const companyOnboarding = onboardingData.companies?.[0]?.onboarding
          if (companyOnboarding) {
            setOnboarding(companyOnboarding)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Selected closure for urgency modal
  const selectedClosure = closures.find(c => c.period === currentPeriod)

  // Contact info
  const contactEmail = company?.email || null
  const contactPhone = company?.phone || null

  const handleCompanySave = (updatedCompany: Company) => {
    setCompany(updatedCompany)
  }

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-xl w-48" />
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    )
  }

  // ---- Error state ----
  if (error || !company) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            Nepodařilo se načíst profil klienta: {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <CompanyContext.Provider
      value={{
        company,
        companyId,
        closures,
        employees,
        assets,
        insurances,
        tasks,
        onboarding,
        setOnboarding,
        setTasks,
        setEmployees,
        setAssets,
        setInsurances,
        refetchData: fetchData,
      }}
    >
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Navigation */}
        {(() => {
          const basePath = `/accountant/clients/${companyId}`
          const activeTaskCount = tasks.filter(t =>
            t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress'
          ).length
          const tasksBadge = attention.active_tasks || activeTaskCount || 0
          const messagesBadge = attention.unread_messages || 0
          const documentsBadge = hubStats?.documents?.pending || 0
          const filesBadge = hubStats?.files?.recent || 0
          const notificationsBadge = attention.active_notifications || 0

          const tabs: Array<{ href: string; label: string; icon: typeof Clock; match: (p: string) => boolean; badge?: number }> = [
            { href: `${basePath}/work`, label: 'Práce', icon: Clock, match: (p: string) => p.includes('/work') },
            { href: `${basePath}/tasks`, label: 'Úkoly', icon: ClipboardList, match: (p: string) => p.includes('/tasks'), badge: tasksBadge },
            { href: `${basePath}/messages`, label: 'Zprávy', icon: MessageCircle, match: (p: string) => p.includes('/messages'), badge: messagesBadge },
            { href: `${basePath}/documents`, label: 'Doklady', icon: FileText, match: (p: string) => p.includes('/documents'), badge: documentsBadge },
            { href: `${basePath}/inbox`, label: 'Inbox', icon: Inbox, match: (p: string) => p.includes('/inbox') },
            { href: `${basePath}/files`, label: 'Soubory', icon: FolderOpen, match: (p: string) => p.includes('/files'), badge: filesBadge },
            { href: `${basePath}/travel`, label: 'Jízdy', icon: Car, match: (p: string) => p.includes('/travel') },
            { href: `${basePath}/taxes`, label: 'Daně', icon: Calculator, match: (p: string) => p.includes('/taxes') },
            { href: `${basePath}/dohodari`, label: 'Dohodáři', icon: FileSignature, match: (p: string) => p.includes('/dohodari') || p.includes('/agreements') },
            { href: `${basePath}/profile`, label: 'Firma', icon: Building2, match: (p: string) => p.includes('/profile'), badge: notificationsBadge },
          ]

          // Latest closure status
          const latestClosure = closures.length > 0
            ? [...closures].sort((a, b) => b.period.localeCompare(a.period))[0]
            : null
          const closureComplete = latestClosure
            ? latestClosure.bank_statement_status !== 'missing' &&
              latestClosure.expense_documents_status !== 'missing' &&
              latestClosure.income_invoices_status !== 'missing'
            : false

          // Attention items for banner
          const attentionItems: Array<{ message: string; severity: 'high' | 'medium' | 'low' }> = []
          if (hubStats?.attention?.items) {
            attentionItems.push(...hubStats.attention.items)
          }
          if (latestClosure && !closureComplete) {
            const missingCategories: string[] = []
            if (latestClosure.bank_statement_status === 'missing') missingCategories.push('bankovní výpis')
            if (latestClosure.expense_documents_status === 'missing') missingCategories.push('výdaje')
            if (latestClosure.income_invoices_status === 'missing') missingCategories.push('příjmy')
            if (missingCategories.length > 0) {
              attentionItems.push({
                message: `Uzávěrka: chybí ${missingCategories.join(', ')}`,
                severity: 'high',
              })
            }
          }
          {
            const pendingDocs = hubStats?.documents?.pending || 0
            if (pendingDocs > 0) {
              attentionItems.push({
                message: `${pendingDocs} ${pendingDocs === 1 ? 'doklad' : pendingDocs < 5 ? 'doklady' : 'dokladů'} ke zpracování`,
                severity: 'medium',
              })
            }
          }
          if (attention.unread_messages > 0) {
            attentionItems.push({
              message: `${attention.unread_messages} nepřečten${attention.unread_messages > 1 ? 'ých zpráv' : 'á zpráva'}`,
              severity: 'medium',
            })
          }

          const s = (val: number | undefined) => statsLoading ? '—' : (val ?? '—')

          return (
            <>
              <div className="flex items-center justify-between gap-2">
                <Link href="/accountant/clients">
                  <Button variant="ghost" size="sm" className="rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">Seznam klientů</span>
                    <span className="sm:hidden">Zpět</span>
                  </Button>
                </Link>
                <div className="flex gap-1.5 sm:gap-2">
                  {attention.unread_messages > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400 transition-colors relative"
                      onClick={() => setMessagePopupOpen(true)}
                    >
                      <MessageCircle className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Zpravy</span>
                      <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold rounded-full bg-red-500 text-white">
                        {attention.unread_messages}
                      </span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 transition-colors"
                    onClick={async () => {
                      await fetch('/api/auth/impersonate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ companyId })
                      })
                      router.push('/client/dashboard')
                    }}
                  >
                    <Users className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Pohled klienta</span>
                  </Button>
                  <Link href={`/accountant/extraction/clients/${companyId}`}>
                    <Button variant="outline" size="sm" className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
                      <FileText className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Vytěžování</span>
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-800 transition-colors" onClick={() => setEditModalOpen(true)}>
                    <Pencil className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Upravit</span>
                  </Button>
                </div>
              </div>

              {/* Tabs — always visible */}
              <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1" data-tour="client-tabs">
                {tabs.map(tab => {
                  const active = tab.match(pathname)
                  const badge = tab.badge
                  return (
                    <Link key={tab.href} href={tab.href}>
                      <Button
                        variant={active ? 'default' : 'ghost'}
                        size="sm"
                        className={`rounded-xl shrink-0 text-xs h-8 ${
                          active
                            ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-soft-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <tab.icon className="h-3.5 w-3.5 mr-1" />
                        {tab.label}
                        {badge !== undefined && badge > 0 && (
                          <span className={`ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold rounded-full ${
                            active ? 'bg-white/25 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {badge}
                          </span>
                        )}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </>
          )
        })()}

        {/* Compact Company Header */}
        <Card className="rounded-xl shadow-soft border-0 bg-gradient-to-r from-white via-white to-purple-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-purple-900/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-400" />
          <CardContent className="py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 shrink-0 mt-0.5 sm:mt-0">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-semibold font-display tracking-tight text-gray-900 dark:text-white truncate">
                    {company.group_name && <span className="text-purple-600">{company.group_name} &ndash; </span>}
                    {company.name}
                  </h1>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                    {company.status === 'onboarding' && (
                      <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-[10px] sm:text-xs">Onboarding</Badge>
                    )}
                    {company.status === 'inactive' && (
                      <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 text-[10px] sm:text-xs">Neaktivní</Badge>
                    )}
                    {company.legal_form === 'OSVC' ? (
                      <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 text-[10px] sm:text-xs">FO</Badge>
                    ) : company.legal_form === 's.r.o.' ? (
                      <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-[10px] sm:text-xs">s.r.o.</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] sm:text-xs">{company.legal_form}</Badge>
                    )}
                    {company.vat_payer ? (
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 text-[10px] sm:text-xs">
                        DPH &bull; {company.vat_period === 'monthly' ? 'M' : 'Q'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] sm:text-xs text-gray-500">Neplatce</Badge>
                    )}
                    {company.ico && /^\d{8}$/.test(company.ico) ? (
                      <a
                        href={`https://ares.gov.cz/ekonomicke-subjekty-v-be/detail/ico/${company.ico}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 hover:underline"
                        title="Zobrazit v ARES"
                      >
                        ICO: {company.ico}
                      </a>
                    ) : (
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">ICO: {company.ico}</span>
                    )}
                    {company.dic && <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">DIC: {company.dic}</span>}
                    {company.managing_director && <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Jednatel: {company.managing_director}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 pl-8 sm:pl-0">
                {contactPhone ? (
                  <a href={`tel:${contactPhone}`} className="flex items-center gap-1 hover:text-purple-600 transition-colors">
                    <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">{contactPhone}</span>
                    <span className="sm:hidden">Volat</span>
                  </a>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Nezadáno</span>
                  </span>
                )}
                {contactEmail ? (
                  <a href={`mailto:${contactEmail}`} className="flex items-center gap-1 hover:text-purple-600 transition-colors truncate max-w-[160px] sm:max-w-[200px]">
                    <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{contactEmail}</span>
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

        {/* Attention Banner — only if issues */}
        {(() => {
          const latestClosure = closures.length > 0
            ? [...closures].sort((a, b) => b.period.localeCompare(a.period))[0]
            : null
          const closureComplete = latestClosure
            ? latestClosure.bank_statement_status !== 'missing' &&
              latestClosure.expense_documents_status !== 'missing' &&
              latestClosure.income_invoices_status !== 'missing'
            : false

          const attentionItems: Array<{ message: string; severity: 'high' | 'medium' | 'low' }> = []
          if (hubStats?.attention?.items) {
            attentionItems.push(...hubStats.attention.items)
          }
          if (latestClosure && !closureComplete) {
            const missingCategories: string[] = []
            if (latestClosure.bank_statement_status === 'missing') missingCategories.push('bankovní výpis')
            if (latestClosure.expense_documents_status === 'missing') missingCategories.push('výdaje')
            if (latestClosure.income_invoices_status === 'missing') missingCategories.push('příjmy')
            if (missingCategories.length > 0) {
              attentionItems.push({
                message: `Uzávěrka: chybí ${missingCategories.join(', ')}`,
                severity: 'high',
              })
            }
          }
          {
            const pendingDocs = hubStats?.documents?.pending || 0
            if (pendingDocs > 0) {
              attentionItems.push({
                message: `${pendingDocs} ${pendingDocs === 1 ? 'doklad' : pendingDocs < 5 ? 'doklady' : 'dokladů'} ke zpracování`,
                severity: 'medium',
              })
            }
          }
          if (attention.unread_messages > 0) {
            attentionItems.push({
              message: `${attention.unread_messages} nepřečten${attention.unread_messages > 1 ? 'ých zpráv' : 'á zpráva'}`,
              severity: 'medium',
            })
          }

          const activeTaskCount = tasks.filter(t =>
            t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress'
          ).length
          const tasksBadge = attention.active_tasks || activeTaskCount || 0

          const s = (val: number | undefined) => statsLoading ? '—' : (val ?? '—')

          return (
            <>
              {attentionItems.length > 0 && (
                <div className="flex items-start gap-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {attentionItems.slice(0, 5).map((item, i) => (
                      <span key={i} className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          item.severity === 'high' ? 'bg-red-500' : 'bg-amber-400'
                        }`} />
                        {item.message}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics Strip */}
              {(() => {
                const projectCount = tasks.filter(t => t.is_project && !['completed', 'cancelled'].includes(t.status)).length
                const docTotal = hubStats?.documents?.total
                const fileTotal = hubStats?.files?.total

                return (
                  <div className="flex items-center gap-6 flex-wrap py-1 w-fit mx-auto">
                    {/* Ukoly */}
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${tasksBadge > 0 ? 'text-purple-500' : 'text-green-500'}`} />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{tasksBadge}</span>
                      <span className="text-sm text-gray-500">{tasksBadge === 1 ? 'úkol' : tasksBadge >= 2 && tasksBadge <= 4 ? 'úkoly' : 'úkolů'}</span>
                    </div>
                    {/* Projekty */}
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <Briefcase className={`h-4 w-4 ${projectCount > 0 ? 'text-indigo-500' : 'text-gray-400'}`} />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{projectCount}</span>
                      <span className="text-sm text-gray-500">{czechPlural(projectCount, 'projekt', 'projekty', 'projektů')}</span>
                    </div>
                    {/* Soubory */}
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{s(fileTotal)}</span>
                      <span className="text-sm text-gray-500">{fileTotal === 1 ? 'soubor' : (fileTotal ?? 0) >= 2 && (fileTotal ?? 0) <= 4 ? 'soubory' : 'souborů'}</span>
                    </div>
                    {/* Doklady */}
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{s(docTotal)}</span>
                      <span className="text-sm text-gray-500">{docTotal === 1 ? 'doklad' : (docTotal ?? 0) >= 2 && (docTotal ?? 0) <= 4 ? 'doklady' : 'dokladů'}</span>
                      {hubStats?.documents?.pending ? (
                        <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 px-1.5 py-0">{hubStats.documents.pending} ke zprac.</Badge>
                      ) : null}
                    </div>
                    {/* Hodiny */}
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {hubStats?.work?.hours_this_month !== undefined ? `${hubStats.work.hours_this_month}h` : '—'}
                      </span>
                      <span className="text-sm text-gray-500">tento měsíc</span>
                    </div>
                    {/* Uzaverka */}
                    {latestClosure && (
                      <>
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                        <div className="flex items-center gap-2">
                          <Calendar className={`h-4 w-4 ${closureComplete ? 'text-green-500' : 'text-red-500'}`} />
                          <span className="text-sm text-gray-500">{formatPeriod(latestClosure.period)}</span>
                          {closureComplete ? (
                            <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 px-1.5 py-0">OK</Badge>
                          ) : (
                            <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 px-1.5 py-0">Chybí</Badge>
                          )}
                        </div>
                      </>
                    )}
                    {/* Health Score */}
                    {healthScore !== null && (
                      <>
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                        <div className="flex items-center gap-2">
                          <Activity className={`h-4 w-4 ${
                            healthScore >= 80 ? 'text-green-500' :
                            healthScore >= 60 ? 'text-blue-500' :
                            healthScore >= 40 ? 'text-yellow-500' : 'text-red-500'
                          }`} />
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{healthScore}</span>
                          <Badge className={`text-[10px] border-0 px-1.5 py-0 ${
                            healthScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            healthScore >= 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            healthScore >= 40 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : 'D'}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                )
              })()}
            </>
          )
        })()}

        {/* Onboarding banner */}
        {onboarding && company.status === 'onboarding' && (
          <OnboardingSection
            companyId={companyId}
            companyName={company.name}
            onboarding={onboarding}
            onOnboardingChange={setOnboarding}
          />
        )}

        {/* Sub-page content */}
        {children}
      </div>

      {/* Modals */}
      <EditClientModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        company={company}
        onSave={handleCompanySave}
      />

      <MessagePopupDialog
        open={messagePopupOpen}
        onOpenChange={setMessagePopupOpen}
        companyId={companyId}
        companyName={company.name}
      />

      {selectedClosure && (
        <UrgencyEmailModal
          open={urgencyModalOpen}
          onOpenChange={setUrgencyModalOpen}
          companyId={companyId}
          companyName={company.name}
          companyEmail={contactEmail || ''}
          period={currentPeriod}
          missingDocuments={[
            ...(selectedClosure.bank_statement_status === 'missing' ? ['bank_statement' as const] : []),
            ...(selectedClosure.expense_documents_status === 'missing' ? ['expense_documents' as const] : []),
            ...(selectedClosure.income_invoices_status === 'missing' ? ['income_invoices' as const] : []),
          ]}
        />
      )}
    </CompanyContext.Provider>
  )
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  const months = ['', 'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
  return `${months[parseInt(month)]} ${year}`
}
