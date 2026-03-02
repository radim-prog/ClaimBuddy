'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FUEL_TYPE_LABELS } from '@/lib/types/asset'
import type { TravelVehicle, FuelType, VehicleCategory } from '@/lib/types/travel'
import { VEHICLE_CATEGORY_LABELS, BASIC_RATES_PER_KM, DECREE_FUEL_PRICES } from '@/lib/types/travel'
import { Loader2, Info } from 'lucide-react'

interface VehicleFormProps {
  vehicle?: TravelVehicle
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export function VehicleForm({ vehicle, onSubmit, onCancel }: VehicleFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: vehicle?.name || '',
    license_plate: vehicle?.license_plate || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year?.toString() || '',
    vin: vehicle?.vin || '',
    fuel_type: vehicle?.fuel_type || 'petrol' as FuelType,
    fuel_consumption: vehicle?.fuel_consumption?.toString() || '',
    tank_capacity: vehicle?.tank_capacity?.toString() || '',
    current_fuel_level: vehicle?.current_fuel_level?.toString() || '',
    current_odometer: vehicle?.current_odometer?.toString() || '0',
    vehicle_category: vehicle?.vehicle_category || 'car' as VehicleCategory,
    is_company_car: vehicle?.is_company_car ?? true,
  })

  const basicRate = BASIC_RATES_PER_KM[form.vehicle_category] || BASIC_RATES_PER_KM.car
  const fuelKey = form.fuel_type === 'hybrid' ? 'petrol' : form.fuel_type
  const fuelPrice = DECREE_FUEL_PRICES[fuelKey]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        name: form.name || `${form.brand} ${form.model} - ${form.license_plate}`.trim(),
        license_plate: form.license_plate,
        brand: form.brand || null,
        model: form.model || null,
        year: form.year ? Number(form.year) : null,
        vin: form.vin || null,
        fuel_type: form.fuel_type,
        fuel_consumption: form.fuel_consumption ? Number(form.fuel_consumption) : null,
        tank_capacity: form.tank_capacity ? Number(form.tank_capacity) : null,
        current_fuel_level: form.current_fuel_level ? Number(form.current_fuel_level) : null,
        current_odometer: Number(form.current_odometer) || 0,
        vehicle_category: form.vehicle_category,
        rate_per_km: basicRate, // auto-set from law based on category
        is_company_car: form.is_company_car,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>SPZ *</Label>
          <Input value={form.license_plate} onChange={e => setForm(f => ({ ...f, license_plate: e.target.value.toUpperCase() }))} placeholder="1AB 2345" required />
        </div>
        <div>
          <Label>Nazev vozidla</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Skoda Octavia" />
        </div>
        <div>
          <Label>Typ vozidla</Label>
          <Select value={form.vehicle_category} onValueChange={v => setForm(f => ({ ...f, vehicle_category: v as VehicleCategory }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(VEHICLE_CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Typ paliva</Label>
          <Select value={form.fuel_type} onValueChange={v => setForm(f => ({ ...f, fuel_type: v as FuelType }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(FUEL_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Znacka</Label>
          <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Skoda" />
        </div>
        <div>
          <Label>Model</Label>
          <Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Octavia" />
        </div>
        <div>
          <Label>Rok vyroby</Label>
          <Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2022" />
        </div>
        <div>
          <Label>VIN</Label>
          <Input value={form.vin} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} placeholder="TMBJG..." />
        </div>
        <div>
          <Label>Spotreba z technickeho prukazu (l/100km) *</Label>
          <Input type="number" step="0.1" value={form.fuel_consumption} onChange={e => setForm(f => ({ ...f, fuel_consumption: e.target.value }))} placeholder="6.5" />
          <p className="text-xs text-muted-foreground mt-1">Kombinovany provoz dle norem EU (z TP)</p>
        </div>
        <div>
          <Label>Stav tachometru (km)</Label>
          <Input type="number" value={form.current_odometer} onChange={e => setForm(f => ({ ...f, current_odometer: e.target.value }))} placeholder="50000" />
        </div>
        <div>
          <Label>Objem nadrze (l)</Label>
          <Input type="number" step="1" value={form.tank_capacity} onChange={e => setForm(f => ({ ...f, tank_capacity: e.target.value }))} placeholder="50" />
        </div>
        <div>
          <Label>Aktualni stav nadrze (l)</Label>
          <Input type="number" step="0.1" value={form.current_fuel_level} onChange={e => setForm(f => ({ ...f, current_fuel_level: e.target.value }))} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={form.is_company_car} onCheckedChange={v => setForm(f => ({ ...f, is_company_car: v }))} />
        <Label>Firemni vozidlo</Label>
      </div>

      {/* Legal rates info (read-only) */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
          <Info className="h-3.5 w-3.5" />
          Zakonne sazby 2026 (vyhl. 573/2025 Sb.)
        </div>
        <p>Zakladni nahrada: <strong>{basicRate} Kc/km</strong> ({VEHICLE_CATEGORY_LABELS[form.vehicle_category]})</p>
        {fuelPrice && (
          <p>Prumerna cena PHM: <strong>{fuelPrice.price} {fuelPrice.unit}</strong> ({fuelPrice.label})</p>
        )}
        {form.fuel_consumption && (
          <p>
            Nahrada na 1 km: {basicRate} + {Number(form.fuel_consumption) / 100 * (fuelPrice?.price || 0) > 0
              ? `${(Number(form.fuel_consumption) / 100 * (fuelPrice?.price || 0)).toFixed(2)}`
              : '?'} = <strong>{(basicRate + Number(form.fuel_consumption) / 100 * (fuelPrice?.price || 0)).toFixed(2)} Kc/km</strong>
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Zrusit</Button>
        <Button type="submit" disabled={loading || !form.license_plate}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {vehicle ? 'Ulozit' : 'Pridat vozidlo'}
        </Button>
      </div>
    </form>
  )
}
