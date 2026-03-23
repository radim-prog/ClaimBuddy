'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Brain,
  Loader2,
  Check,
  MapPin,
  Calendar,
  Route,
  Sparkles,
  Save,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { TravelVehicle, TravelDriver } from '@/lib/types/travel'

interface GeneratedTrip {
  trip_date: string
  departure_time: string
  arrival_time: string
  origin: string
  destination: string
  purpose: string
  distance_km: number
  is_round_trip: boolean
  route_description: string
}

interface TravelRandomizerProps {
  companyId?: string
  vehicles: TravelVehicle[]
  drivers: TravelDriver[]
  currentMonth: string // YYYY-MM
  onTripsGenerated?: () => void
}

export function TravelRandomizer({
  companyId,
  vehicles,
  drivers,
  currentMonth,
  onTripsGenerated,
}: TravelRandomizerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.id || '')
  const [selectedDriver, setSelectedDriver] = useState(
    drivers.find(d => d.is_default)?.id || drivers[0]?.id || ''
  )
  const [targetKm, setTargetKm] = useState('')
  const [generatedTrips, setGeneratedTrips] = useState<GeneratedTrip[]>([])
  const [totalKm, setTotalKm] = useState(0)
  const [estimatedKm, setEstimatedKm] = useState(0)
  const [saving, setSaving] = useState(false)

  const [year, month] = currentMonth.split('-').map(Number)

  const handleGenerate = async () => {
    if (!selectedVehicle) {
      toast.error('Vyberte vozidlo')
      return
    }

    setLoading(true)
    setGeneratedTrips([])

    try {
      const res = await fetch('/api/client/travel/randomize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          vehicleId: selectedVehicle,
          year,
          month,
          targetKm: targetKm ? Number(targetKm) : undefined,
          driverId: selectedDriver || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Generování se nezdařilo')
        return
      }

      setGeneratedTrips(data.trips)
      setTotalKm(data.totalKm)
      setEstimatedKm(data.estimatedFromFuel)
      toast.success(`Vygenerováno ${data.trips.length} cest (${data.totalKm} km)`)
    } catch {
      toast.error('Chyba při generování cest')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAll = async () => {
    if (generatedTrips.length === 0) return

    setSaving(true)
    try {
      const res = await fetch('/api/client/travel/randomize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          vehicleId: selectedVehicle,
          year,
          month,
          targetKm: targetKm ? Number(targetKm) : undefined,
          driverId: selectedDriver || undefined,
          autoSave: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Ukládání se nezdařilo')
        return
      }

      toast.success(`Uloženo ${data.savedTripIds?.length || 0} cest do knihy jízd`)
      setGeneratedTrips([])
      onTripsGenerated?.()
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const vehicle = vehicles.find(v => v.id === selectedVehicle)

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base font-display flex items-center gap-2">
                AI Generátor cest
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                  Premium
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Automaticky vygeneruje věrohodné služební cesty z tankování
              </CardDescription>
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Vozidlo</Label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm"
              >
                <option value="">Vyberte...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.license_plate})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Řidič</Label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm"
              >
                <option value="">Žádný</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Cílový počet km (volitelné)</Label>
              <Input
                type="number"
                placeholder="Dle tankování"
                value={targetKm}
                onChange={(e) => setTargetKm(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {vehicle && (
            <div className="text-xs text-gray-500 flex items-center gap-4">
              <span>Spotřeba: {vehicle.fuel_consumption || '?'} l/100km</span>
              <span>Palivo: {vehicle.fuel_type}</span>
              <span>Tachometr: {vehicle.current_odometer.toLocaleString('cs-CZ')} km</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={loading || !selectedVehicle}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generuji...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Vygenerovat cesty
                </>
              )}
            </Button>

            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Spotřebuje 1 kredit
            </div>
          </div>

          {/* Generated trips preview */}
          {generatedTrips.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Vygenerované cesty ({generatedTrips.length})
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Celkem: <strong className="text-gray-900 dark:text-white">{totalKm} km</strong></span>
                  {estimatedKm > 0 && (
                    <span>Odhad z PHM: {estimatedKm} km</span>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-1.5">
                {generatedTrips.map((trip, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-1 text-gray-400 w-20 flex-shrink-0">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">
                        {new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-xs truncate">
                        <MapPin className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="truncate">{trip.origin}</span>
                        <span className="text-gray-400 mx-1">&rarr;</span>
                        <MapPin className="h-3 w-3 text-red-500 flex-shrink-0" />
                        <span className="truncate">{trip.destination}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{trip.purpose}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-medium text-xs">
                        {trip.is_round_trip ? `${trip.distance_km}×2` : trip.distance_km} km
                      </div>
                      {trip.is_round_trip && (
                        <Badge variant="outline" className="text-[10px] py-0">zpáteční</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSaveAll}
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ukládám...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Uložit všechny do knihy jízd ({generatedTrips.length} cest)
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
