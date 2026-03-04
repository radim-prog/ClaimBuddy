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

// Mapování zdravotních pojišťoven
const healthInsuranceLabels: Record<string, string> = {
  vzp: 'VZP (111)',
  vozp: 'VOZP (201)',
  cpzp: '\u010cPZP (205)',
  ozp: 'OZP (207)',
  zpmv: 'ZP MV (211)',
  rbp: 'RBP (213)',
  zpma: 'ZP M-A (217)',
}

const FIRMA_TILES: TileDefinition[] = [
  { id: 'company-info', label: '\u00dadaje o firm\u011b', defaultVisible: true },
  { id: 'reports', label: 'Reporty', defaultVisible: true },
  { id: 'employees', label: 'Zam\u011bstnanci', defaultVisible: true },
  { id: 'assets', label: 'Majetek', defaultVisible: true },
  { id: 'insurance', label: 'Poji\u0161t\u011bn\u00ed', defaultVisible: true },
  { id: 'travel-diary', label: 'Kniha j\u00edzd', defaultVisible: true },
  { id: 'deadlines', label: 'Term\u00edny a v\u00fdro\u010d\u00ed', defaultVisible: true },
  { id: 'annual-closing', label: 'Ro\u010dn\u00ed uz\u00e1v\u011brka', defaultVisible: true },
  { id: 'notifications', label: 'Notifikace klienta', defaultVisible: true },
  { id: 'activity', label: 'Historie aktivit', defaultVisible: true },
]

export default function ProfilePage() {
  const { company, companyId, employees, assets, insurances, setEmployees, setAssets, setInsurances } = useCompany()
  const [showDataBoxPassword, setShowDataBoxPassword] = useState(false)

  // Kontaktní údaje
  const contactEmail = company.email || null
  const contactPhone = company.phone || null

  return (
    <TileContainer
      pageKey="client-detail-firma"
      definitions={FIRMA_TILES}
      renderTile={(tileId) => {
        switch (tileId) {
          case 'company-info':
            return (
              <Card className="rounded-xl shadow-soft border-gray-200/80 dark:border-gray-700/80">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold font-display text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    \u00dadaje o firm\u011b
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border/50 dark:border-gray-700/50">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">I\u010cO</div>
                      <div className="font-medium text-gray-900 dark:text-white">{company.ico}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">DI\u010c</div>
                      <div className="font-medium text-gray-900 dark:text-white">{company.dic || '\u2014'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Telefon</div>
                      <div className={`font-medium flex items-center gap-1 ${contactPhone ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {contactPhone || 'Nezad\u00e1no'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</div>
                      <div className={`font-medium flex items-center gap-1 truncate ${contactEmail ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{contactEmail || 'Nezad\u00e1no'}</span>
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
                        Pl\u00e1tce DPH \u2022 {company.vat_period === 'monthly' ? 'M\u011bs\u00ed\u010dn\u00ed' : 'Kvart\u00e1ln\u00ed'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        Nepl\u00e1tce DPH
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
                              P\u0159\u00edstupov\u00e9 \u00fadaje do datovky
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-gray-500 dark:text-gray-400">ID datov\u00e9 schr\u00e1nky</label>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">{company.data_box.id}</code>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(company.data_box!.id); toast.success('ID zkop\u00edrov\u00e1no') }}><Copy className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>
                            {company.data_box.login && (
                              <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400">P\u0159ihla\u0161ovac\u00ed jm\u00e9no</label>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">{company.data_box.login}</code>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(company.data_box!.login!); toast.success('Login zkop\u00edrov\u00e1n') }}><Copy className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                            )}
                            {company.data_box.password && (
                              <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Heslo</label>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">{showDataBoxPassword ? company.data_box.password : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}</code>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowDataBoxPassword(!showDataBoxPassword)}>{showDataBoxPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(company.data_box!.password!); toast.success('Heslo zkop\u00edrov\u00e1no') }}><Copy className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                            )}
                            {!company.data_box.login && !company.data_box.password && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic">P\u0159ihla\u0161ovac\u00ed \u00fadaje nejsou ulo\u017eeny</p>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    {company.has_employees && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <User className="h-3 w-3 mr-1" />{company.employee_count} zam\u011bstnanc\u016f
                      </span>
                    )}
                    {company.legal_form === 'OSV\u010c' && company.health_insurance_company && (
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
              <CollapsibleSection id="deadlines" title="Term\u00edny a v\u00fdro\u010d\u00ed" icon={CalendarDays} defaultOpen={false}>
                <AccountantDeadlineCalendar
                  companyId={companyId} companyName={company.name} vatPeriod={company.vat_period}
                  hasEmployees={company.has_employees}
                  entityType={company.legal_form === 'OSV\u010c' ? 'osvc' : company.legal_form === 's.r.o.' ? 'sro' : company.legal_form === 'a.s.' ? 'as' : null}
                />
                <div className="mt-6 pt-6 border-t border-border/50 dark:border-gray-700">
                  <h4 className="text-sm font-medium font-display text-gray-700 dark:text-gray-200 mb-4">V\u00fdro\u010d\u00ed z poji\u0161t\u011bn\u00ed a majetku</h4>
                  <AnniversaryCalendar insurances={insurances} assets={assets} employees={employees} />
                </div>
              </CollapsibleSection>
            )
          case 'annual-closing':
            return (
              <CollapsibleSection id="annual-closing" title="Ro\u010dn\u00ed uz\u00e1v\u011brka" icon={BookOpen} defaultOpen={false}>
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
              <CollapsibleSection id="travel-diary" title="Kniha j\u00edzd" icon={Car} defaultOpen={false}>
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
