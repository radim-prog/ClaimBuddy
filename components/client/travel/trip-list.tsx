'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, ArrowRight, Calendar, Pencil, Trash2, Car } from 'lucide-react'
import type { TravelTrip } from '@/lib/types/travel'
import { TRIP_TYPE_LABELS, TripType } from '@/lib/types/travel'

interface TripListProps {
  trips: TravelTrip[]
  onEdit: (trip: TravelTrip) => void
  onDelete: (id: string) => void
  readOnly?: boolean
}

const tripTypeColors: Record<TripType, string> = {
  business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  private: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  commute: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

export function TripList({ trips, onEdit, onDelete, readOnly }: TripListProps) {
  if (trips.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Car className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Zatim zadne jizdy</p>
        <p className="text-sm mt-1">Zapiste svou prvni jizdu</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {trips.map(trip => (
        <Card key={trip.id} className="rounded-xl hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {/* Route */}
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span className="truncate">{trip.origin}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{trip.destination}</span>
                  {trip.is_round_trip && (
                    <Badge variant="outline" className="text-[10px] shrink-0 ml-1">zpet</Badge>
                  )}
                </div>

                {/* Details row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(trip.trip_date).toLocaleDateString('cs')}
                  </span>
                  {trip.departure_time && (
                    <span>{trip.departure_time.slice(0, 5)}</span>
                  )}
                  <span className="font-medium text-foreground">{trip.distance_km} km</span>
                  {trip.vehicle_license_plate && (
                    <span className="font-mono">{trip.vehicle_license_plate}</span>
                  )}
                  {trip.driver_name && <span>{trip.driver_name}</span>}
                </div>

                {/* Purpose */}
                <p className="text-xs text-muted-foreground mt-1 truncate">{trip.purpose}</p>
              </div>

              {/* Right side: type badge + reimbursement + actions */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge className={`text-[10px] ${tripTypeColors[trip.trip_type as TripType] || ''}`} variant="secondary">
                  {TRIP_TYPE_LABELS[trip.trip_type as TripType] || trip.trip_type}
                </Badge>
                {trip.reimbursement != null && trip.reimbursement > 0 && (
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {trip.reimbursement.toLocaleString('cs')} Kc
                  </span>
                )}
                {!readOnly && (
                  <div className="flex gap-0.5 mt-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(trip)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => onDelete(trip.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
