'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Users,
  Shield,
  CalendarDays,
  MessageCircle,
  ClipboardList,
  Sparkles,
  Receipt,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { EditClientModal } from '@/components/edit-client-modal'
import { ClientDetailAlertBar } from '@/components/client-detail-alert-bar'
import { ClosureDetailModal } from '@/components/closure-detail-modal'
import { EmployeesSection } from '@/components/employees-section'
import { AssetsSection } from '@/components/assets-section'
import { InsuranceSection } from '@/components/insurance-section'
import { AnniversaryCalendar } from '@/components/anniversary-calendar'
import { UrgencyEmailModal } from '@/components/urgency-email-modal'
import { CollapsibleSection } from '@/components/collapsible-section'
import { SectionNav, clientDetailNavItems } from '@/components/section-nav'
import { AccountantMessagesSection } from '@/components/accountant/messages-section'
import { CompanyReports } from '@/components/company/company-reports'
import { AccountantTasksSection } from '@/components/accountant/tasks-section'
import { AccountantDeadlineCalendar } from '@/components/accountant/deadline-calendar'
import { OnboardingSection } from '@/components/onboarding-section'
import { Employee } from '@/lib/types/employee'
import { Asset } from '@/lib/types/asset'
import { Insurance } from '@/lib/types/insurance'
import { ClientOnboarding } from '@/lib/types/onboarding'
import { Task, getAssetsByCompany, getInsurancesByCompany, getTasksByCompany, mockCompanies, getCompanyReliabilityScore, getReliabilityLabel, getReliabilityEmoji } from '@/lib/mock-data'
import type { VatReturn } from '@/lib/types/vat'
import { getVatReturnTypeLabel, getVatStatusLabel, getVatStatusColor } from '@/lib/types/vat'

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

type StatusType = 'missing' | 'uploaded' | 'approved'

