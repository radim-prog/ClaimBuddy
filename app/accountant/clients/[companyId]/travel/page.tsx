'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Car,
  Route,
  Banknote,
  Download,
  Calendar,
  MapPin,
  ArrowRight,
  Loader2,
  Gauge,
  Fuel,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { CollapsibleSection } from '@/components/collapsible-section'
import { FuelGauge } from '@/components/client/travel/fuel-gauge'
import { TravelStatsCards } from '@/components/client/travel/travel-stats'
import { FUEL_TYPE_LABELS } from '@/lib/types/asset'
import { TRIP_TYPE_LABELS, BASIC_RATES_PER_KM, type TravelTrip, type TravelVehicle, type TravelStats, type TripType } from '@/lib/types/travel'
import { toast } from 'sonner'

const tripTypeColors: Record<TripType, string> = {
  business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  private: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  commute: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

export default function AccountantTravelPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const [loading, setLoading] = useState(true)
  const [generatingSession, setGeneratingSession] = useState(false)

  const [trips, setTrips] = useState<TravelTrip[]>([])
  const [vehicles, setVehicles] = useState<TravelVehicle[]>([])
  const [monthStats, setMonthStats] = useState<TravelStats | null>(null)
  const [yearStats, setYearStats] = useState<TravelStats | null>(null)

  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [selectedTrip, setSelectedTrip] = useState<TravelTrip | null>(null)

  const currentYear = new Date().getFullYear()
  const [y, m] = monthFilter.split('-').map(Number)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const base = `/api/accountant/companies/${companyId}/travel`
      const qp = new URLSearchParams()
      if (monthFilter) qp.set('month', monthFilter)
      if (vehicleFilter) qp.set('vehicleId', vehicleFilter)

      const [tripsRes, vehiclesRes, monthRes, yearRes] = await Promise.all([
        fetch(`${base}/trips?${qp}`),
        fetch(`${base}/vehicles`),
        fetch(`${base}/stats?year=${y}&month=${m}`),
        fetch(`${base}/stats?year=${y}`),
      ])

      const [tripsData, vehiclesData, monthData, yearData] = await Promise.all([
        tripsRes.json(), vehiclesRes.json(), monthRes.json(), yearRes.json(),
      ])

      setTrips(tripsData.trips || [])
      setVehicles(vehiclesData.vehicles || [])
      setMonthStats(monthData.stats || null)
      setYearStats(yearData.stats || null)
    } catch (err) {
      console.error('Failed to load travel data:', err)
    } finally {
      setLoading(false)
    }
  }, [companyId, monthFilter, vehicleFilter, y, m])

  useEffect(() => { loadData() }, [loadData])

  const handleExport = async (period: 'month' | 'year') => {
    try {
      const month = period === 'month' ? monthFilter : undefined
      const base = `/api/accountant/companies/${companyId}/travel/export`
      const qp = new URLSearchParams({ format: 'csv' })
      if (month) qp.set('month', month)

      const res = await fetch(`${base}?${qp}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kniha-jizd-${month || y}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export stazeny')
    } catch (err) {
      toast.error('Export se nezdaril')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {monthStats && <TravelStatsCards stats={monthStats} label={`Mesic ${monthFilter}`} />}

      {/* Alerts */}
      {vehicles.length > 0 && trips.length === 0 && (
        <Card className="rounded-xl shadow-soft-sm border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-sm text-amber-700 dark:text-amber-400">
              Klient ma aktivni vozidla, ale tento mesic nezapsal zadne jizdy.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Generate button */}
      <Card className="rounded-xl shadow-soft-sm border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generátor knihy jízd
            </h3>
            <p className="text-sm text-purple-700/70 dark:text-purple-300/70 mt-0.5">
              AI vygeneruje kompletní knihu jízd z dokladů o tankování a tachometru
            </p>
          </div>
          <Button
            onClick={async () => {
              setGeneratingSession(true)
              try {
                const now = new Date()
                const periodStart = `${now.getFullYear()}-01`
                const periodEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                const res = await fetch(`/api/accountant/companies/${companyId}/travel/generate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ period_start: periodStart, period_end: periodEnd }),
                })
                if (!res.ok) {
                  const err = await res.json()
                  throw new Error(err.error || 'Failed')
                }
                const { session } = await res.json()
                router.push(`/accountant/clients/${companyId}/travel/generate/${session.id}`)
              } catch (err: any) {
                toast.error(err.message || 'Nepodařilo se vytvořit session')
              } finally {
                setGeneratingSession(false)
              }
            }}
            disabled={generatingSession}
            className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
          >
            {generatingSession ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generovat
          </Button>
        </CardContent>
      </Card>

      {/* Filters + export */}
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <Label className="text-xs">Obdobi</Label>
            <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="w-40 h-11" />
          </div>
          {vehicles.length > 0 && (
            <div>
              <Label className="text-xs">Vozidlo</Label>
              <Select value={vehicleFilter || 'all'} onValueChange={v => setVehicleFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-44 h-11"><SelectValue placeholder="Vse" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vse</SelectItem>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.license_plate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('month')}>
            <Download className="h-4 w-4 mr-1" />
            Mesic CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('year')}>
            <Download className="h-4 w-4 mr-1" />
            Rok CSV
          </Button>
        </div>
      </div>

      {/* Trips table */}
      <Card className="rounded-xl shadow-soft">
        <CardContent className="p-0">
          {trips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Zadne jizdy za zvolene obdobi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                    <th className="p-3">Datum</th>
                    <th className="p-3">Trasa</th>
                    <th className="p-3">Ucel</th>
                    <th className="p-3">Km</th>
                    <th className="p-3">SPZ</th>
                    <th className="p-3">Ridic</th>
                    <th className="p-3 text-right">Nahrada</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map(trip => (
                    <tr key={trip.id} className="border-b border-border/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}
                    >
                      <td className="p-3 whitespace-nowrap">{new Date(trip.trip_date).toLocaleDateString('cs')}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="truncate max-w-[120px]">{trip.origin}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[120px]">{trip.destination}</span>
                        </div>
                      </td>
                      <td className="p-3 max-w-[150px] truncate">{trip.purpose}</td>
                      <td className="p-3 font-medium">{trip.distance_km}</td>
                      <td className="p-3 font-mono text-xs">{trip.vehicle_license_plate || '-'}</td>
                      <td className="p-3">{trip.driver_name || '-'}</td>
                      <td className="p-3 text-right font-medium text-green-600">
                        {trip.reimbursement ? `${trip.reimbursement.toLocaleString('cs')} Kc` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 font-medium">
                    <td className="p-3" colSpan={3}>Celkem ({trips.length} jizd)</td>
                    <td className="p-3">{trips.reduce((s, t) => s + Number(t.distance_km), 0).toLocaleString('cs')}</td>
                    <td className="p-3" colSpan={2}></td>
                    <td className="p-3 text-right text-green-600">
                      {trips.reduce((s, t) => s + (Number(t.reimbursement) || 0), 0).toLocaleString('cs')} Kc
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip detail modal-like inline */}
      {selectedTrip && (
        <Card className="rounded-xl shadow-soft border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold font-display">Detail jizdy</h3>
              <Badge className={`${tripTypeColors[selectedTrip.trip_type as TripType]} rounded-md`} variant="secondary">
                {TRIP_TYPE_LABELS[selectedTrip.trip_type as TripType]}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><span className="text-muted-foreground">Datum:</span> {new Date(selectedTrip.trip_date).toLocaleDateString('cs')}</div>
              <div><span className="text-muted-foreground">Cas:</span> {selectedTrip.departure_time?.slice(0, 5) || '-'} - {selectedTrip.arrival_time?.slice(0, 5) || '-'}</div>
              <div><span className="text-muted-foreground">Trasa:</span> {selectedTrip.origin} &rarr; {selectedTrip.destination}</div>
              <div><span className="text-muted-foreground">Ucel:</span> {selectedTrip.purpose}</div>
              <div><span className="text-muted-foreground">Vzdalenost:</span> {selectedTrip.distance_km} km {selectedTrip.is_round_trip && '(zpet)'}</div>
              <div><span className="text-muted-foreground">Tachometr:</span> {selectedTrip.odometer_start || '-'} &rarr; {selectedTrip.odometer_end || '-'}</div>
              <div><span className="text-muted-foreground">Zakl. sazba:</span> {selectedTrip.basic_rate_per_km || selectedTrip.rate_per_km || '-'} Kc/km</div>
              {selectedTrip.fuel_price_per_unit && <div><span className="text-muted-foreground">Cena PHM:</span> {selectedTrip.fuel_price_per_unit} Kc/l</div>}
              <div><span className="text-muted-foreground">Nahrada:</span> <strong className="text-green-600">{selectedTrip.reimbursement?.toLocaleString('cs')} Kc</strong></div>
              {selectedTrip.manual_override && <Badge variant="outline" className="text-xs rounded-md">Rucne upraveno</Badge>}
              {selectedTrip.notes && <div className="col-span-full"><span className="text-muted-foreground">Poznamka:</span> {selectedTrip.notes}</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicles section (collapsible) */}
      <CollapsibleSection id="travel-vehicles" title={`Vozidla klienta (${vehicles.length})`} icon={Car} defaultOpen={false}>
        {vehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Klient nema zadna vozidla</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vehicles.map(v => (
              <Card key={v.id} className="rounded-xl shadow-soft-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">{v.name}</span>
                    <Badge variant="outline" className="text-xs font-mono ml-auto rounded-md">{v.license_plate}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Spotreba: {v.fuel_consumption || '-'} l/100km</div>
                    <div>Palivo: {FUEL_TYPE_LABELS[v.fuel_type] || v.fuel_type}</div>
                    <div className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {v.current_odometer.toLocaleString('cs')} km</div>
                    <div>Sazba: {BASIC_RATES_PER_KM[v.vehicle_category || 'car']} Kc/km</div>
                  </div>
                  {v.tank_capacity && (
                    <div className="mt-2">
                      <FuelGauge currentLevel={v.current_fuel_level} tankCapacity={v.tank_capacity} size="sm" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Year stats */}
      {yearStats && yearStats.total_trips > 0 && (
        <TravelStatsCards stats={yearStats} label={`Rocni prehled ${y}`} />
      )}
    </div>
  )
}
