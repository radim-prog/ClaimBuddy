'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Camera,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageCircle,
  CalendarDays,
  Mail,
  ChevronRight,
  FileText,
  Briefcase,
  Car,
  Receipt,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { generateDeadlinesForCompany } from '@/lib/statutory-deadlines'
import { TaxImpactSummary } from '@/components/client/tax-impact-summary'
import { ActionTile } from '@/components/client/action-hub/action-tile'
import { ScanOverlay } from '@/components/client/action-hub/scan-overlay'
import { InvoiceOverlay } from '@/components/client/action-hub/invoice-overlay'
import { TripOverlay } from '@/components/client/action-hub/trip-overlay'

const monthNames = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
]

type ClosureStatus = 'missing' | 'uploaded' | 'approved'
type OverlayType = 'scan' | 'invoice' | 'trip' | null

function getOverallStatus(closure: { bank_statement_status: ClosureStatus; expense_documents_status: ClosureStatus; income_invoices_status: ClosureStatus }): 'action' | 'waiting' | 'ok' {
  const statuses = [closure.bank_statement_status, closure.expense_documents_status, closure.income_invoices_status]
  if (statuses.some(s => s === 'missing')) return 'action'
  if (statuses.some(s => s === 'uploaded')) return 'waiting'
  return 'ok'
}

function getMonthDotColor(closure: { bank_statement_status: ClosureStatus; expense_documents_status: ClosureStatus; income_invoices_status: ClosureStatus } | undefined, isFuture: boolean): string {
  if (isFuture || !closure) return 'bg-gray-300 dark:bg-gray-600'
  const status = getOverallStatus(closure)
  if (status === 'action') return 'bg-red-500'
  if (status === 'waiting') return 'bg-yellow-500'
  return 'bg-green-500'
}

export default function ClientDashboard() {
  const { userName, companies, closures, loading, error } = useClientUser()
  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0)
  const [draftCount, setDraftCount] = useState(0)
  const [casesCount, setCasesCount] = useState(0)
  const [lastCaseActivity, setLastCaseActivity] = useState<string | null>(null)
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>(null)

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
  const currentPeriod = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`

  const selectedCompany = companies[selectedCompanyIndex]

  const companyClosures = useMemo(() => {
    if (!selectedCompany) return []
    return closures.filter(c => c.company_id === selectedCompany.id)
  }, [selectedCompany, closures])

  const currentClosure = companyClosures.find(c => c.period === currentPeriod)
  const currentStatus = currentClosure ? getOverallStatus(currentClosure as any) : 'action'

  const missingDocs = useMemo(() => {
    if (!currentClosure) return ['Výpis z účtu', 'Nákladové doklady', 'Příjmové faktury']
    const missing: string[] = []
    if ((currentClosure as any).bank_statement_status === 'missing') missing.push('Výpis z účtu')
    if ((currentClosure as any).expense_documents_status === 'missing') missing.push('Nákladové doklady')
    if ((currentClosure as any).income_invoices_status === 'missing') missing.push('Příjmové faktury')
    return missing
  }, [currentClosure])

  const deadlines = useMemo(() => {
    if (!selectedCompany) return []
    return generateDeadlinesForCompany(
      selectedCompany as any,
      currentYear,
      currentMonth + 1
    ).slice(0, 3)
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
    // Refresh draft count
    fetch('/api/client/drafts')
      .then(r => r.json())
      .then(data => setDraftCount(data.count || 0))
      .catch(() => {})
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
            Dobrý den, {userName.split(' ')[0]}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {now.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Multi-company tabs */}
        {companies.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {companies.map((company, index) => (
              <button
                key={company.id}
                onClick={() => setSelectedCompanyIndex(index)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${index === selectedCompanyIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                {company.name}
              </button>
            ))}
          </div>
        )}

        {/* === ACTION HUB === */}
        <div className="space-y-3">
          {/* Primary tile: Scan */}
          <ActionTile
            icon={Camera}
            label="Nahrát doklad"
            subtitle="Vyfotit nebo nahrát"
            badge={draftCount}
            variant="primary"
            color="blue"
            onClick={() => setActiveOverlay('scan')}
          />

          {/* Secondary tiles: Invoice + Trip */}
          <div className="grid grid-cols-2 gap-3">
            <ActionTile
              icon={Receipt}
              label="Vystavit fakturu"
              variant="secondary"
              color="green"
              onClick={() => setActiveOverlay('invoice')}
            />
            <ActionTile
              icon={Car}
              label="Zapsat jízdu"
              variant="secondary"
              color="amber"
              onClick={() => setActiveOverlay('trip')}
            />
          </div>
        </div>

        {/* Draft badge */}
        {draftCount > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 card-hover">
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

        {/* Current Month Card - Adaptive */}
        {currentStatus === 'action' && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold font-display text-red-900 dark:text-red-100">
                    {monthNames[currentMonth]} {currentYear} — Chybí podklady
                  </h2>
                  <ul className="mt-2 space-y-1">
                    {missingDocs.map(doc => (
                      <li key={doc} className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-4 bg-red-600 hover:bg-red-700"
                    onClick={() => setActiveOverlay('scan')}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Nahrát doklady
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStatus === 'waiting' && (
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold font-display text-yellow-900 dark:text-yellow-100">
                    {monthNames[currentMonth]} {currentYear} — Zpracovává se
                  </h2>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    Vaše podklady účetní zpracovává. Není potřeba nic dělat.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStatus === 'ok' && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold font-display text-green-900 dark:text-green-100">
                    {monthNames[currentMonth]} {currentYear} — Vše v pořádku
                  </h2>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    Všechny doklady jsou zpracované.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Year Matrix */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Přehled roku {currentYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
              {yearMatrix.map(({ month, closure, isFuture, name }) => (
                <div
                  key={month}
                  className={`
                    text-center p-2 rounded-lg transition-colors
                    ${month === currentMonth + 1
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'bg-gray-50 dark:bg-gray-800'
                    }
                    ${isFuture ? 'opacity-40' : ''}
                  `}
                >
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                    {name.slice(0, 3)}
                  </div>
                  <div className={`
                    w-3 h-3 rounded-full mx-auto
                    ${getMonthDotColor(closure as any, isFuture)}
                  `} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Chybí</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Nahráno</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Schváleno</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" /> Budoucí</span>
            </div>
          </CardContent>
        </Card>

        {/* Cases Widget */}
        {casesCount > 0 && (
          <Card className="border-purple-200 dark:border-purple-800 card-hover">
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

        {/* Tax Impact Card */}
        {selectedCompany && <TaxImpactSummary companyId={selectedCompany.id} />}

        {/* Two column layout: Messages + Deadlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Messages Widget */}
          <Card>
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
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Zatím žádné zprávy od účetního</p>
              </div>
            </CardContent>
          </Card>

          {/* Deadlines Widget */}
          <Card>
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
                  <p className="text-sm">Žádné blížící se termíny</p>
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
        <Card>
          <CardContent className="pt-6">
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

      {/* === OVERLAYS === */}
      {selectedCompany && (
        <>
          <ScanOverlay
            open={activeOverlay === 'scan'}
            companyId={selectedCompany.id}
            companies={companies}
            onClose={handleScanClose}
          />
          <InvoiceOverlay
            open={activeOverlay === 'invoice'}
            companyId={selectedCompany.id}
            onClose={() => setActiveOverlay(null)}
          />
          <TripOverlay
            open={activeOverlay === 'trip'}
            onClose={() => setActiveOverlay(null)}
          />
        </>
      )}
    </>
  )
}
