'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Car,
  Plus,
  MapPin,
  BarChart3,
  Route,
  Loader2,
  Star,
  Fuel,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TripList } from '@/components/client/travel/trip-list'
import { TripForm } from '@/components/client/travel/trip-form'
import { VehicleCard } from '@/components/client/travel/vehicle-card'
import { VehicleForm } from '@/components/client/travel/vehicle-form'
import { TravelStatsCards } from '@/components/client/travel/travel-stats'
import { toast } from 'sonner'
import type { TravelTrip, TravelVehicle, TravelDriver, TravelPlace, TravelStats } from '@/lib/types/travel'

type Tab = 'trips' | 'vehicles' | 'places' | 'stats'

export default function TravelPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <TravelPageInner />
    </Suspense>
  )
}

function TravelPageInner() {
  const searchParams = useSearchParams()

  const initialTab = (searchParams.get('tab') as Tab) || 'trips'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [loading, setLoading] = useState(true)

  // Data
  const [trips, setTrips] = useState<TravelTrip[]>([])
  const [vehicles, setVehicles] = useState<TravelVehicle[]>([])
  const [drivers, setDrivers] = useState<TravelDriver[]>([])
  const [places, setPlaces] = useState<TravelPlace[]>([])
  const [stats, setStats] = useState<TravelStats | null>(null)

  // Filters
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))
  const [vehicleFilter, setVehicleFilter] = useState('')

  // Forms
  const [showTripForm, setShowTripForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState<TravelTrip | undefined>()
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<TravelVehicle | undefined>()
  const [showFuelForm, setShowFuelForm] = useState(false)

  const tabs: { id: Tab; label: string; icon: typeof Car }[] = [
    { id: 'trips', label: 'Jizdy', icon: Route },
    { id: 'vehicles', label: 'Vozidla', icon: Car },
    { id: 'places', label: 'Mista', icon: MapPin },
    { id: 'stats', label: 'Prehled', icon: BarChart3 },
  ]

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (monthFilter) params.set('month', monthFilter)
      if (vehicleFilter) params.set('vehicleId', vehicleFilter)

      const [tripsRes, vehiclesRes, driversRes, placesRes, statsRes] = await Promise.all([
        fetch(`/api/client/travel/trips?${params}`),
        fetch('/api/client/travel/vehicles'),
        fetch('/api/client/travel/drivers'),
        fetch('/api/client/travel/places'),
        fetch(`/api/client/travel/stats?year=${monthFilter.split('-')[0]}&month=${monthFilter.split('-')[1]}`),
      ])

      const [tripsData, vehiclesData, driversData, placesData, statsData] = await Promise.all([
        tripsRes.json(), vehiclesRes.json(), driversRes.json(), placesRes.json(), statsRes.json(),
      ])

      setTrips(tripsData.trips || [])
      setVehicles(vehiclesData.vehicles || [])
      setDrivers(driversData.drivers || [])
      setPlaces(placesData.places || [])
      setStats(statsData.stats || null)
    } catch (err) {
      console.error('Failed to load travel data:', err)
    } finally {
      setLoading(false)
    }
  }, [monthFilter, vehicleFilter])

  useEffect(() => { loadData() }, [loadData])

  // Trip CRUD
  const handleCreateTrip = async (data: any) => {
    const res = await fetch('/api/client/travel/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create trip')
    toast.success('Jizda zapsana')
    setShowTripForm(false)
    loadData()
  }

  const handleUpdateTrip = async (data: any) => {
    if (!editingTrip) return
    const res = await fetch(`/api/client/travel/trips/${editingTrip.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update trip')
    toast.success('Jizda aktualizovana')
    setEditingTrip(undefined)
    loadData()
  }

  const handleDeleteTrip = async (id: string) => {
    if (!confirm('Opravdu smazat tuto jizdu?')) return
    await fetch(`/api/client/travel/trips/${id}`, { method: 'DELETE' })
    toast.success('Jizda smazana')
    loadData()
  }

  // Vehicle CRUD
  const handleCreateVehicle = async (data: any) => {
    const res = await fetch('/api/client/travel/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create vehicle')
    toast.success('Vozidlo pridano')
    setShowVehicleForm(false)
    loadData()
  }

  const handleUpdateVehicle = async (data: any) => {
    if (!editingVehicle) return
    const res = await fetch(`/api/client/travel/vehicles/${editingVehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update vehicle')
    toast.success('Vozidlo aktualizovano')
    setEditingVehicle(undefined)
    setShowVehicleForm(false)
    loadData()
  }

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Opravdu odebrat vozidlo?')) return
    await fetch(`/api/client/travel/vehicles/${id}`, { method: 'DELETE' })
    toast.success('Vozidlo odebrano')
    loadData()
  }

  // Fuel log
  const handleCreateFuelLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/client/travel/fuel-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_id: fd.get('vehicle_id'),
        log_date: fd.get('log_date'),
        liters: Number(fd.get('liters')),
        price_per_liter: fd.get('price_per_liter') ? Number(fd.get('price_per_liter')) : null,
        total_price: fd.get('total_price') ? Number(fd.get('total_price')) : null,
        odometer: fd.get('odometer') ? Number(fd.get('odometer')) : null,
        station_name: fd.get('station_name') || null,
        is_full_tank: fd.get('is_full_tank') === 'on',
      }),
    })
    if (!res.ok) throw new Error('Failed')
    toast.success('Tankovani zapsano')
    setShowFuelForm(false)
    loadData()
  }

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold font-display">Kniha jizd</h1>
          <p className="text-muted-foreground">Evidence sluzebních jizd</p>
        </div>
        <Button onClick={() => { setShowTripForm(true); setEditingTrip(undefined) }}>
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Zapsat jizdu</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-soft-sm'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* ===== TRIPS TAB ===== */}
          {activeTab === 'trips' && (
            <div className="space-y-4">
              {/* New/Edit trip form */}
              {(showTripForm || editingTrip) && (
                <Card className="rounded-xl border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4 sm:p-6">
                    <h2 className="text-lg font-semibold font-display mb-4">{editingTrip ? 'Upravit jizdu' : 'Nova jizda'}</h2>
                    <TripForm
                      trip={editingTrip}
                      vehicles={vehicles}
                      drivers={drivers}
                      places={places}
                      onSubmit={editingTrip ? handleUpdateTrip : handleCreateTrip}
                      onCancel={() => { setShowTripForm(false); setEditingTrip(undefined) }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Filters */}
              {!showTripForm && !editingTrip && (
                <>
                  <div className="flex gap-3 items-end flex-wrap">
                    <div>
                      <Label className="text-xs">Mesic</Label>
                      <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="w-40 h-11" />
                    </div>
                    {vehicles.length > 0 && (
                      <div>
                        <Label className="text-xs">Vozidlo</Label>
                        <select
                          value={vehicleFilter || 'all'}
                          onChange={e => setVehicleFilter(e.target.value === 'all' ? '' : e.target.value)}
                          className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-44"
                        >
                          <option value="all">Vse</option>
                          {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.license_plate}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <TripList
                    trips={trips}
                    onEdit={t => { setEditingTrip(t); setShowTripForm(false) }}
                    onDelete={handleDeleteTrip}
                  />
                </>
              )}
            </div>
          )}

          {/* ===== VEHICLES TAB ===== */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              {(showVehicleForm || editingVehicle) ? (
                <Card className="rounded-xl">
                  <CardContent className="p-4 sm:p-6">
                    <h2 className="text-lg font-semibold font-display mb-4">{editingVehicle ? 'Upravit vozidlo' : 'Nove vozidlo'}</h2>
                    <VehicleForm
                      vehicle={editingVehicle}
                      onSubmit={editingVehicle ? handleUpdateVehicle : handleCreateVehicle}
                      onCancel={() => { setShowVehicleForm(false); setEditingVehicle(undefined) }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold font-display">Vozidla ({vehicles.length})</h2>
                    <div className="flex gap-2">
                      {vehicles.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setShowFuelForm(!showFuelForm)}>
                          <Fuel className="h-4 w-4 mr-1" />
                          Tankovat
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setShowVehicleForm(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Pridat
                      </Button>
                    </div>
                  </div>

                  {showFuelForm && (
                    <Card className="rounded-xl border-orange-200 dark:border-orange-800">
                      <CardContent className="p-4">
                        <h3 className="font-semibold font-display mb-3">Zaznamenat tankovani</h3>
                        <form onSubmit={handleCreateFuelLog} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">Vozidlo *</Label>
                            <select name="vehicle_id" required className="w-full rounded-md border px-3 py-2 h-11 text-sm bg-white dark:bg-gray-800">
                              {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs">Datum *</Label>
                            <Input type="date" name="log_date" defaultValue={new Date().toISOString().split('T')[0]} required className="h-11" />
                          </div>
                          <div>
                            <Label className="text-xs">Litry *</Label>
                            <Input type="number" step="0.01" name="liters" placeholder="35" required className="h-11" />
                          </div>
                          <div>
                            <Label className="text-xs">Cena/l</Label>
                            <Input type="number" step="0.01" name="price_per_liter" placeholder="38.90" className="h-11" />
                          </div>
                          <div>
                            <Label className="text-xs">Celkem Kc</Label>
                            <Input type="number" step="0.01" name="total_price" className="h-11" />
                          </div>
                          <div>
                            <Label className="text-xs">Tachometr</Label>
                            <Input type="number" name="odometer" className="h-11" />
                          </div>
                          <div>
                            <Label className="text-xs">Cerp. stanice</Label>
                            <Input type="text" name="station_name" className="h-11" />
                          </div>
                          <div className="flex items-end gap-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" name="is_full_tank" className="rounded" />
                              Do plna
                            </label>
                          </div>
                          <div className="flex items-end gap-2">
                            <Button type="submit" size="sm">Ulozit</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowFuelForm(false)}>Zrusit</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {vehicles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Car className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Zadna vozidla</p>
                      <p className="text-sm mt-1">Pridejte sve prvni vozidlo</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {vehicles.map(v => (
                        <VehicleCard
                          key={v.id}
                          vehicle={v}
                          onEdit={v => { setEditingVehicle(v); setShowVehicleForm(true) }}
                          onDelete={handleDeleteVehicle}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== PLACES TAB ===== */}
          {activeTab === 'places' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold font-display">Mista ({places.length})</h2>
              </div>

              {places.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Zatim zadna mista</p>
                  <p className="text-sm mt-1">Mista se automaticky ukladaji pri zapisu jizd</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {places.map(place => (
                    <Card key={place.id} className="rounded-xl">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          {place.is_favorite ? (
                            <Star className="h-4 w-4 text-yellow-500 shrink-0" />
                          ) : (
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{place.name}</p>
                            {place.address && <p className="text-xs text-muted-foreground truncate">{place.address}</p>}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{place.visit_count}x navstiveno</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== STATS TAB ===== */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {stats && (
                <>
                  <TravelStatsCards stats={stats} label={`Prehled za ${monthFilter}`} />
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
