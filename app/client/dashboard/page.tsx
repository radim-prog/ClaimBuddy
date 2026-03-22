'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Camera,
  MessageCircle,
  CalendarDays,
  Mail,
  ChevronRight,
  FileText,
  Briefcase,
  Car,
  Receipt,
  FileSignature,
  Bell,
  CheckCircle2,
  Circle,
  X,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { generateDeadlinesForCompany } from '@/lib/statutory-deadlines'
import { ScanOverlay } from '@/components/client/action-hub/scan-overlay'
import { TripOverlay } from '@/components/client/action-hub/trip-overlay'
import { InvoiceOverlay } from '@/components/client/action-hub/invoice-overlay'
import { BankUploadOverlay } from '@/components/client/action-hub/bank-upload-overlay'
import { QuickActionOverlay } from '@/components/client/action-hub/quick-action-overlay'
import { DashboardCharts } from '@/components/client/dashboard-charts'
import { CompanyTilesWidget } from '@/components/client/company-tiles-widget'

const monthNames = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
]

type ClosureStatus = 'missing' | 'uploaded' | 'approved' | 'reviewed' | 'skipped'
type OverlayType = 'scan' | 'invoice' | 'trip' | 'bank_upload' | null

function getMonthDotColor(closure: { bank_statement_status: ClosureStatus; expense_documents_status: ClosureStatus; income_invoices_status: ClosureStatus } | undefined, isFuture: boolean, isCurrent: boolean = false): string {
  if (isFuture) return 'bg-gray-300 dark:bg-gray-600'
  if (!closure) return isCurrent ? 'bg-orange-400' : 'bg-gray-300 dark:bg-gray-600'
  const statuses = [closure.bank_statement_status, closure.expense_documents_status, closure.income_invoices_status]
  if (statuses.some(s => s === 'missing')) return isCurrent ? 'bg-orange-400' : 'bg-red-500'
  if (statuses.some(s => s === 'uploaded')) return 'bg-yellow-500'
  if (statuses.every(s => s === 'approved' || s === 'reviewed' || s === 'skipped')) return 'bg-green-500'
  return 'bg-green-500'
}

