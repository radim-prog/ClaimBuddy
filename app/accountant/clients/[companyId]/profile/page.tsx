'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Inbox,
  Car,
  Eye,
  EyeOff,
  Copy,
  Key,
  Bell,
  CalendarDays,
  BarChart3,
  BookOpen,
  Clock,
  DollarSign,
  Save,
  UserMinus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { EmployeesSection } from '@/components/employees-section'
import { AssetsSection } from '@/components/assets-section'
import { InsuranceSection } from '@/components/insurance-section'
import { AnniversaryCalendar } from '@/components/anniversary-calendar'
import { CollapsibleSection } from '@/components/collapsible-section'
import { CompanyReports } from '@/components/company/company-reports'
import { AccountantDeadlineCalendar } from '@/components/accountant/deadline-calendar'
import { AnnualClosingSection } from '@/components/annual-closing-section'
import { NotificationPanel } from '@/components/accountant/notification-panel'
import { NotificationSettings } from '@/components/accountant/notification-settings'
import { ActivityFeed } from '@/components/accountant/activity-feed'
import { TileContainer } from '@/components/tiles/tile-container'
import type { TileDefinition } from '@/lib/types/layout'
import { useCompany } from '../layout'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

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

const BASE_TILES: TileDefinition[] = [
  { id: 'company-info', label: 'Údaje o firmě', defaultVisible: true },
  { id: 'reports', label: 'Reporty', defaultVisible: true },
  { id: 'employees', label: 'Zaměstnanci', defaultVisible: true },
  { id: 'assets', label: 'Majetek', defaultVisible: true },
  { id: 'insurance', label: 'Pojištění', defaultVisible: true },
  { id: 'travel-diary', label: 'Kniha jízd', defaultVisible: true },
  { id: 'deadlines', label: 'Termíny a výročí', defaultVisible: true },
  { id: 'annual-closing', label: 'Roční uzávěrka', defaultVisible: true },
  { id: 'notifications', label: 'Notifikace klienta', defaultVisible: true },
  { id: 'activity', label: 'Historie aktivit', defaultVisible: true },
]

const REVENUE_TILE: TileDefinition = { id: 'revenue', label: 'Revenue', defaultVisible: true }

