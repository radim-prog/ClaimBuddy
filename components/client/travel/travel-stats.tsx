'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Car, Route, Banknote, Fuel } from 'lucide-react'
import type { TravelStats } from '@/lib/types/travel'

interface TravelStatsCardsProps {
  stats: TravelStats
  label?: string
}

export function TravelStatsCards({ stats, label }: TravelStatsCardsProps) {
  const cards = [
    { icon: Car, label: 'Jizdy', value: stats.total_trips, suffix: '', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
    { icon: Route, label: 'Celkem km', value: stats.total_km.toLocaleString('cs'), suffix: ' km', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
    { icon: Banknote, label: 'Nahrada', value: stats.total_reimbursement.toLocaleString('cs'), suffix: ' Kc', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
    { icon: Fuel, label: 'Palivo', value: stats.total_fuel_cost.toLocaleString('cs'), suffix: ' Kc', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' },
  ]

  return (
    <div>
      {label && <h3 className="text-sm font-medium text-muted-foreground mb-2">{label}</h3>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(c => (
          <Card key={c.label} className="rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${c.color}`}>
                  <c.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-sm font-bold">{c.value}{c.suffix}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.trips_by_vehicle.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Dle vozidla</h4>
          <div className="space-y-1.5">
            {stats.trips_by_vehicle.map(v => (
              <div key={v.license_plate} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                <div>
                  <span className="font-medium">{v.vehicle_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{v.license_plate}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{v.km.toLocaleString('cs')} km</span>
                  <span className="text-xs text-muted-foreground ml-2">({v.trips} jizd)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(stats.business_km > 0 || stats.private_km > 0) && (
        <div className="mt-3 flex gap-3 text-xs">
          <span>Sluzebni: <strong>{stats.business_km.toLocaleString('cs')} km</strong></span>
          <span>Soukrome: <strong>{stats.private_km.toLocaleString('cs')} km</strong></span>
        </div>
      )}
    </div>
  )
}
