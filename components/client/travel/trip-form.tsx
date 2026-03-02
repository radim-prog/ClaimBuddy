'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { PlaceAutocomplete } from './place-autocomplete'
import { Loader2, ArrowRight, RotateCcw, Calculator, Info } from 'lucide-react'
import type { TravelVehicle, TravelDriver, TravelPlace, TravelTrip, TripType } from '@/lib/types/travel'
import { TRIP_TYPE_LABELS, PURPOSE_SUGGESTIONS, DEFAULT_RATES } from '@/lib/types/travel'

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

  // Rate from vehicle settings (not editable per trip)
  const ratePerKm = selectedVehicle?.rate_per_km ?? DEFAULT_RATES.car

  useEffect(() => {
    if (selectedVehicle && !trip) {
      setForm(f => ({
        ...f,
        odometer_start: selectedVehicle.current_odometer?.toString() || f.odometer_start,
      }))
    }
  }, [selectedVehicle, trip])

  // Auto-calculate odometer end
  useEffect(() => {
    if (form.odometer_start && form.distance_km) {
      const effectiveKm = form.is_round_trip ? Number(form.distance_km) * 2 : Number(form.distance_km)
      const newEnd = Number(form.odometer_start) + effectiveKm
      setForm(f => ({ ...f, odometer_end: Math.round(newEnd).toString() }))
    }
  }, [form.odometer_start, form.distance_km, form.is_round_trip])

  // Auto-calculated reimbursement (read-only, based on vehicle rate)
  const reimbursement = useMemo(() => {
    if (!form.distance_km) return 0
    const effectiveKm = form.is_round_trip ? Number(form.distance_km) * 2 : Number(form.distance_km)
    return effectiveKm * ratePerKm
  }, [form.distance_km, form.is_round_trip, ratePerKm])

  // Calculate fuel consumption
  const fuelConsumed = useMemo(() => {
    if (!selectedVehicle?.fuel_consumption || !form.distance_km) return null
    const effectiveKm = form.is_round_trip ? Number(form.distance_km) * 2 : Number(form.distance_km)
    return (effectiveKm * selectedVehicle.fuel_consumption / 100)
  }, [selectedVehicle, form.distance_km, form.is_round_trip])

  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const effectiveKm = form.is_round_trip ? Number(form.distance_km) * 2 : Number(form.distance_km)
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
        rate_per_km: ratePerKm,
        reimbursement: reimbursement ? Math.round(reimbursement * 100) / 100 : null,
        manual_override: false,
        notes: form.notes || null,
      })
    } finally {
      setLoading(false)
    }
  }

  const effectiveKm = form.is_round_trip && form.distance_km ? Number(form.distance_km) * 2 : Number(form.distance_km) || 0

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
          <Label>Prijezd</Label>
          <Input type="time" value={form.arrival_time} onChange={e => setForm(f => ({ ...f, arrival_time: e.target.value }))} />
        </div>
      </div>

      {/* Vehicle & Driver */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {vehicles.length > 0 && (
          <div>
            <Label>Vozidlo</Label>
            <Select value={form.vehicle_id} onValueChange={v => setForm(f => ({ ...f, vehicle_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Vyberte vozidlo" /></SelectTrigger>
              <SelectContent>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name} ({v.license_plate})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {drivers.length > 0 && (
          <div>
            <Label>Ridic</Label>
            <Select value={form.driver_id} onValueChange={v => setForm(f => ({ ...f, driver_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Vyberte ridice" /></SelectTrigger>
              <SelectContent>
                {drivers.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <ArrowRight className="h-5 w-5 text-muted-foreground mb-2" />
          <div>
            <Label>Kam *</Label>
            <PlaceAutocomplete value={form.destination} onChange={v => setForm(f => ({ ...f, destination: v }))} places={places} placeholder="Kam..." />
          </div>
        </div>
      </div>

      {/* Purpose */}
      <div className="relative">
        <Label>Ucel jizdy *</Label>
        <Input
          value={form.purpose}
          onChange={e => { setForm(f => ({ ...f, purpose: e.target.value })); setShowSuggestions(false) }}
          onFocus={() => setShowSuggestions(!form.purpose)}
          placeholder="Napr. Jednani s klientem"
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

      {/* Trip type */}
      <div>
        <Label>Typ jizdy</Label>
        <Select value={form.trip_type} onValueChange={v => setForm(f => ({ ...f, trip_type: v as TripType }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(TRIP_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Distance */}
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <Label>Vzdalenost (km) *</Label>
          <Input type="number" step="0.1" value={form.distance_km}
            onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))}
            placeholder="25" required />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Switch checked={form.is_round_trip} onCheckedChange={v => setForm(f => ({ ...f, is_round_trip: v }))} />
          <Label className="flex items-center gap-1 whitespace-nowrap">
            <RotateCcw className="h-3.5 w-3.5" />
            Zpet
          </Label>
        </div>
      </div>

      {form.is_round_trip && form.distance_km && (
        <p className="text-sm text-muted-foreground -mt-3">
          Celkem: {effectiveKm} km (zpateční)
        </p>
      )}

      {/* Odometer */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tachometr start</Label>
          <Input type="number" value={form.odometer_start}
            onChange={e => setForm(f => ({ ...f, odometer_start: e.target.value }))} />
        </div>
        <div>
          <Label>Tachometr konec</Label>
          <Input type="number" value={form.odometer_end}
            onChange={e => setForm(f => ({ ...f, odometer_end: e.target.value }))} />
        </div>
      </div>

      {/* Reimbursement summary (read-only, calculated from vehicle settings) */}
      {effectiveKm > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Nahrada</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {effectiveKm} km × {ratePerKm.toFixed(2)} Kc/km
              </span>
              <span className="font-bold text-lg text-blue-700 dark:text-blue-400">
                {reimbursement.toFixed(2)} Kc
              </span>
            </div>
            {fuelConsumed && (
              <p className="text-xs text-muted-foreground mt-1">
                Odhadovana spotreba: {fuelConsumed.toFixed(1)} l
              </p>
            )}
            <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <span>Sazba {ratePerKm.toFixed(2)} Kc/km je nastavena u vozidla{selectedVehicle ? ` (${selectedVehicle.license_plate})` : ''}. Zmenit lze v nastaveni vozidla.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div>
        <Label>Poznamka</Label>
        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Volitelna poznamka..." rows={2} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Zrusit</Button>
        <Button type="submit" disabled={loading || !form.origin || !form.destination || !form.purpose || !form.distance_km}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {trip ? 'Ulozit zmeny' : 'Zapsat jizdu'}
        </Button>
      </div>
    </form>
  )
}
