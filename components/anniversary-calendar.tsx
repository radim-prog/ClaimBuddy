'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Shield,
  Car,
  FileText,
  Stethoscope,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Bell,
} from 'lucide-react'
import { Insurance, AnniversaryType, ANNIVERSARY_TYPE_LABELS } from '@/lib/types/insurance'
import { Asset } from '@/lib/types/asset'
import { Employee } from '@/lib/types/employee'

type AnniversaryCalendarProps = {
  insurances: Insurance[]
  assets: Asset[]
  employees: Employee[]
}

type AnniversaryEvent = {
  id: string
  type: AnniversaryType
  title: string
  description: string
  date: Date
  sourceType: 'insurance' | 'asset' | 'employee'
  sourceId: string
  daysUntil: number
  status: 'overdue' | 'due_soon' | 'upcoming' | 'future'
}

const TYPE_ICONS: Record<AnniversaryType, React.ReactNode> = {
  insurance_renewal: <Shield className="h-4 w-4" />,
  insurance_payment: <FileText className="h-4 w-4" />,
  vehicle_stk: <Car className="h-4 w-4" />,
  vehicle_insurance: <Shield className="h-4 w-4" />,
  employee_contract: <FileText className="h-4 w-4" />,
  employee_medical: <Stethoscope className="h-4 w-4" />,
  tax_deadline: <Calendar className="h-4 w-4" />,
  other: <Calendar className="h-4 w-4" />,
}

const TYPE_COLORS: Record<AnniversaryType, string> = {
  insurance_renewal: 'bg-blue-100 text-blue-700',
  insurance_payment: 'bg-green-100 text-green-700',
  vehicle_stk: 'bg-orange-100 text-orange-700',
  vehicle_insurance: 'bg-purple-100 text-purple-700',
  employee_contract: 'bg-cyan-100 text-cyan-700',
  employee_medical: 'bg-red-100 text-red-700',
  tax_deadline: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700',
}

const STATUS_COLORS = {
  overdue: 'bg-red-100 text-red-700 border-red-300',
  due_soon: 'bg-orange-100 text-orange-700 border-orange-300',
  upcoming: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  future: 'bg-gray-100 text-gray-600 border-gray-300',
}

