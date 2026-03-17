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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { generateDeadlinesForCompany } from '@/lib/statutory-deadlines'
import { TaxOverviewWidget } from '@/components/client/tax-overview-widget'
import { ScanOverlay } from '@/components/client/action-hub/scan-overlay'
import { TripOverlay } from '@/components/client/action-hub/trip-overlay'
import { InvoiceOverlay } from '@/components/client/action-hub/invoice-overlay'
import { BankUploadOverlay } from '@/components/client/action-hub/bank-upload-overlay'
import { QuickActionOverlay } from '@/components/client/action-hub/quick-action-overlay'
import { DashboardCharts } from '@/components/client/dashboard-charts'

const monthNames = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
]

type ClosureStatus = 'missing' | 'uploaded' | 'approved' | 'reviewed' | 'skipped'
type OverlayType = 'scan' | 'invoice' | 'trip' | 'bank_upload' | null

function getMonthDotColor(closure: { bank_statement_status: ClosureStatus; expense_documents_status: ClosureStatus; income_invoices_status: ClosureStatus } | undefined, isFuture: boolean): string {
  if (isFuture || !closure) return 'bg-gray-300 dark:bg-gray-600'
  const statuses = [closure.bank_statement_status, closure.expense_documents_status, closure.income_invoices_status]
  if (statuses.some(s => s === 'missing')) return 'bg-red-500'
  if (statuses.some(s => s === 'uploaded')) return 'bg-yellow-500'
  if (statuses.every(s => s === 'approved' || s === 'reviewed' || s === 'skipped')) return 'bg-green-500'
  return 'bg-green-500'
}

export default function ClientDashboard() {
  const router = useRouter()
  const { userName, companies, closures, loading, error, selectedCompany } = useClientUser()
  const [draftCount, setDraftCount] = useState(0)
  const [casesCount, setCasesCount] = useState(0)
  const [lastCaseActivity, setLastCaseActivity] = useState<string | null>(null)
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [recentMessages, setRecentMessages] = useState<Array<{
    id: string; subject: string; last_message_preview: string | null;
    last_message_at: string | null; unread_count: number; status: string;
  }>>([])

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
      return { month, period, closure, isFuture, name: monthNames[i] }
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
          <button
            className="action-btn h-12 flex items-center justify-center gap-2 text-sm bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white"
            onClick={() => router.push('/client/messages')}
          >
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            Zprávy
          </button>
          <button
            className="action-btn h-12 flex items-center justify-center gap-2 text-sm bg-slate-500 hover:bg-slate-600 text-white"
            onClick={() => setActiveOverlay('bank_upload')}
          >
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Nahrát</span> výpis
          </button>
        </div>

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

        {/* Year Matrix */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Přehled roku {currentYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
              {yearMatrix.map(({ month, period, closure, isFuture, name }) => (
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
                    ${getMonthDotColor(closure as any, isFuture)}
                  `} />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-start gap-x-5 gap-y-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-start gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Chybějící doklady</span>
                  <p className="text-[10px] leading-tight">Doklady nebyly nahrány</p>
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
          </CardContent>
        </Card>

        {/* Tax Overview Widget */}
        {selectedCompany && <TaxOverviewWidget companyId={selectedCompany.id} closures={companyClosures} />}

        {/* Dashboard Charts */}
        {selectedCompany && <DashboardCharts companyId={selectedCompany.id} />}

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
                      Vaše spisy
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {casesCount} {casesCount === 1 ? 'aktivní spis' : casesCount < 5 ? 'aktivní spisy' : 'aktivních spisů'}
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

        {/* Contact Card */}
        <Card className="rounded-2xl">
          <CardContent className="py-5 px-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vaše účetní</p>
                <p className="font-semibold text-gray-900 dark:text-white">{'Klient'}</p>
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
                {count} {count === 1 ? 'aktivní dohoda' : count < 5 ? 'aktivní dohody' : 'aktivních dohod'} (DPP/DPČ)
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  )
}
