'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Car, Pencil, Trash2, Fuel, Gauge } from 'lucide-react'
import { FuelGauge } from './fuel-gauge'
import { FUEL_TYPE_LABELS } from '@/lib/types/asset'
import type { TravelVehicle } from '@/lib/types/travel'
import { BASIC_RATES_PER_KM, DECREE_FUEL_PRICES, VEHICLE_CATEGORY_LABELS } from '@/lib/types/travel'

interface VehicleCardProps {
  vehicle: TravelVehicle
  onEdit: (v: TravelVehicle) => void
  onDelete: (id: string) => void
}

export function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
              <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{vehicle.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs font-mono">{vehicle.license_plate}</Badge>
                {vehicle.fuel_type && (
                  <span className="text-xs">{FUEL_TYPE_LABELS[vehicle.fuel_type] || vehicle.fuel_type}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(vehicle)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(vehicle.id)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Tachometr:</span>
            <span className="font-medium">{vehicle.current_odometer.toLocaleString('cs')} km</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Sazba:</span>
            <span className="font-medium">{BASIC_RATES_PER_KM[vehicle.vehicle_category || 'car']} Kc/km</span>
          </div>
        </div>

        {vehicle.fuel_consumption && (
          <div className="mt-2 text-sm text-muted-foreground">
            <Fuel className="h-3.5 w-3.5 inline mr-1" />
            Spotreba: {vehicle.fuel_consumption} l/100km
          </div>
        )}

        {vehicle.tank_capacity && (
          <div className="mt-2">
            <FuelGauge currentLevel={vehicle.current_fuel_level} tankCapacity={vehicle.tank_capacity} />
          </div>
        )}

        <div className="mt-2 flex gap-1.5">
          {vehicle.is_company_car && <Badge variant="secondary" className="text-xs">Firemni</Badge>}
          {!vehicle.is_company_car && <Badge variant="outline" className="text-xs">Soukrome</Badge>}
          {vehicle.brand && vehicle.model && (
            <Badge variant="outline" className="text-xs">{vehicle.brand} {vehicle.model}</Badge>
          )}
          {vehicle.year && <Badge variant="outline" className="text-xs">{vehicle.year}</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}