export function AnniversaryCalendar({
  insurances,
  assets,
  employees,
}: AnniversaryCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [showAll, setShowAll] = useState(false)

  const today = useMemo(() => new Date(), [])

  // Generovat všechny události
  const allEvents = useMemo((): AnniversaryEvent[] => {
    const events: AnniversaryEvent[] = []

    // Události z pojištění
    insurances
      .filter((i) => i.status === 'active')
      .forEach((insurance) => {
        // Výročí pojistky
        if (insurance.anniversary_date) {
          const date = new Date(insurance.anniversary_date)
          const daysUntil = Math.ceil(
            (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
          events.push({
            id: `ins-anniversary-${insurance.id}`,
            type: 'insurance_renewal',
            title: `Výročí: ${insurance.name}`,
            description: `${insurance.provider} - č. smlouvy ${insurance.contract_number}`,
            date,
            sourceType: 'insurance',
            sourceId: insurance.id,
            daysUntil,
            status: getStatus(daysUntil),
          })
        }

        // Platba pojistky
        if (insurance.next_payment_date) {
          const date = new Date(insurance.next_payment_date)
          const daysUntil = Math.ceil(
            (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
          events.push({
            id: `ins-payment-${insurance.id}`,
            type: 'insurance_payment',
            title: `Platba: ${insurance.name}`,
            description: `${insurance.premium_amount.toLocaleString('cs-CZ')} Kč`,
            date,
            sourceType: 'insurance',
            sourceId: insurance.id,
            daysUntil,
            status: getStatus(daysUntil),
          })
        }
      })

    // Události z majetku (vozidla - STK, pojištění)
    assets
      .filter((a) => a.status === 'active' && a.category === 'vehicle')
      .forEach((asset) => {
        if (asset.vehicle_details?.stk_until) {
          const date = new Date(asset.vehicle_details.stk_until)
          const daysUntil = Math.ceil(
            (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
          events.push({
            id: `asset-stk-${asset.id}`,
            type: 'vehicle_stk',
            title: `STK: ${asset.name}`,
            description: asset.vehicle_details.license_plate || '',
            date,
            sourceType: 'asset',
            sourceId: asset.id,
            daysUntil,
            status: getStatus(daysUntil),
          })
        }

        if (asset.vehicle_details?.insurance_until) {
          const date = new Date(asset.vehicle_details.insurance_until)
          const daysUntil = Math.ceil(
            (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
          events.push({
            id: `asset-insurance-${asset.id}`,
            type: 'vehicle_insurance',
            title: `Pojištění vozidla: ${asset.name}`,
            description: asset.vehicle_details.license_plate || '',
            date,
            sourceType: 'asset',
            sourceId: asset.id,
            daysUntil,
            status: getStatus(daysUntil),
          })
        }
      })

    // Události ze zaměstnanců
    employees
      .filter((e) => e.active)
      .forEach((employee) => {
        // Výročí smlouvy
        if (employee.employment_start) {
          const startDate = new Date(employee.employment_start)
          // Najít příští výročí
          const nextAnniversary = new Date(startDate)
          nextAnniversary.setFullYear(today.getFullYear())
          if (nextAnniversary < today) {
            nextAnniversary.setFullYear(today.getFullYear() + 1)
          }
          const daysUntil = Math.ceil(
            (nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
          const yearsWorking = nextAnniversary.getFullYear() - startDate.getFullYear()
          events.push({
            id: `emp-contract-${employee.id}`,
            type: 'employee_contract',
            title: `Výročí: ${employee.first_name} ${employee.last_name}`,
            description: `${yearsWorking} let ve firmě`,
            date: nextAnniversary,
            sourceType: 'employee',
            sourceId: employee.id,
            daysUntil,
            status: getStatus(daysUntil),
          })
        }

        // Lékařská prohlídka (pokud by existovala)
        // TODO: Přidat pole medical_exam_due do Employee typu
      })

    return events.sort((a, b) => a.daysUntil - b.daysUntil)
  }, [insurances, assets, employees, today])

  // Filtrovat události pro aktuální zobrazení
  const filteredEvents = useMemo(() => {
    if (showAll) {
      return allEvents
    }
    // Zobrazit jen události do 90 dnů
    return allEvents.filter((e) => e.daysUntil <= 90)
  }, [allEvents, showAll])

  // Události pro vybraný měsíc (pro kalendář)
  const monthEvents = useMemo(() => {
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
    return allEvents.filter((e) => e.date >= startOfMonth && e.date <= endOfMonth)
  }, [allEvents, selectedMonth])

  function getStatus(daysUntil: number): AnniversaryEvent['status'] {
    if (daysUntil < 0) return 'overdue'
    if (daysUntil <= 7) return 'due_soon'
    if (daysUntil <= 30) return 'upcoming'
    return 'future'
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'short',
    })
  }

  const getStatusLabel = (status: AnniversaryEvent['status']) => {
    switch (status) {
      case 'overdue':
        return 'Po termínu'
      case 'due_soon':
        return 'Do týdne'
      case 'upcoming':
        return 'Do měsíce'
      case 'future':
        return 'V budoucnu'
    }
  }

  const getStatusIcon = (status: AnniversaryEvent['status']) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />
      case 'due_soon':
        return <Bell className="h-4 w-4" />
      case 'upcoming':
        return <Clock className="h-4 w-4" />
      case 'future':
        return <CheckCircle className="h-4 w-4" />
    }
  }

  // Statistiky
  const overdueCount = allEvents.filter((e) => e.status === 'overdue').length
  const dueSoonCount = allEvents.filter((e) => e.status === 'due_soon').length
  const upcomingCount = allEvents.filter((e) => e.status === 'upcoming').length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kalendář výročí a termínů
          </CardTitle>
          <div className="text-sm text-gray-500 mt-1 flex gap-4">
            {overdueCount > 0 && (
              <span className="text-red-600 font-medium">{overdueCount} po termínu</span>
            )}
            {dueSoonCount > 0 && (
              <span className="text-orange-600 font-medium">{dueSoonCount} do týdne</span>
            )}
            {upcomingCount > 0 && (
              <span className="text-yellow-600">{upcomingCount} do měsíce</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setSelectedMonth(
                new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
              )
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 font-medium min-w-[120px] text-center">
            {selectedMonth.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setSelectedMonth(
                new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
              )
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Žádné nadcházející termíny</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEvents.slice(0, showAll ? undefined : 10).map((event) => (
              <div
                key={event.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${STATUS_COLORS[event.status]}`}
              >
                <div className={`p-2 rounded-lg ${TYPE_COLORS[event.type]}`}>
                  {TYPE_ICONS[event.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="text-sm opacity-75 truncate">{event.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-medium">{formatDate(event.date)}</div>
                  <div className="text-xs flex items-center justify-end gap-1">
                    {getStatusIcon(event.status)}
                    {event.daysUntil === 0
                      ? 'Dnes'
                      : event.daysUntil === 1
                        ? 'Zítra'
                        : event.daysUntil < 0
                          ? `${Math.abs(event.daysUntil)} dní po termínu`
                          : `za ${event.daysUntil} dní`}
                  </div>
                </div>
              </div>
            ))}

            {!showAll && filteredEvents.length > 10 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowAll(true)}
              >
                Zobrazit všechny ({filteredEvents.length})
              </Button>
            )}

            {showAll && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowAll(false)}
              >
                Zobrazit méně
              </Button>
            )}
          </div>
        )}

        {/* Měsíční přehled */}
        {monthEvents.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3">
              Události v {selectedMonth.toLocaleDateString('cs-CZ', { month: 'long' })} (
              {monthEvents.length})
            </h4>
            <div className="space-y-1">
              {monthEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-50"
                >
                  <span className="w-12 text-gray-500">{event.date.getDate()}.</span>
                  <Badge variant="outline" className={TYPE_COLORS[event.type]}>
                    {TYPE_ICONS[event.type]}
                  </Badge>
                  <span className="truncate">{event.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
