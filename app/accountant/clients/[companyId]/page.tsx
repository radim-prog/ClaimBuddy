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
  Plus,
  Calendar,
  User,
  Inbox,
  Pencil,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Key,
  Car,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { EditClientModal } from '@/components/edit-client-modal'
import { EmployeesSection } from '@/components/employees-section'
import { UrgencyEmailModal } from '@/components/urgency-email-modal'
import { Employee } from '@/lib/types/employee'
import { getEmployeesByCompany } from '@/lib/mock-data'

type Company = {
  id: string
  name: string
  group_name: string | null
  ico: string
  dic: string | null
  vat_payer: boolean
  vat_period: 'monthly' | 'quarterly' | null
  legal_form: string
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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [showDataBoxPassword, setShowDataBoxPassword] = useState(false)
  const [urgencyModalOpen, setUrgencyModalOpen] = useState(false)

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

      // Načíst zaměstnance (v produkci by to bylo z API)
      const companyEmployees = getEmployeesByCompany(companyId)
      setEmployees(companyEmployees)
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

  // Získat uzávěrku pro vybraný měsíc
  const selectedPeriod = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}`
  const selectedClosure = useMemo(() => {
    return closures.find(c => c.period === selectedPeriod)
  }, [closures, selectedPeriod])

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

  // Kontaktní údaje - z company nebo fallback na mock
  const contactEmail = company.email || `kontakt@${company.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.cz`
  const contactPhone = company.phone || '+420 777 123 456'

  // Handler pro uložení změn z modalu
  const handleCompanySave = (updatedCompany: Company) => {
    setCompany(updatedCompany)
  }

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
          {/* Horní řádek: Název firmy + tlačítko Upravit */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {company.group_name && (
                    <span className="text-purple-600">{company.group_name}</span>
                  )}
                  {company.group_name && ' – '}
                  {company.name}
                </h1>
                <p className="text-gray-500 text-sm">{company.legal_form}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Upravit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Implementovat pohled klienta
                  window.open(`/client/companies/${companyId}`, '_blank')
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                Jako klient
              </Button>
            </div>
          </div>

          {/* Grid s kontaktními údaji - vždy na stejném místě */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100">
            {/* IČO */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">IČO</div>
              <div className="font-medium text-gray-900">{company.ico}</div>
            </div>

            {/* DIČ */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">DIČ</div>
              <div className="font-medium text-gray-900">{company.dic || '—'}</div>
            </div>

            {/* Telefon */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Telefon</div>
              <div className="font-medium text-gray-900 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {contactPhone}
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</div>
              <div className="font-medium text-gray-900 flex items-center gap-1 truncate">
                <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Adresa - vlastní řádek */}
          <div className="py-3 border-b border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Adresa</div>
            <div className="text-gray-900 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              {[company.street, company.zip, company.city].filter(Boolean).join(', ') || 'Adresa neuvedena'}
            </div>
          </div>

          {/* Tagy/Badges - jen informativní, bez hover efektů */}
          <div className="flex flex-wrap gap-2 pt-4">
            {company.vat_payer ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Plátce DPH • {company.vat_period === 'monthly' ? 'Měsíční' : 'Kvartální'}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Neplátce DPH
              </span>
            )}

            {company.data_box && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer">
                    <Inbox className="h-3 w-3 mr-1" />
                    Datovka: {company.data_box.id}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Key className="h-4 w-4 text-purple-600" />
                      Přístupové údaje do datovky
                    </div>

                    {/* ID datové schránky */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">ID datové schránky</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {company.data_box.id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            navigator.clipboard.writeText(company.data_box!.id)
                            toast.success('ID zkopírováno')
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Login */}
                    {company.data_box.login && (
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Přihlašovací jméno</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {company.data_box.login}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(company.data_box!.login!)
                              toast.success('Login zkopírován')
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Heslo */}
                    {company.data_box.password && (
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Heslo</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {showDataBoxPassword ? company.data_box.password : '••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setShowDataBoxPassword(!showDataBoxPassword)}
                          >
                            {showDataBoxPassword ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(company.data_box!.password!)
                              toast.success('Heslo zkopírováno')
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {!company.data_box.login && !company.data_box.password && (
                      <p className="text-xs text-gray-500 italic">
                        Přihlašovací údaje nejsou uloženy
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {company.has_employees && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <User className="h-3 w-3 mr-1" />
                {company.employee_count} zaměstnanců
              </span>
            )}

            {company.legal_form === 'OSVČ' && company.health_insurance_company && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {healthInsuranceLabels[company.health_insurance_company] || company.health_insurance_company}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* STAV UZÁVĚREK - S horizontálním menu měsíců */}
      {/* ============================================ */}
      <Card className="mb-6">
        <CardContent className="p-0">
          {/* Horizontální menu měsíců - hranaté tvary */}
          <div className="grid grid-cols-12 gap-1 p-2 border-b bg-gray-50">
            {monthNames.map((month, index) => {
              const period = `${currentYear}-${String(index + 1).padStart(2, '0')}`
              const closure = yearClosures.find(c => c.period === period)
              const status = getMonthStatus(closure, index)
              const isSelected = selectedMonth === index
              const isCurrentMonth = index === currentMonth

              // Barvy podle stavu
              const statusColors = {
                complete: 'bg-green-500 text-white',
                uploaded: 'bg-yellow-400 text-yellow-900',
                missing: 'bg-red-500 text-white',
                future: 'bg-gray-200 text-gray-400',
                unknown: 'bg-gray-300 text-gray-500',
              }

              const statusIcons = {
                complete: '✓',
                uploaded: '⏳',
                missing: '!',
                future: '—',
                unknown: '?',
              }

              return (
                <button
                  key={month}
                  onClick={() => index <= currentMonth && setSelectedMonth(index)}
                  disabled={index > currentMonth}
                  className={`
                    flex flex-col items-center py-1 transition-all
                    ${index > currentMonth ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                  `}
                >
                  {/* Hranatý indikátor stavu */}
                  <div className={`
                    w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold
                    ${statusColors[status]}
                    ${isSelected ? 'ring-2 ring-purple-600 ring-offset-1' : ''}
                    ${isCurrentMonth && !isSelected ? 'ring-1 ring-purple-400' : ''}
                    ${index <= currentMonth ? 'hover:opacity-80' : ''}
                  `}>
                    {statusIcons[status]}
                  </div>
                  <span className={`
                    text-[10px] mt-0.5
                    ${isSelected ? 'text-purple-600 font-bold' : 'text-gray-500'}
                    ${isCurrentMonth && !isSelected ? 'text-purple-500 font-medium' : ''}
                  `}>
                    {month}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Detail vybraného měsíce */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {monthNamesFull[selectedMonth]} {currentYear}
              </h3>
              {selectedMonth === currentMonth && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Aktuální měsíc
                </span>
              )}
            </div>

            {selectedClosure ? (
              <div className="grid grid-cols-3 gap-4">
                {/* Výpis z banky */}
                <div className={`p-4 rounded-lg border-2 ${
                  selectedClosure.bank_statement_status === 'approved' ? 'bg-green-50 border-green-200' :
                  selectedClosure.bank_statement_status === 'uploaded' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Výpis z banky</span>
                    {selectedClosure.bank_statement_status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : selectedClosure.bank_statement_status === 'uploaded' ? (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className={`text-sm ${
                    selectedClosure.bank_statement_status === 'approved' ? 'text-green-700' :
                    selectedClosure.bank_statement_status === 'uploaded' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {selectedClosure.bank_statement_status === 'approved' ? 'Schváleno' :
                     selectedClosure.bank_statement_status === 'uploaded' ? 'Čeká na schválení' :
                     'Chybí'}
                  </div>
                </div>

                {/* Nákladové doklady */}
                <div className={`p-4 rounded-lg border-2 ${
                  selectedClosure.expense_documents_status === 'approved' ? 'bg-green-50 border-green-200' :
                  selectedClosure.expense_documents_status === 'uploaded' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Nákladové doklady</span>
                    {selectedClosure.expense_documents_status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : selectedClosure.expense_documents_status === 'uploaded' ? (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className={`text-sm ${
                    selectedClosure.expense_documents_status === 'approved' ? 'text-green-700' :
                    selectedClosure.expense_documents_status === 'uploaded' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {selectedClosure.expense_documents_status === 'approved' ? 'Schváleno' :
                     selectedClosure.expense_documents_status === 'uploaded' ? 'Čeká na schválení' :
                     'Chybí'}
                  </div>
                </div>

                {/* Příjmové faktury */}
                <div className={`p-4 rounded-lg border-2 ${
                  selectedClosure.income_invoices_status === 'approved' ? 'bg-green-50 border-green-200' :
                  selectedClosure.income_invoices_status === 'uploaded' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Příjmové faktury</span>
                    {selectedClosure.income_invoices_status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : selectedClosure.income_invoices_status === 'uploaded' ? (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className={`text-sm ${
                    selectedClosure.income_invoices_status === 'approved' ? 'text-green-700' :
                    selectedClosure.income_invoices_status === 'uploaded' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {selectedClosure.income_invoices_status === 'approved' ? 'Schváleno' :
                     selectedClosure.income_invoices_status === 'uploaded' ? 'Čeká na schválení' :
                     'Chybí'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Žádná data pro {monthNamesFull[selectedMonth].toLowerCase()}</p>
              </div>
            )}

            {/* Akce pro vybraný měsíc */}
            {selectedClosure && (
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                {/* Nahrát dokumenty za klienta */}
                {(selectedClosure.bank_statement_status === 'missing' ||
                  selectedClosure.expense_documents_status === 'missing' ||
                  selectedClosure.income_invoices_status === 'missing') && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // TODO: Implementovat upload modal
                        alert('Upload dokumentů - bude implementováno')
                      }}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Nahrát dokumenty
                    </Button>
                    <Button
                      variant="outline"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      onClick={() => setUrgencyModalOpen(true)}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Urgovat klienta
                    </Button>
                  </>
                )}
                {(selectedClosure.bank_statement_status === 'uploaded' ||
                  selectedClosure.expense_documents_status === 'uploaded' ||
                  selectedClosure.income_invoices_status === 'uploaded') && (
                  <Button className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Schválit dokumenty
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Legenda */}
          <div className="px-4 pb-4 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500"></span> Hotovo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span> Ke schválení
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500"></span> Chybí
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-200"></span> Budoucí
            </span>
          </div>
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
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* ZAMĚSTNANCI */}
      {/* ============================================ */}
      {company.has_employees && (
        <div className="mb-6">
          <EmployeesSection
            companyId={companyId}
            employees={employees}
            onEmployeesChange={setEmployees}
          />
        </div>
      )}

      {/* ============================================ */}
      {/* MAJETEK FIRMY */}
      {/* ============================================ */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5 text-purple-600" />
              Majetek firmy
            </CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Přidat majetek
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* TODO: Napojit na skutečný systém evidence majetku */}
          <div className="text-center py-8 text-gray-500">
            <Car className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="mb-2">Zatím žádný evidovaný majetek</p>
            <p className="text-sm text-gray-400">
              Automobily, nemovitosti, stroje, vybavení a další dlouhodobý majetek
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal pro editaci klienta */}
      <EditClientModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        company={company}
        onSave={handleCompanySave}
      />

      {/* Modal pro urgování klienta */}
      {selectedClosure && (
        <UrgencyEmailModal
          open={urgencyModalOpen}
          onOpenChange={setUrgencyModalOpen}
          companyName={company.name}
          companyEmail={contactEmail}
          period={selectedPeriod}
          missingDocuments={[
            ...(selectedClosure.bank_statement_status === 'missing' ? ['bank_statement' as const] : []),
            ...(selectedClosure.expense_documents_status === 'missing' ? ['expense_documents' as const] : []),
            ...(selectedClosure.income_invoices_status === 'missing' ? ['income_invoices' as const] : []),
          ]}
        />
      )}
    </div>
  )
}