export default function ClientDashboard() {
  const router = useRouter()
  const { userName, companies, closures, loading, error, selectedCompany, setSelectedCompanyId } = useClientUser()
  const [draftCount, setDraftCount] = useState(0)
  const [casesCount, setCasesCount] = useState(0)
  const [lastCaseActivity, setLastCaseActivity] = useState<string | null>(null)
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [checklistDismissed, setChecklistDismissed] = useState(true)
  const [recentMessages, setRecentMessages] = useState<Array<{
    id: string; subject: string; last_message_preview: string | null;
    last_message_at: string | null; unread_count: number; status: string;
  }>>([])

  // Load checklist state
  useEffect(() => {
    setChecklistDismissed(localStorage.getItem('onboarding-checklist-dismissed') === 'true')
  }, [])

  // Fetch draft count + cases
  useEffect(() => {
    fetch('/api/client/drafts')
      .then(r => r.json())
      .then(data => setDraftCount(data.count || 0))
      .catch(() => {})

    fetch('/api/client/cases')
      .then(r => r.json())
      .then(data => {
        const cases = data.cases || []
        const activeCases = cases.filter((c: { status: string }) => c.status !== 'completed' && c.status !== 'cancelled')
        setCasesCount(activeCases.length)
        if (activeCases.length > 0) {
          const sorted = [...activeCases].sort((a: { updated_at: string }, b: { updated_at: string }) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
          setLastCaseActivity(sorted[0].updated_at)
        }
      })
      .catch(() => {})
  }, [])

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Fetch messages when company changes
  useEffect(() => {
    if (!selectedCompany) return
    fetch(`/api/client/messages?company_id=${selectedCompany.id}`)
      .then(r => r.json())
      .then(data => setRecentMessages((data.conversations || []).slice(0, 3)))
      .catch(() => {})
  }, [selectedCompany])

  const companyClosures = useMemo(() => {
    if (!selectedCompany) return []
    return closures.filter(c => c.company_id === selectedCompany.id)
  }, [selectedCompany, closures])

  const deadlines = useMemo(() => {
    if (!selectedCompany) return []
    // Generate deadlines for the next 3 months to always show upcoming ones
    const allDeadlines: ReturnType<typeof generateDeadlinesForCompany> = []
    for (let offset = 0; offset < 3; offset++) {
      const d = new Date(currentYear, currentMonth + offset, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      allDeadlines.push(...generateDeadlinesForCompany(selectedCompany as any, y, m))
    }
    // Remove duplicates by id, filter only future deadlines, sort by date
    const seen = new Set<string>()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return allDeadlines
      .filter(dl => {
        if (seen.has(dl.id)) return false
        seen.add(dl.id)
        return new Date(dl.due_date) >= today
      })
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 5)
  }, [selectedCompany, currentYear, currentMonth])

  const yearMatrix = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const period = `${currentYear}-${String(month).padStart(2, '0')}`
      const closure = companyClosures.find(c => c.period === period)
      const isFuture = month > currentMonth + 1
      const isCurrent = month === currentMonth + 1
      return { month, period, closure, isFuture, isCurrent, name: monthNames[i] }
    })
  }, [companyClosures, currentYear, currentMonth])

  // Refresh draft count when scan overlay closes
  const handleScanClose = () => {
    setActiveOverlay(null)
    fetch('/api/client/drafts')
      .then(r => r.json())
      .then(data => setDraftCount(data.count || 0))
      .catch(() => {})
  }

  const handleQuickAction = (action: 'scan' | 'invoice' | 'trip') => {
    setShowQuickActions(false)
    setActiveOverlay(action)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || companies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          {error || 'Nemáte přiřazené žádné firmy. Kontaktujte svého účetního.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
              Dobrý den, {userName.split(' ')[0]}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {now.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* === ACTION ROW === */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <button
            className="action-btn h-12 flex items-center justify-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setActiveOverlay('scan')}
          >
            <Camera className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Nahrát</span> doklad
          </button>
          <button
            className="action-btn h-12 flex items-center justify-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setActiveOverlay('invoice')}
          >
            <Receipt className="h-4 w-4 flex-shrink-0" />
            Faktura
          </button>
          <button
            className="action-btn h-12 flex items-center justify-center gap-2 text-sm bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => setActiveOverlay('trip')}
          >
            <Car className="h-4 w-4 flex-shrink-0" />
            Jízda
          </button>
          <Link
            href="/client/messages"
            className="action-btn h-12 flex items-center justify-center gap-2 text-sm bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white"
          >
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            Zprávy
          </Link>
          <button
            className="action-btn h-12 flex items-center justify-center gap-2 text-sm bg-slate-500 hover:bg-slate-600 text-white"
            onClick={() => setActiveOverlay('bank_upload')}
          >
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Nahrát</span> výpis
          </button>
        </div>

        {/* Onboarding checklist */}
        {!checklistDismissed && selectedCompany && (() => {
          const hasDocuments = draftCount > 0
          const hasMessages = recentMessages.length > 0
          const hasProfile = !!(selectedCompany.name && selectedCompany.ico)
          const allDone = hasDocuments && hasMessages && hasProfile
          if (allDone) return null
          const items = [
            { done: hasDocuments, label: 'Nahrát první doklad', href: '/client/documents' },
            { done: hasMessages, label: 'Odeslat zprávu účetnímu', href: '/client/messages' },
            { done: hasProfile, label: 'Vyplnit profil firmy', href: '/client/account' },
          ]
          return (
            <Card className="rounded-2xl border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="py-4 px-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Začínáme</h3>
                  <button
                    onClick={() => {
                      setChecklistDismissed(true)
                      localStorage.setItem('onboarding-checklist-dismissed', 'true')
                    }}
                    className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 text-sm group"
                    >
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-blue-300 dark:text-blue-600 shrink-0" />
                      )}
                      <span className={item.done
                        ? 'text-green-700 dark:text-green-400 line-through'
                        : 'text-blue-800 dark:text-blue-200 group-hover:underline'
                      }>
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {/* Draft badge */}
        {draftCount > 0 && (
          <Card className="rounded-2xl border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 card-hover">
            <CardContent className="py-3 px-4">
              <Link href="/client/documents" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                    <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {draftCount} {draftCount === 1 ? 'nepotvrzený doklad' : draftCount < 5 ? 'nepotvrzené doklady' : 'nepotvrzených dokladů'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Company Tiles */}
        {companies.length > 1 && (
          <CompanyTilesWidget
            companies={companies}
            selectedCompanyId={selectedCompany?.id || ''}
            onSelectCompany={setSelectedCompanyId}
          />
        )}

        {/* Year Matrix + TaxImpact (merged) */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Přehled roku {currentYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
              {yearMatrix.map(({ month, period, closure, isFuture, isCurrent, name }) => (
                <button
                  key={month}
                  disabled={isFuture}
                  onClick={() => !isFuture && router.push(`/client/closures/${period}`)}
                  className={`
                    text-center p-2 rounded-lg transition-colors
                    ${!isFuture ? 'cursor-pointer hover:bg-primary/10' : ''}
                    ${month === currentMonth + 1
                      ? 'ring-2 ring-primary/50 bg-primary/5'
                      : 'bg-muted/50'
                    }
                    ${isFuture ? 'opacity-40' : ''}
                  `}
                  title={!isFuture && closure ? `${name}: Výpis ${closure.bank_statement_status}, Doklady ${closure.expense_documents_status}, Faktury ${closure.income_invoices_status}` : name}
                >
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                    {name.slice(0, 3)}
                  </div>
                  <div className={`
                    w-2.5 h-2.5 rounded-full mx-auto
                    ${getMonthDotColor(closure as any, isFuture, isCurrent)}
                  `} />
                </button>
              ))}
            </div>
            {selectedCompany && <TaxImpactInline companyId={selectedCompany.id} />}
            <details className="mt-3">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">Legenda barev</summary>
              <div className="flex flex-wrap items-start gap-x-5 gap-y-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Chybějící doklady</span>
                    <p className="text-[10px] leading-tight">Doklady nebyly nahrány</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Čeká na podklady</span>
                    <p className="text-[10px] leading-tight">Aktuální měsíc, ještě probíhá</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Nahráno dokladů</span>
                    <p className="text-[10px] leading-tight">Čeká na schválení účetním</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Schválené doklady</span>
                    <p className="text-[10px] leading-tight">Zkontrolováno a zpracováno</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Budoucí měsíce</span>
                    <p className="text-[10px] leading-tight">Ještě nenastaly</p>
                  </div>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* Active Requests Widget */}
        <ActiveRequestsWidget />

        {/* Cases Widget */}
        {casesCount > 0 && (
          <Card className="rounded-2xl border-purple-200 dark:border-purple-800 card-hover">
            <CardContent className="py-4 px-5">
              <Link href="/client/cases" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                    <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      Vaše případy
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {casesCount} {casesCount === 1 ? 'aktivní případ' : casesCount < 5 ? 'aktivní případy' : 'aktivních případů'}
                      {lastCaseActivity && (
                        <> &middot; Poslední aktivita {new Date(lastCaseActivity).toLocaleDateString('cs-CZ')}</>
                      )}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Reminders Widget */}
        <RemindersWidget />

        {/* Dohodari Widget */}
        <DohodariWidget />

        {/* Two column layout: Messages + Deadlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Messages Widget */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Zprávy
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/client/messages">
                    Zobrazit vše <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentMessages.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Zatím žádné zprávy od účetního</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentMessages.map(conv => (
                    <Link
                      key={conv.id}
                      href="/client/messages"
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative mt-0.5">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.subject}</p>
                        {conv.last_message_preview && (
                          <p className="text-xs text-muted-foreground truncate">{conv.last_message_preview}</p>
                        )}
                      </div>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(conv.last_message_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deadlines Widget */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Nadcházející termíny
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deadlines.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Žádné blížící se zákonné termíny</p>
                  <p className="text-xs mt-1">Termíny se zobrazí podle nastavení vaší firmy (DPH, zaměstnanci apod.)</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deadlines.map(deadline => (
                    <div key={deadline.id} className="flex items-start gap-3">
                      <div className="text-center min-w-[40px]">
                        <div className="text-lg font-bold font-display text-gray-900 dark:text-white">
                          {new Date(deadline.due_date).getDate()}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {monthNames[new Date(deadline.due_date).getMonth()]?.slice(0, 3)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {deadline.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {deadline.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Charts (collapsible) */}
        {selectedCompany && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground py-2">
              <BarChart3 className="h-4 w-4" />
              Finanční přehled
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
            </summary>
            <div className="mt-2">
              <DashboardCharts companyId={selectedCompany.id} />
            </div>
          </details>
        )}

        {/* Contact Card */}
        <Card className="rounded-2xl">
          <CardContent className="py-5 px-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vaše účetní</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedCompany?.accountant_name || 'Účetní OS tým'}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/client/messages">
                    <Mail className="mr-1 h-3.5 w-3.5" />
                    Napsat zprávu
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === QUICK ACTION OVERLAY === */}
      <QuickActionOverlay
        open={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        onAction={handleQuickAction}
      />

      {/* === OVERLAYS === */}
      {selectedCompany && (
        <>
          <ScanOverlay
            open={activeOverlay === 'scan'}
            companyId={selectedCompany.id}
            companies={companies}
            onClose={handleScanClose}
          />
          <TripOverlay
            open={activeOverlay === 'trip'}
            onClose={() => setActiveOverlay(null)}
          />
          <InvoiceOverlay
            open={activeOverlay === 'invoice'}
            companyId={selectedCompany.id}
            onClose={() => setActiveOverlay(null)}
          />
          <BankUploadOverlay
            open={activeOverlay === 'bank_upload'}
            companyId={selectedCompany.id}
            companies={companies}
            onClose={() => setActiveOverlay(null)}
          />
        </>
      )}
    </>
  )
}

function RemindersWidget() {
  const [reminders, setReminders] = useState<Array<{ id: string; type: string; message: string; escalation_level: number; created_at: string }>>([])

  useEffect(() => {
    fetch('/api/client/reminders?status=active&limit=5')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.reminders) setReminders(d.reminders) })
      .catch(() => {})
  }, [])

  if (reminders.length === 0) return null

  const latest = reminders[0]
  const isUrgent = latest.escalation_level >= 3

  return (
    <Card className={`rounded-2xl card-hover ${isUrgent ? 'border-red-200 dark:border-red-800' : 'border-orange-200 dark:border-orange-800'}`}>
      <CardContent className="py-4 px-5">
        <Link href="/client/reminders" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isUrgent ? 'bg-red-100 dark:bg-red-900/50' : 'bg-orange-100 dark:bg-orange-900/50'}`}>
              <Bell className={`h-5 w-5 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                Vaše připomínky
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {reminders.length} {reminders.length === 1 ? 'aktivní' : reminders.length < 5 ? 'aktivní' : 'aktivních'} &middot; {latest.message.slice(0, 60)}{latest.message.length > 60 ? '...' : ''}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  )
}

function TaxImpactInline({ companyId }: { companyId: string }) {
  const [data, setData] = useState<{ unmatched_count: number; total: number } | null>(null)
  useEffect(() => {
    fetch(`/api/client/bank-transactions/tax-impact-detail?company_id=${companyId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData({ unmatched_count: d.unmatched_count || 0, total: d.total?.total || 0 }) })
      .catch(() => {})
  }, [companyId])
  if (!data || data.unmatched_count === 0) return null
  return (
    <Link href="/client/documents" className="flex items-center gap-2 text-xs text-amber-600 hover:text-amber-700 mt-2">
      <AlertTriangle className="h-3.5 w-3.5" />
      {data.unmatched_count} nedoložených výdajů → +{data.total.toLocaleString('cs-CZ')} Kč na dani
    </Link>
  )
}

function ActiveRequestsWidget() {
  const [requests, setRequests] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/client/requests')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const active = (d?.requests || []).filter((r: any) => r.status !== 'resolved' && r.status !== 'closed')
        setRequests(active.slice(0, 3))
      })
      .catch(() => {})
  }, [])
  if (requests.length === 0) return null
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display flex items-center gap-2">
            Aktivní požadavky
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/client/messages">Zobrazit vše</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {requests.map((req: any) => (
            <div key={req.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{req.subject}</p>
                <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString('cs-CZ')}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DohodariWidget() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    fetch('/api/client/dohodari?status=active')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.dohody) setCount(d.dohody.length) })
      .catch(() => {})
  }, [])

  if (count === 0) return null

  return (
    <Card className="rounded-2xl border-indigo-200 dark:border-indigo-800 card-hover">
      <CardContent className="py-4 px-5">
        <Link href="/client/dohodari" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
              <FileSignature className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">Vaše dohody</p>
              <p className="text-xs text-muted-foreground">
                {count} {count === 1 ? 'aktivní dohoda' : count < 5 ? 'aktivní dohody' : 'aktivních dohod'}{' '}
                <span title="Dohoda o provedení práce / Dohoda o pracovní činnosti" className="underline decoration-dotted cursor-help">(DPP/DPČ)</span>
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  )
}