type MonthlyClosure = {
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
  const router = useRouter()
  const companyId = params.companyId as string

  const [company, setCompany] = useState<Company | null>(null)
  const [closures, setClosures] = useState<MonthlyClosure[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [insurances, setInsurances] = useState<Insurance[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [onboarding, setOnboarding] = useState<ClientOnboarding | null>(null)
  const [vatReturns, setVatReturns] = useState<VatReturn[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [showDataBoxPassword, setShowDataBoxPassword] = useState(false)
  const [urgencyModalOpen, setUrgencyModalOpen] = useState(false)
  const [closureModalOpen, setClosureModalOpen] = useState(false)
  const [closureModalData, setClosureModalData] = useState<MonthlyClosure | null>(null)

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

      // Fetch all companies for alert bar navigation
      const companiesRes = await fetch('/api/accountant/companies')
      if (companiesRes.ok) {
        const companiesData = await companiesRes.json()
        setCompanies(companiesData.companies || [])
      }

      // Načíst zaměstnance (v produkci by to bylo z API)
      const companyEmployees: Employee[] = [] // TODO: fetch from Supabase
      setEmployees(companyEmployees)

      // Načíst majetek (v produkci by to bylo z API)
      const companyAssets = getAssetsByCompany(companyId)
      setAssets(companyAssets)

      // Načíst pojištění (v produkci by to bylo z API)
      const companyInsurances = getInsurancesByCompany(companyId)
      setInsurances(companyInsurances)

      // Načíst úkoly (v produkci by to bylo z API)
      const companyTasks = getTasksByCompany(companyId)
      setTasks(companyTasks)

      // Načíst DPH data
      const companyVatReturns: VatReturn[] = [] // TODO: fetch from Supabase vat-store
      setVatReturns(companyVatReturns)

      // Načíst onboarding data (v produkci by to bylo z API)
      const mockCompany = mockCompanies.find(c => c.id === companyId)
      if (mockCompany?.onboarding) {
        setOnboarding(mockCompany.onboarding)
      }
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

  // Navigation items with dynamic badges
  const navItems = useMemo(() => {
    const activeTasks = tasks.filter(t =>
      t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress'
    ).length

    type NavItem = { id: string; label: string; icon: typeof Building2; badge?: number }

    const items: NavItem[] = [
      { id: 'info', label: 'Info o firmě', icon: Building2 },
    ]

    // Add onboarding section if client has onboarding data
    if (onboarding) {
      items.push({
        id: 'onboarding',
        label: 'Onboarding',
        icon: Sparkles,
      })
    }

    items.push(
      { id: 'closures', label: 'Uzávěrky', icon: Calendar },
    )

    // DPH section only for VAT payers
    if (company?.vat_payer) {
      items.push({ id: 'dph', label: 'DPH', icon: Receipt })
    }

    items.push(
      { id: 'tasks', label: 'Úkoly', icon: ClipboardList, badge: activeTasks > 0 ? activeTasks : undefined },
      { id: 'messages', label: 'Zprávy', icon: MessageCircle },
      { id: 'employees', label: 'Zaměstnanci', icon: Users, badge: employees.length > 0 ? employees.length : undefined },
      { id: 'assets', label: 'Majetek', icon: Car, badge: assets.length > 0 ? assets.length : undefined },
      { id: 'insurance', label: 'Pojištění', icon: Shield, badge: insurances.length > 0 ? insurances.length : undefined },
      { id: 'deadlines', label: 'Termíny', icon: CalendarDays },
    )

    return items
  }, [tasks, employees, assets, insurances, onboarding, company])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Načítám profil klienta...</p>
        </div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
        <p className="text-sm text-red-700 dark:text-red-400">Nepodařilo se načíst profil klienta: {error}</p>
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

  // Handler pro otevření closure modalu
  const handleClosureClick = (closure: MonthlyClosure) => {
    setClosureModalData(closure)
    setClosureModalOpen(true)
  }

  // Handler pro uložení closure změn
  const handleClosureSave = (updated: any) => {
    setClosures(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <div className="w-48 flex-shrink-0 hidden lg:block">
        <SectionNav items={navItems} />
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl space-y-6">
        {/* Alert Bar - prominent at top */}
        <ClientDetailAlertBar
          companyId={companyId}
          companies={companies.length > 0 ? companies : [company].filter(Boolean) as Company[]}
          closures={closures}
          deadlines={tasks.map(t => ({
            id: t.id,
            title: t.title,
            dueDate: t.due_date || new Date().toISOString(),
            type: t.status === 'pending' || t.status === 'clarifying' ? 'urgent' : 'warning' as const,
            companyId: t.company_id || companyId,
            companyName: company.name,
            description: t.description,
            assignedTo: t.assigned_to,
          }))}
          variant="card"
        />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/accountant/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zpět na seznam klientů
            </Button>
          </Link>
          <div className="flex gap-2">
            <Link href={`/accountant/extraction?company=${companyId}`}>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-1" />
                Vytěžování
              </Button>
            </Link>
            <Link href={`/accountant/annual-closing?company=${companyId}`}>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Roční uzávěrka
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              Upravit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(`/client/companies/${companyId}`, '_blank')
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Jako klient
            </Button>
          </div>
        </div>

        {/* ============================================ */}
        {/* HLAVIČKA - Info o firmě */}
        {/* ============================================ */}
        <Card id="info" className="scroll-mt-4">
          <CardContent className="pt-6">
            {/* Horní řádek: Název firmy */}
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {company.group_name && (
                    <span className="text-purple-600">{company.group_name}</span>
                  )}
                  {company.group_name && ' – '}
                  {company.name}
                  {/* Status badges removed - now shown in ClientDetailAlertBar */}
                </h1>
                <div className="flex items-center gap-2">
                  {company.legal_form === 'OSVČ' ? (
                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                      FO
                    </Badge>
                  ) : company.legal_form === 's.r.o.' ? (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                      s.r.o.
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {company.legal_form}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Grid s kontaktními údaji */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y dark:border-gray-700 border-gray-100 dark:border-gray-700">
              <div>
                <div className="text-xs text-gray-400 dark:text-gray-400 uppercase tracking-wide mb-1">IČO</div>
                <div className="font-medium text-gray-900 dark:text-white">{company.ico}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 dark:text-gray-400 uppercase tracking-wide mb-1">DIČ</div>
                <div className="font-medium text-gray-900 dark:text-white">{company.dic || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 dark:text-gray-400 uppercase tracking-wide mb-1">Telefon</div>
                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {contactPhone}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 dark:text-gray-400 uppercase tracking-wide mb-1">Email</div>
                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1 truncate">
                  <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-400 flex-shrink-0" />
                  <span className="truncate">{contactEmail}</span>
                </div>
              </div>
            </div>

            {/* Adresa */}
            <div className="py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="text-xs text-gray-400 dark:text-gray-400 uppercase tracking-wide mb-1">Adresa</div>
              <div className="text-gray-900 dark:text-white flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {[company.street, company.zip, company.city].filter(Boolean).join(', ') || 'Adresa neuvedena'}
              </div>
            </div>

            {/* Tagy/Badges */}
            <div className="flex flex-wrap gap-2 pt-4">
              {company.vat_payer ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  Plátce DPH • {company.vat_period === 'monthly' ? 'Měsíční' : 'Kvartální'}
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  Neplátce DPH
                </span>
              )}

              {company.data_box && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors cursor-pointer">
                      <Inbox className="h-3 w-3 mr-1" />
                      Datovka: {company.data_box.id}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                        <Key className="h-4 w-4 text-purple-600" />
                        Přístupové údaje do datovky
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 dark:text-gray-400">ID datové schránky</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
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

                      {company.data_box.login && (
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Přihlašovací jméno</label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
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

                      {company.data_box.password && (
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Heslo</label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                          Přihlašovací údaje nejsou uloženy
                        </p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {company.has_employees && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <User className="h-3 w-3 mr-1" />
                  {company.employee_count} zaměstnanců
                </span>
              )}

              {company.legal_form === 'OSVČ' && company.health_insurance_company && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {healthInsuranceLabels[company.health_insurance_company] || company.health_insurance_company}
                </span>
              )}

              {/* Reliability Score Badge */}
              {(() => {
                const score = getCompanyReliabilityScore(companyId)
                const label = getReliabilityLabel(score)
                const emoji = getReliabilityEmoji(score)
                const bgColor = score === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                               score === 1 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                               score === 2 ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                               'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                return (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}
                        title="Spolehlivost klienta při dodávání podkladů">
                    {emoji} {label}
                  </span>
                )
              })()}
            </div>
          </CardContent>
        </Card>

        {/* ============================================ */}
        {/* ONBOARDING (pokud existuje) */}
        {/* ============================================ */}
        {onboarding && (
          <div id="onboarding" className="scroll-mt-4">
            <OnboardingSection
              companyId={companyId}
              companyName={company.name}
              onboarding={onboarding}
              onOnboardingChange={setOnboarding}
            />
          </div>
        )}

        {/* ============================================ */}
        {/* STAV UZÁVĚREK */}
        {/* ============================================ */}
        <CollapsibleSection
          id="closures"
          title="Stav uzávěrek"
          icon={Calendar}
          defaultOpen={true}
        >
          {/* Horizontální menu měsíců */}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1 p-2 mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            {monthNames.map((month, index) => {
              const period = `${currentYear}-${String(index + 1).padStart(2, '0')}`
              const closure = yearClosures.find(c => c.period === period)
              const status = getMonthStatus(closure, index)
              const isSelected = selectedMonth === index
              const isCurrentMonth = index === currentMonth

              const statusColors = {
                complete: 'bg-green-500 text-white',
                uploaded: 'bg-yellow-400 text-yellow-900',
                missing: 'bg-red-500 text-white',
                future: 'bg-gray-200 text-gray-400',
                unknown: 'bg-gray-300 text-gray-500 dark:text-gray-400',
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
                  onClick={() => {
                    if (index > currentMonth) return
                    setSelectedMonth(index)
                    if (closure) handleClosureClick(closure)
                  }}
                  disabled={index > currentMonth}
                  className={`
                    flex flex-col items-center py-1 transition-all
                    ${index > currentMonth ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                  `}
                >
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
                    ${isSelected ? 'text-purple-600 font-bold' : 'text-gray-500 dark:text-gray-400'}
                    ${isCurrentMonth && !isSelected ? 'text-purple-500 font-medium' : ''}
                  `}>
                    {month}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Detail vybraného měsíce */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {monthNamesFull[selectedMonth]} {currentYear}
              </h3>
              {selectedMonth === currentMonth && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                  Aktuální měsíc
                </span>
              )}
            </div>

            {selectedClosure ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Výpis z banky */}
                <div className={`p-4 rounded-lg border-2 ${
                  selectedClosure.bank_statement_status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border-green-200' :
                  selectedClosure.bank_statement_status === 'uploaded' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' :
                  'bg-red-50 dark:bg-red-900/20 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Výpis z banky</span>
                    {selectedClosure.bank_statement_status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : selectedClosure.bank_statement_status === 'uploaded' ? (
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className={`text-sm ${
                    selectedClosure.bank_statement_status === 'approved' ? 'text-green-700 dark:text-green-400' :
                    selectedClosure.bank_statement_status === 'uploaded' ? 'text-yellow-700 dark:text-yellow-400' :
                    'text-red-700 dark:text-red-400'
                  }`}>
                    {selectedClosure.bank_statement_status === 'approved' ? 'Schváleno' :
                     selectedClosure.bank_statement_status === 'uploaded' ? 'Čeká na schválení' :
                     'Chybí'}
                  </div>
                </div>

                {/* Nákladové doklady */}
                <div className={`p-4 rounded-lg border-2 ${
                  selectedClosure.expense_documents_status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border-green-200' :
                  selectedClosure.expense_documents_status === 'uploaded' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' :
                  'bg-red-50 dark:bg-red-900/20 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Nákladové doklady</span>
                    {selectedClosure.expense_documents_status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : selectedClosure.expense_documents_status === 'uploaded' ? (
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className={`text-sm ${
                    selectedClosure.expense_documents_status === 'approved' ? 'text-green-700 dark:text-green-400' :
                    selectedClosure.expense_documents_status === 'uploaded' ? 'text-yellow-700 dark:text-yellow-400' :
                    'text-red-700 dark:text-red-400'
                  }`}>
                    {selectedClosure.expense_documents_status === 'approved' ? 'Schváleno' :
                     selectedClosure.expense_documents_status === 'uploaded' ? 'Čeká na schválení' :
                     'Chybí'}
                  </div>
                </div>

                {/* Příjmové faktury */}
                <div className={`p-4 rounded-lg border-2 ${
                  selectedClosure.income_invoices_status === 'approved' ? 'bg-green-50 dark:bg-green-900/20 border-green-200' :
                  selectedClosure.income_invoices_status === 'uploaded' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' :
                  'bg-red-50 dark:bg-red-900/20 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Příjmové faktury</span>
                    {selectedClosure.income_invoices_status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : selectedClosure.income_invoices_status === 'uploaded' ? (
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className={`text-sm ${
                    selectedClosure.income_invoices_status === 'approved' ? 'text-green-700 dark:text-green-400' :
                    selectedClosure.income_invoices_status === 'uploaded' ? 'text-yellow-700 dark:text-yellow-400' :
                    'text-red-700 dark:text-red-400'
                  }`}>
                    {selectedClosure.income_invoices_status === 'approved' ? 'Schváleno' :
                     selectedClosure.income_invoices_status === 'uploaded' ? 'Čeká na schválení' :
                     'Chybí'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Žádná data pro {monthNamesFull[selectedMonth].toLowerCase()}</p>
              </div>
            )}

            {/* Akce pro vybraný měsíc */}
            {selectedClosure && (
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                {(selectedClosure.bank_statement_status === 'missing' ||
                  selectedClosure.expense_documents_status === 'missing' ||
                  selectedClosure.income_invoices_status === 'missing') && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push(`/client/upload?company=${companyId}&period=${selectedPeriod}`)
                      }}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Nahrát dokumenty
                    </Button>
                    <Button
                      variant="outline"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:bg-orange-900/20"
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

            {/* Legenda */}
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
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
          </div>
        </CollapsibleSection>

        {/* ============================================ */}
        {/* DPH (jen pro plátce) */}
        {/* ============================================ */}
        {company.vat_payer && vatReturns.length > 0 && (
          <CollapsibleSection
            id="dph"
            title="DPH"
            icon={Receipt}
            badge={
              vatReturns.filter(v => v.status === 'not_filed').length > 0 ? (
                <Badge variant="secondary" className="ml-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  {vatReturns.filter(v => v.status === 'not_filed').length} nepodáno
                </Badge>
              ) : undefined
            }
            defaultOpen={false}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Období</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Typ</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Stav</th>
                    <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Částka</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Podáno</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Zaplaceno</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Group by period and sort descending
                    const periods = [...new Set(vatReturns.map(v => v.period))].sort((a, b) => b.localeCompare(a))

                    return periods.map(period => {
                      const periodReturns = vatReturns.filter(v => v.period === period)
                      const [year, month] = period.split('-')
                      const monthLabel = monthNamesFull[parseInt(month) - 1]

                      return periodReturns.map((vr, idx) => {
                        const statusColor = getVatStatusColor(vr.status)

                        const handleStatusClick = () => {
                          // Cycle: not_filed → filed → paid → not_filed
                          const nextStatus = vr.status === 'not_filed' ? 'filed' : vr.status === 'filed' ? 'paid' : 'not_filed'
                          setVatReturns(prev => prev.map(v =>
                            v.id === vr.id
                              ? {
                                  ...v,
                                  status: nextStatus as VatReturn['status'],
                                  filed_date: nextStatus === 'filed' || nextStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
                                  paid_date: nextStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
                                }
                              : v
                          ))
                          toast.success(`${getVatReturnTypeLabel(vr.type)} ${monthLabel} ${year}: ${getVatStatusLabel(nextStatus as VatReturn['status'])}`)
                        }

                        return (
                          <tr key={vr.id} className="border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50">
                            {idx === 0 ? (
                              <td className="py-2 px-3 font-medium text-gray-900 dark:text-white" rowSpan={periodReturns.length}>
                                {monthLabel} {year}
                              </td>
                            ) : null}
                            <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                              {getVatReturnTypeLabel(vr.type)}
                            </td>
                            <td className="py-2 px-3">
                              <button
                                onClick={handleStatusClick}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:opacity-80 ${statusColor.bg} ${statusColor.text}`}
                                title="Klikni pro změnu stavu"
                              >
                                {getVatStatusLabel(vr.status)}
                              </button>
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-gray-900 dark:text-white">
                              {vr.amount !== null ? (
                                <span className={vr.amount < 0 ? 'text-green-600 dark:text-green-400' : ''}>
                                  {vr.amount < 0 ? '−' : ''}{Math.abs(vr.amount).toLocaleString('cs-CZ')} Kč
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-2 px-3 text-gray-500 dark:text-gray-400">
                              {vr.filed_date ? new Date(vr.filed_date).toLocaleDateString('cs-CZ') : '—'}
                            </td>
                            <td className="py-2 px-3 text-gray-500 dark:text-gray-400">
                              {vr.paid_date ? new Date(vr.paid_date).toLocaleDateString('cs-CZ') : '—'}
                            </td>
                          </tr>
                        )
                      })
                    })
                  })()}
                </tbody>
              </table>
            </div>

            {/* Legenda */}
            <div className="mt-4 pt-3 border-t dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Klikněte na stav pro změnu:</span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span> Nepodáno
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span> Podáno
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span> Zaplaceno
              </span>
            </div>
          </CollapsibleSection>
        )}

        {/* ============================================ */}
        {/* REPORTY */}
        {/* ============================================ */}
        <CollapsibleSection
          id="reports"
          title="Reporty"
          icon={BarChart3}
          defaultOpen={false}
        >
          <CompanyReports companyId={companyId} companyName={company.name} />
        </CollapsibleSection>

        {/* ============================================ */}
        {/* ÚKOLY */}
        {/* ============================================ */}
        <CollapsibleSection
          id="tasks"
          title="Úkoly"
          icon={ClipboardList}
          badge={tasks.filter(t => t.status !== 'completed' && t.status !== 'someday_maybe').length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {tasks.filter(t => t.status !== 'completed' && t.status !== 'someday_maybe').length}
            </Badge>
          )}
          defaultOpen={true}
        >
          <AccountantTasksSection
            companyId={companyId}
            companyName={company.name}
            tasks={tasks}
            onTasksChange={setTasks}
          />
        </CollapsibleSection>

        {/* ============================================ */}
        {/* ZPRÁVY */}
        {/* ============================================ */}
        <CollapsibleSection
          id="messages"
          title="Zprávy"
          icon={MessageCircle}
          defaultOpen={false}
        >
          <AccountantMessagesSection
            companyId={companyId}
            companyName={company.name}
          />
        </CollapsibleSection>

        {/* ============================================ */}
        {/* ZAMĚSTNANCI */}
        {/* ============================================ */}
        {company.has_employees && (
          <div id="employees" className="scroll-mt-4">
            <EmployeesSection
              companyId={companyId}
              employees={employees}
              onEmployeesChange={setEmployees}
              defaultOpen={false}
            />
          </div>
        )}

        {/* ============================================ */}
        {/* MAJETEK FIRMY */}
        {/* ============================================ */}
        <div id="assets" className="scroll-mt-4">
          <AssetsSection
            companyId={companyId}
            assets={assets}
            onAssetsChange={setAssets}
            defaultOpen={false}
          />
        </div>

        {/* ============================================ */}
        {/* POJIŠTĚNÍ A SMLOUVY */}
        {/* ============================================ */}
        <div id="insurance" className="scroll-mt-4">
          <InsuranceSection
            companyId={companyId}
            insurances={insurances}
            assets={assets}
            employees={employees}
            onInsurancesChange={setInsurances}
            defaultOpen={false}
          />
        </div>

        {/* ============================================ */}
        {/* KALENDÁŘ TERMÍNŮ */}
        {/* ============================================ */}
        <CollapsibleSection
          id="deadlines"
          title="Termíny a výročí"
          icon={CalendarDays}
          defaultOpen={false}
        >
          <AccountantDeadlineCalendar
            companyId={companyId}
            companyName={company.name}
          />
          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">Výročí z pojištění a majetku</h4>
            <AnniversaryCalendar
              insurances={insurances}
              assets={assets}
              employees={employees}
            />
          </div>
        </CollapsibleSection>

        {/* Modal pro editaci klienta */}
        <EditClientModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          company={company}
          onSave={handleCompanySave}
        />

        {/* Modal pro detail closure */}
        <ClosureDetailModal
          open={closureModalOpen}
          onOpenChange={setClosureModalOpen}
          closure={closureModalData}
          companyName={company.name}
          onSave={handleClosureSave}
        />

        {/* Modal pro urgování klienta */}
        {selectedClosure && (
          <UrgencyEmailModal
            open={urgencyModalOpen}
            onOpenChange={setUrgencyModalOpen}
            companyId={companyId}
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
    </div>
  )
}