export default function ProfilePage() {
  const { company, companyId, employees, assets, insurances, setEmployees, setAssets, setInsurances } = useCompany()
  const { userRole } = useAccountantUser()
  const [showDataBoxPassword, setShowDataBoxPassword] = useState(false)
  const isAdmin = userRole === 'admin'

  // Kontaktní údaje
  const contactEmail = company.email || null
  const contactPhone = company.phone || null

  const FIRMA_TILES = isAdmin ? [REVENUE_TILE, ...BASE_TILES] : BASE_TILES

  return (
    <TileContainer
      pageKey="client-detail-firma"
      definitions={FIRMA_TILES}
      renderTile={(tileId) => {
        switch (tileId) {
          case 'revenue':
            return isAdmin ? (
              <CollapsibleSection id="revenue" title="Revenue" icon={DollarSign} defaultOpen={true}>
                <RevenueTile companyId={companyId} company={company} />
              </CollapsibleSection>
            ) : null
          case 'company-info':
            return (
              <Card className="rounded-xl shadow-soft border-gray-200/80 dark:border-gray-700/80">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold font-display text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    Údaje o firmě
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border/50 dark:border-gray-700/50">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">IČO</div>
                      <div className="font-medium text-gray-900 dark:text-white">{company.ico}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">DIČ</div>
                      <div className="font-medium text-gray-900 dark:text-white">{company.dic || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Telefon</div>
                      <div className={`font-medium flex items-center gap-1 ${contactPhone ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {contactPhone || 'Nezadáno'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</div>
                      <div className={`font-medium flex items-center gap-1 truncate ${contactEmail ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{contactEmail || 'Nezadáno'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Adresa</div>
                    <div className="text-gray-900 dark:text-white flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {[company.street, company.zip, company.city].filter(Boolean).join(', ') || 'Adresa neuvedena'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {company.vat_payer ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        Plátce DPH • {company.vat_period === 'monthly' ? 'Měsíční' : 'Kvartální'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        Neplátce DPH
                      </span>
                    )}
                    {company.data_box && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors cursor-pointer">
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
                                <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">{company.data_box.id}</code>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(company.data_box!.id); toast.success('ID zkopírováno') }}><Copy className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                            {company.data_box.login && (
                              <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Přihlašovací jméno</label>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">{company.data_box.login}</code>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(company.data_box!.login!); toast.success('Login zkopírován') }}><Copy className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                            )}
                            {company.data_box.password && (
                              <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Heslo</label>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">{showDataBoxPassword ? company.data_box.password : '••••••••'}</code>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowDataBoxPassword(!showDataBoxPassword)}>{showDataBoxPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(company.data_box!.password!); toast.success('Heslo zkopírováno') }}><Copy className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                            )}
                            {!company.data_box.login && !company.data_box.password && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic">Přihlašovací údaje nejsou uloženy</p>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    {company.has_employees && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <User className="h-3 w-3 mr-1" />{company.employee_count} zaměstnanců
                      </span>
                    )}
                    {company.legal_form === 'OSVČ' && company.health_insurance_company && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {healthInsuranceLabels[company.health_insurance_company] || company.health_insurance_company}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          case 'reports':
            return (
              <CollapsibleSection id="reports" title="Reporty" icon={BarChart3} defaultOpen={false}>
                <CompanyReports companyId={companyId} companyName={company.name} />
              </CollapsibleSection>
            )
          case 'employees':
            return company.has_employees ? (
              <EmployeesSection companyId={companyId} employees={employees} onEmployeesChange={setEmployees} defaultOpen={false} />
            ) : null
          case 'assets':
            return (
              <AssetsSection companyId={companyId} assets={assets} onAssetsChange={setAssets} defaultOpen={false} />
            )
          case 'insurance':
            return (
              <InsuranceSection companyId={companyId} insurances={insurances} assets={assets} employees={employees} onInsurancesChange={setInsurances} defaultOpen={false} />
            )
          case 'deadlines':
            return (
              <CollapsibleSection id="deadlines" title="Termíny a výročí" icon={CalendarDays} defaultOpen={false}>
                <AccountantDeadlineCalendar
                  companyId={companyId} companyName={company.name} vatPeriod={company.vat_period}
                  hasEmployees={company.has_employees}
                  entityType={company.legal_form === 'OSVČ' ? 'osvc' : company.legal_form === 's.r.o.' ? 'sro' : company.legal_form === 'a.s.' ? 'as' : null}
                />
                <div className="mt-6 pt-6 border-t border-border/50 dark:border-gray-700">
                  <h4 className="text-sm font-medium font-display text-gray-700 dark:text-gray-200 mb-4">Výročí z pojištění a majetku</h4>
                  <AnniversaryCalendar insurances={insurances} assets={assets} employees={employees} />
                </div>
              </CollapsibleSection>
            )
          case 'annual-closing':
            return (
              <CollapsibleSection id="annual-closing" title="Roční uzávěrka" icon={BookOpen} defaultOpen={false}>
                <AnnualClosingSection companyId={companyId} companyName={company.name} />
              </CollapsibleSection>
            )
          case 'notifications':
            return (
              <CollapsibleSection id="notifications" title="Notifikace klienta" icon={Bell} defaultOpen={false}>
                <div className="space-y-6">
                  <NotificationPanel companyId={companyId} />
                  <NotificationSettings companyId={companyId} notificationPreferences={null} />
                </div>
              </CollapsibleSection>
            )
          case 'travel-diary':
            return (
              <CollapsibleSection id="travel-diary" title="Kniha jízd" icon={Car} defaultOpen={false}>
                <TravelDiaryTile companyId={companyId} />
              </CollapsibleSection>
            )
          case 'activity':
            return (
              <CollapsibleSection id="activity" title="Historie aktivit" icon={Clock} defaultOpen={false}>
                <ActivityFeed companyId={companyId} limit={20} />
              </CollapsibleSection>
            )
          default:
            return null
        }
      }}
    />
  )
}

function TravelDiaryTile({ companyId }: { companyId: string }) {
  const [stats, setStats] = useState<{ total_trips: number; total_km: number; vehicles: number; last_trip?: string } | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, vehiclesRes, tripsRes] = await Promise.all([
          fetch(`/api/accountant/companies/${companyId}/travel/stats?year=${new Date().getFullYear()}`),
          fetch(`/api/accountant/companies/${companyId}/travel/vehicles`),
          fetch(`/api/accountant/companies/${companyId}/travel/trips?limit=1`),
        ])
        const [statsData, vehiclesData, tripsData] = await Promise.all([statsRes.json(), vehiclesRes.json(), tripsRes.json()])
        setStats({
          total_trips: statsData.stats?.total_trips || 0,
          total_km: statsData.stats?.total_km || 0,
          vehicles: (vehiclesData.vehicles || []).length,
          last_trip: (tripsData.trips || [])[0]?.trip_date,
        })
      } catch {}
    }
    load()
  }, [companyId])

  if (!stats) return <p className="text-sm text-muted-foreground py-2">Nacitani...</p>

  const basePath = `/accountant/clients/${companyId}`

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Vozidla</div>
          <div className="font-semibold">{stats.vehicles}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Km letos</div>
          <div className="font-semibold">{stats.total_km.toLocaleString('cs')}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Jizdy letos</div>
          <div className="font-semibold">{stats.total_trips}</div>
        </div>
      </div>
      {stats.last_trip && (
        <p className="text-xs text-muted-foreground">Posledni jizda: {new Date(stats.last_trip).toLocaleDateString('cs')}</p>
      )}
      <a href={`${basePath}/travel`} className="text-xs text-purple-600 hover:underline">Zobrazit vse &rarr;</a>
    </div>
  )
}

