'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TripForm } from '@/components/client/travel/trip-form'
import { toast } from 'sonner'
import type { TravelVehicle, TravelDriver, TravelPlace } from '@/lib/types/travel'

interface TripOverlayProps {
  open: boolean
  onClose: () => void
}

export function TripOverlay({ open, onClose }: TripOverlayProps) {
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<TravelVehicle[]>([])
  const [drivers, setDrivers] = useState<TravelDriver[]>([])
  const [places, setPlaces] = useState<TravelPlace[]>([])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      fetch('/api/client/travel/vehicles').then(r => r.json()),
      fetch('/api/client/travel/drivers').then(r => r.json()),
      fetch('/api/client/travel/places').then(r => r.json()),
    ])
      .then(([vData, dData, pData]) => {
        setVehicles(vData.vehicles || [])
        setDrivers(dData.drivers || [])
        setPlaces(pData.places || [])
      })
      .catch(() => toast.error('Nepodařilo se načíst data'))
      .finally(() => setLoading(false))
  }, [open])

  const handleSubmit = async (data: any) => {
    const res = await fetch('/api/client/travel/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed')
    toast.success('Jízda zapsána')
    onClose()
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60]',
        'bg-background md:bg-black/50 md:backdrop-blur-sm',
        'flex flex-col md:items-center md:justify-center md:p-6',
        'transition-all duration-300 ease-out',
        open ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:opacity-0 pointer-events-none',
      )}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex flex-col flex-1 md:flex-initial w-full md:max-w-2xl md:max-h-[85vh] md:rounded-2xl md:shadow-2xl md:bg-background overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h2 className="text-lg font-bold font-display">Zapsat jízdu</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {open && (
            loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <TripForm
                vehicles={vehicles}
                drivers={drivers}
                places={places}
                onSubmit={handleSubmit}
                onCancel={onClose}
              />
            )
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
