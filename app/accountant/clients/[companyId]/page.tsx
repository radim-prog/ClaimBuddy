'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Plus,
  Calendar,
  User,
  Inbox,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Company = {
  id: string
  name: string
  group_name: string | null
  ico: string
  dic: string
  vat_payer: boolean
  vat_period: 'monthly' | 'quarterly' | null
  legal_form: string
  street: string
  city: string
  zip: string
  health_insurance_company: string | null
  has_employees: boolean
  employee_count: number
  data_box: { id: string; login?: string } | null
}

type MonthlyClosure = {
  id: string
  period: string
  status: string
  bank_statement_status: string
  expense_documents_status: string
  income_invoices_status: string
}

// Mapování zdravotních pojišťoven
const healthInsuranceLabels: Record<string, string> = {
  vzp: 'VZP (111)',
  vozp: 'VOZP (201)',
  cpzp: 'ČPZP (205)',
  ozp: 'OZP (207)',
  zpmv: 'ZP MV (211)',
  rbp: 'RBP (213)',
  zpma: 'ZP M-A (217)',
}

const monthNames = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
const monthNamesFull = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

export default function ClientDetailPage() {
  const params = useParams()
  const companyId = params.companyId as string

  const [company, setCompany] = useState<Company | null>(null)
  const [closures, setClosures] = useState<MonthlyClosure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Aktuální období
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() // 0-indexed
  const currentPeriod = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`

  useEffect(() => {
    fetchData()
  }, [companyId])

  async function fetchData() {
    try {
      const companyRes = await fetch(`/api/accountant/companies/${companyId}`)
      if (!companyRes.ok) throw new Error('Failed to fetch company')
      const companyData = await companyRes.json()
      setCompany(companyData.company)
      setClosures(companyData.closures || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Získat uzávěrku pro aktuální měsíc
  const currentClosure = useMemo(() => {
    return closures.find(c => c.period === currentPeriod)
  }, [closures, currentPeriod])

  // Získat uzávěrky pro aktuální rok, seřazené
  const yearClosures = useMemo(() => {
    return closures
      .filter(c => c.period.startsWith(String(currentYear)))
      .sort((a, b) => a.period.localeCompare(b.period))
  }, [closures, currentYear])

  // Zjistit stav měsíce
  const getMonthStatus = (closure: MonthlyClosure | undefined, monthIndex: number) => {
    // Budoucí měsíc
    if (monthIndex > currentMonth) return 'future'

    if (!closure) return 'missing'

    const statuses = [
      closure.bank_statement_status,
      closure.expense_documents_status,
      closure.income_invoices_status
    ]

    if (statuses.every(s => s === 'approved')) return 'complete'
    if (statuses.some(s => s === 'missing')) return 'missing'
    if (statuses.some(s => s === 'uploaded')) return 'uploaded'
    return 'unknown'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Načítám profil klienta...</p>
        </div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-sm text-red-700">Nepodařilo se načíst profil klienta: {error}</p>
      </div>
    )
  }

  // Mock kontaktní údaje (později z DB)
  const contactEmail = `kontakt@${company.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.cz`
  const contactPhone = '+420 777 123 456'

  return (
    <div className="max-w-5xl">
      {/* Navigation */}
      <div className="mb-4">
        <Link href="/accountant/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zpět na seznam klientů
          </Button>
        </Link>
      </div>

      {/* ============================================ */}
      {/* HLAVIČKA - Info o firmě */}
      {/* ============================================ */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Název a právní forma */}
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-8 w-8 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {company.group_name && (
                      <span className="text-purple-600">{company.group_name}</span>
                    )}
                    {company.group_name && ' – '}
                    {company.name}
                  </h1>
                  <p className="text-gray-600">
                    IČO: {company.ico}
                    {company.dic && <span className="ml-3">DIČ: {company.dic}</span>}
                  </p>
                </div>
              </div>

              {/* Adresa a kontakt */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{company.street}, {company.zip} {company.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{contactEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{contactPhone}</span>
                </div>
              </div>

              {/* Tagy/Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline">{company.legal_form}</Badge>

                {company.vat_payer ? (
                  <Badge className="bg-blue-100 text-blue-700">
                    Plátce DPH • {company.vat_period === 'monthly' ? 'Měsíční' : 'Kvartální'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">Neplátce DPH</Badge>
                )}

                {company.data_box && (
                  <Badge variant="outline" className="text-gray-600">
                    <Inbox className="h-3 w-3 mr-1" />
                    Datovka: {company.data_box.id}
                  </Badge>
                )}

                {company.has_employees && (
                  <Badge variant="outline" className="text-gray-600">
                    {company.employee_count} zaměstnanců
                  </Badge>
                )}

                {company.legal_form === 'OSVČ' && company.health_insurance_company && (
                  <Badge variant="outline" className="text-gray-500">
                    {healthInsuranceLabels[company.health_insurance_company] || company.health_insurance_company}
                  </Badge>
                )}
              </div>
            </div>

            {/* Tlačítko upravit */}
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Upravit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* AKTUÁLNÍ STAV - Co je potřeba */}
      {/* ============================================ */}
      <Card className="mb-6 border-2 border-purple-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Aktuální stav – {monthNamesFull[currentMonth]} {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentClosure ? (
            <div className="grid grid-cols-3 gap-4">
              {/* Výpis z banky */}
              <div className={`p-4 rounded-lg border-2 ${
                currentClosure.bank_statement_status === 'approved' ? 'bg-green-50 border-green-200' :
                currentClosure.bank_statement_status === 'uploaded' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Výpis z banky</span>
                  {currentClosure.bank_statement_status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : currentClosure.bank_statement_status === 'uploaded' ? (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className={`text-sm ${
                  currentClosure.bank_statement_status === 'approved' ? 'text-green-700' :
                  currentClosure.bank_statement_status === 'uploaded' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {currentClosure.bank_statement_status === 'approved' ? 'Schváleno ✓' :
                   currentClosure.bank_statement_status === 'uploaded' ? 'Čeká na schválení' :
                   'Chybí - klient nedodal'}
                </div>
              </div>

              {/* Nákladové doklady */}
              <div className={`p-4 rounded-lg border-2 ${
                currentClosure.expense_documents_status === 'approved' ? 'bg-green-50 border-green-200' :
                currentClosure.expense_documents_status === 'uploaded' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Nákladové doklady</span>
                  {currentClosure.expense_documents_status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : currentClosure.expense_documents_status === 'uploaded' ? (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className={`text-sm ${
                  currentClosure.expense_documents_status === 'approved' ? 'text-green-700' :
                  currentClosure.expense_documents_status === 'uploaded' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {currentClosure.expense_documents_status === 'approved' ? 'Schváleno ✓' :
                   currentClosure.expense_documents_status === 'uploaded' ? 'Čeká na schválení' :
                   'Chybí - klient nedodal'}
                </div>
              </div>

              {/* Příjmové faktury */}
              <div className={`p-4 rounded-lg border-2 ${
                currentClosure.income_invoices_status === 'approved' ? 'bg-green-50 border-green-200' :
                currentClosure.income_invoices_status === 'uploaded' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Příjmové faktury</span>
                  {currentClosure.income_invoices_status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : currentClosure.income_invoices_status === 'uploaded' ? (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className={`text-sm ${
                  currentClosure.income_invoices_status === 'approved' ? 'text-green-700' :
                  currentClosure.income_invoices_status === 'uploaded' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {currentClosure.income_invoices_status === 'approved' ? 'Schváleno ✓' :
                   currentClosure.income_invoices_status === 'uploaded' ? 'Čeká na schválení' :
                   'Chybí - klient nedodal'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Žádná data pro aktuální měsíc</p>
            </div>
          )}

          {/* Akce pro aktuální měsíc */}
          {currentClosure && (
            <div className="mt-4 pt-4 border-t flex gap-2">
              {(currentClosure.bank_statement_status === 'missing' ||
                currentClosure.expense_documents_status === 'missing' ||
                currentClosure.income_invoices_status === 'missing') && (
                <Button variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50">
                  <Mail className="h-4 w-4 mr-1" />
                  Urgovat klienta
                </Button>
              )}
              {(currentClosure.bank_statement_status === 'uploaded' ||
                currentClosure.expense_documents_status === 'uploaded' ||
                currentClosure.income_invoices_status === 'uploaded') && (
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Schválit dokumenty
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* ÚKOLY */}
      {/* ============================================ */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Úkoly u tohoto klienta
            </CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Nový úkol
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* TODO: Napojit na skutečný systém úkolů */}
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="mb-2">Zatím žádné úkoly</p>
            <p className="text-sm text-gray-400">
              Úkoly budou zobrazeny zde - kdo na čem pracuje, termíny, historie
            </p>
          </div>

          {/* Příklad jak by to mohlo vypadat (zakomentováno)
          <div className="space-y-3">
            <div className="p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">Daňová kontrola</div>
                  <div className="text-sm text-gray-500">Probíhá od 15.10.2025</div>
                </div>
                <Badge className="bg-orange-100 text-orange-700">Probíhá</Badge>
              </div>
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> Jana Svobodová
                </span>
                <span>Poslední aktivita: dnes</span>
              </div>
            </div>
          </div>
          */}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* PŘEHLED MĚSÍCŮ */}
      {/* ============================================ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Přehled měsíců {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2">
            {monthNames.map((month, index) => {
              const period = `${currentYear}-${String(index + 1).padStart(2, '0')}`
              const closure = yearClosures.find(c => c.period === period)
              const status = getMonthStatus(closure, index)

              const statusConfig = {
                complete: { bg: 'bg-green-500', text: 'text-white', icon: '✓' },
                uploaded: { bg: 'bg-yellow-400', text: 'text-yellow-900', icon: '⏳' },
                missing: { bg: 'bg-red-500', text: 'text-white', icon: '!' },
                future: { bg: 'bg-gray-100', text: 'text-gray-400', icon: '—' },
                unknown: { bg: 'bg-gray-200', text: 'text-gray-500', icon: '?' },
              }[status]

              const isCurrentMonth = index === currentMonth

              return (
                <div key={month} className="text-center">
                  <div
                    className={`
                      w-full aspect-square rounded-lg flex items-center justify-center
                      ${statusConfig.bg} ${statusConfig.text}
                      ${isCurrentMonth ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
                      ${status !== 'future' ? 'cursor-pointer hover:opacity-80' : ''}
                      transition-all
                    `}
                    title={`${monthNamesFull[index]} ${currentYear}`}
                  >
                    <span className="text-lg font-bold">{statusConfig.icon}</span>
                  </div>
                  <div className={`text-xs mt-1 ${isCurrentMonth ? 'font-bold text-purple-600' : 'text-gray-500'}`}>
                    {month}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500"></span> Hotovo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-400"></span> Čeká na schválení
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500"></span> Chybí podklady
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-100"></span> Budoucí
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
