'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { PlaceAutocomplete } from './place-autocomplete'
import { Loader2, ArrowRight, Calculator } from 'lucide-react'
import type { TravelVehicle, TravelDriver, TravelPlace, TravelTrip, TripType } from '@/lib/types/travel'
import {
  TRIP_TYPE_LABELS,
  PURPOSE_SUGGESTIONS,
  BASIC_RATES_PER_KM,
  calculateReimbursement,
} from '@/lib/types/travel'

const nativeSelectClass = 'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:border-blue-400 transition-colors'

interface TripFormProps {
  trip?: TravelTrip
  vehicles: TravelVehicle[]
  drivers: TravelDriver[]
  places: TravelPlace[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export function TripForm({ trip, vehicles, drivers, places, onSubmit, onCancel }: TripFormProps) {
  const [loading, setLoading] = useState(false)

  // Find defaults
  const defaultVehicle = vehicles[0]
  const defaultDriver = drivers.find(d => d.is_default) || drivers[0]

  const [form, setForm] = useState({
    trip_date: trip?.trip_date || new Date().toISOString().split('T')[0],
    departure_time: trip?.departure_time?.slice(0, 5) || new Date().toTimeString().slice(0, 5),
    arrival_time: trip?.arrival_time?.slice(0, 5) || '',
    vehicle_id: trip?.vehicle_id || defaultVehicle?.id || '',
    driver_id: trip?.driver_id || defaultDriver?.id || '',
    origin: trip?.origin || '',
    destination: trip?.destination || '',
    purpose: trip?.purpose || '',
    trip_type: (trip?.trip_type || 'business') as TripType,
    distance_km: trip?.distance_km?.toString() || '',
    is_round_trip: trip?.is_round_trip || false,
    odometer_start: trip?.odometer_start?.toString() || '',
    odometer_end: trip?.odometer_end?.toString() || '',
    notes: trip?.notes || '',
  })

  // Auto-fill odometer from selected vehicle
  const selectedVehicle = useMemo(() =>
    vehicles.find(v => v.id === form.vehicle_id),
    [vehicles, form.vehicle_id]
  )

  useEffect(() => {
    if (selectedVehicle && !trip) {
      setForm(f => ({
        ...f,
        odometer_start: selectedVehicle.current_odometer?.toString() || f.odometer_start,
      }))
    }
  }, [selectedVehicle, trip])

  // Auto-calculate odometer end (guard against negative values)
  useEffect(() => {
    if (!form.vehicle_id) return
    if (form.odometer_start && form.distance_km) {
      const startNum = Number(form.odometer_start)
      const distNum = Number(form.distance_km)
      if (startNum > 0 && distNum > 0) {
        const effectiveKm = form.is_round_trip ? distNum * 2 : distNum
        const newEnd = startNum + effectiveKm
        setForm(f => ({ ...f, odometer_end: Math.round(newEnd).toString() }))
      }
    }
  }, [form.vehicle_id, form.odometer_start, form.distance_km, form.is_round_trip])

  // Clear odometer when vehicle is deselected
  useEffect(() => {
    if (!form.vehicle_id && !trip) {
      setForm(f => ({ ...f, odometer_start: '', odometer_end: '' }))
    }
  }, [form.vehicle_id, trip])

  const effectiveKm = form.is_round_trip && form.distance_km ? Number(form.distance_km) * 2 : Number(form.distance_km) || 0

  // Two-component reimbursement calculation (§ 157 ZP)
  const reimbursementCalc = useMemo(() => {
    if (!effectiveKm) return null
    const vehicleCategory = selectedVehicle?.vehicle_category || 'car'
    const fuelType = selectedVehicle?.fuel_type || 'petrol'
    const fuelConsumption = selectedVehicle?.fuel_consumption || null

    return calculateReimbursement({
      distanceKm: effectiveKm,
      vehicleCategory,
      fuelConsumptionPer100km: fuelConsumption,
      fuelType,
    })
  }, [effectiveKm, selectedVehicle])

  // Calculate fuel consumption
  const fuelConsumed = useMemo(() => {
    if (!selectedVehicle?.fuel_consumption || !effectiveKm) return null
    return (effectiveKm * selectedVehicle.fuel_consumption / 100)
  }, [selectedVehicle, effectiveKm])

  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Click-outside to close suggestions
  useEffect(() => {
    if (!showSuggestions) return
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSuggestions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const vehicleCategory = selectedVehicle?.vehicle_category || 'car'
      const basicRate = BASIC_RATES_PER_KM[vehicleCategory]

      await onSubmit({
        trip_date: form.trip_date,
        departure_time: form.departure_time || null,
        arrival_time: form.arrival_time || null,
        vehicle_id: form.vehicle_id || null,
        driver_id: form.driver_id || null,
        origin: form.origin,
        destination: form.destination,
        purpose: form.purpose,
        trip_type: form.trip_type,
        distance_km: effectiveKm,
        odometer_start: form.odometer_start ? Number(form.odometer_start) : null,
        odometer_end: form.odometer_end ? Number(form.odometer_end) : null,
        is_round_trip: form.is_round_trip,
        fuel_consumed: fuelConsumed ? Math.round(fuelConsumed * 100) / 100 : null,
        basic_rate_per_km: basicRate,
        rate_per_km: basicRate, // legacy compat
        fuel_price_per_unit: reimbursementCalc?.fuelPriceUsed || null,
        reimbursement: reimbursementCalc?.totalReimbursement || null,
        manual_override: false,
        notes: form.notes || null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 min-w-0">
      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label>Datum *</Label>
          <Input type="date" value={form.trip_date} onChange={e => setForm(f => ({ ...f, trip_date: e.target.value }))} required />
        </div>
        <div>
          <Label>Odjezd</Label>
          <Input type="time" value={form.departure_time} onChange={e => setForm(f => ({ ...f, departure_time: e.target.value }))} />
        </div>
        <div>
          <Label>Příjezd</Label>
          <Input type="time" value={form.arrival_time} onChange={e => setForm(f => ({ ...f, arrival_time: e.target.value }))} />
        </div>
      </div>

      {/* Vehicle & Driver — native selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {vehicles.length > 0 && (
          <div>
            <Label>Vozidlo</Label>
            <select
              value={form.vehicle_id}
              onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}
              className={nativeSelectClass}
            >
              <option value="">Vyberte vozidlo</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>
              ))}
            </select>
          </div>
        )}
        {drivers.length > 0 && (
          <div>
            <Label>Řidič</Label>
            <select
              value={form.driver_id}
              onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}
              className={nativeSelectClass}
            >
              <option value="">Vyberte řidiče</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Origin & Destination */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-end">
          <div>
            <Label>Odkud *</Label>
            <PlaceAutocomplete value={form.origin} onChange={v => setForm(f => ({ ...f, origin: v }))} places={places} placeholder="Odkud..." />
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground mb-2 hidden sm:block" />
          <div>
            <Label>Kam *</Label>
            <PlaceAutocomplete value={form.destination} onChange={v => setForm(f => ({ ...f, destination: v }))} places={places} placeholder="Kam..." />
          </div>
        </div>
      </div>

      {/* Purpose */}
      <div className="relative" ref={suggestionsRef}>
        <Label>Účel jízdy *</Label>
        <Input
          value={form.purpose}
          onChange={e => { setForm(f => ({ ...f, purpose: e.target.value })); setShowSuggestions(false) }}
          onFocus={() => setShowSuggestions(!form.purpose)}
          placeholder="Např. Jednání s klientem"
          required
        />
        {showSuggestions && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-auto">
            {PURPOSE_SUGGESTIONS.map(s => (
              <button key={s} type="button"
                onClick={() => { setForm(f => ({ ...f, purpose: s })); setShowSuggestions(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Trip type — native select */}
      <div>
        <Label>Typ jízdy</Label>
        <select
          value={form.trip_type}
          onChange={e => setForm(f => ({ ...f, trip_type: e.target.value as TripType }))}
          className={nativeSelectClass}
        >
          {Object.entries(TRIP_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Distance */}
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <Label>Vzdálenost (km) *</Label>
          <Input type="number" step="0.1" value={form.distance_km}
            onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))}
            placeholder="25" required />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Switch checked={form.is_round_trip} onCheckedChange={v => setForm(f => ({ ...f, is_round_trip: v }))} />
          <Label className="whitespace-nowrap cursor-pointer">
            Zpáteční jízda?
          </Label>
        </div>
      </div>

      {form.is_round_trip && form.distance_km && (
        <p className="text-sm text-muted-foreground -mt-3">
          Celkem: {effectiveKm} km (zpáteční)
        </p>
      )}

      {/* Odometer */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tachometr začátek</Label>
          <Input type="number" value={form.odometer_start}
            onChange={e => setForm(f => ({ ...f, odometer_start: e.target.value }))} />
        </div>
        <div>
          <Label>Tachometr konec</Label>
          <Input type="number" value={form.odometer_end}
            onChange={e => setForm(f => ({ ...f, odometer_end: e.target.value }))} />
        </div>
      </div>

      {/* Reimbursement calculation (read-only) */}
      {reimbursementCalc && effectiveKm > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Náhrada za jízdu</span>
            </div>

            {/* Basic rate */}
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                Základní náhrada: {effectiveKm} km × {reimbursementCalc.basicRate.toFixed(2)} Kč
              </span>
              <span className="font-medium">{reimbursementCalc.basicReimbursement.toFixed(2)} Kč</span>
            </div>

            {/* Fuel reimbursement */}
            {selectedVehicle?.fuel_consumption ? (
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">
                  Náhrada za PHM: {effectiveKm} km × {selectedVehicle.fuel_consumption}/100 l × {reimbursementCalc.fuelPriceUsed.toFixed(2)} Kč
                </span>
                <span className="font-medium">{reimbursementCalc.fuelReimbursement.toFixed(2)} Kč</span>
              </div>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                Doplňte spotřebu v nastavení vozidla pro výpočet náhrady za PHM
              </p>
            )}

            {/* Total */}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-blue-200 dark:border-blue-700 mt-2">
              <span className="font-semibold">Celkem</span>
              <span className="font-bold text-lg text-blue-700 dark:text-blue-400">
                {reimbursementCalc.totalReimbursement.toFixed(2)} Kč
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div>
        <Label>Poznámka</Label>
        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Volitelná poznámka..." rows={2} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Zrušit</Button>
        <Button type="submit" disabled={loading || !form.origin || !form.destination || !form.purpose || !form.distance_km}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {trip ? 'Uložit změny' : 'Zapsat jízdu'}
        </Button>
      </div>
    </form>
  )
}