function RevenueTile({ companyId, company }: { companyId: string; company: any }) {
  const [fee, setFee] = useState(company.billing_settings?.monthly_fee || 0)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(fee))
  const [saving, setSaving] = useState(false)

  const clientSince = company.billing_settings?.client_since || null

  async function handleSave() {
    setSaving(true)
    try {
      const newFee = Number(editValue)
      const previousFee = fee

      const res = await fetch(`/api/accountant/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing_settings: {
            ...(company.billing_settings || {}),
            monthly_fee: newFee,
          },
        }),
      })
      if (!res.ok) throw new Error('Failed')

      if (previousFee > 0 && previousFee !== newFee) {
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            event_type: 'fee_changed',
            event_date: new Date().toISOString().split('T')[0],
            monthly_fee: newFee,
            previous_fee: previousFee,
          }),
        })
      }

      setFee(newFee)
      setEditing(false)
      toast.success('Pausal ulozen')
    } catch {
      toast.error('Chyba pri ukladani')
    } finally {
      setSaving(false)
    }
  }

  async function handleChurn() {
    if (!confirm(`Opravdu chcete zaznamenat odchod klienta ${company.name}?`)) return

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          event_type: 'churned',
          event_date: new Date().toISOString().split('T')[0],
          monthly_fee: fee,
        }),
      })
      toast.success('Odchod klienta zaznamena')
    } catch {
      toast.error('Chyba')
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Mesicni pausal</div>
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-24 px-2 py-1 text-sm border rounded"
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <span className="text-xs text-muted-foreground">Kc</span>
              <button onClick={handleSave} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                <Save className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                &times;
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{fee > 0 ? `${fee.toLocaleString('cs')} Kc` : 'Nezadano'}</span>
              <button onClick={() => { setEditValue(String(fee)); setEditing(true) }} className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded">
                <DollarSign className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Klientem od</div>
          <span className="font-medium">{clientSince ? new Date(clientSince).toLocaleDateString('cs') : 'Nezadano'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Stav:</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          company.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          company.status === 'churned' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          'bg-gray-100 text-gray-600'
        }`}>
          {company.status === 'active' ? 'Aktivni' : company.status === 'churned' ? 'Odsel' : company.status}
        </span>
        {company.status === 'active' && (
          <button
            onClick={handleChurn}
            className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition-colors"
          >
            <UserMinus className="h-3 w-3" />
            Klient odesel
          </button>
        )}
      </div>
    </div>
  )
}
