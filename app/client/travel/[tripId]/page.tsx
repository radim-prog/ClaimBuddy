'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { TripForm } from '@/components/client/travel/trip-form'
import { toast } from 'sonner'
import type { TravelTrip, TravelVehicle, TravelDriver, TravelPlace } from '@/lib/types/travel'

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [trip, setTrip] = useState<TravelTrip | null>(null)
  const [vehicles, setVehicles] = useState<TravelVehicle[]>([])
  const [drivers, setDrivers] = useState<TravelDriver[]>([])
  const [places, setPlaces] = useState<TravelPlace[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [tripRes, vRes, dRes, pRes] = await Promise.all([
          fetch(`/api/client/travel/trips/${params.tripId}`),
          fetch('/api/client/travel/vehicles'),
          fetch('/api/client/travel/drivers'),
          fetch('/api/client/travel/places'),
        ])
        const [tripData, vData, dData, pData] = await Promise.all([
          tripRes.json(), vRes.json(), dRes.json(), pRes.json(),
        ])
        setTrip(tripData.trip || null)
        setVehicles(vData.vehicles || [])
        setDrivers(dData.drivers || [])
        setPlaces(pData.places || [])
      } catch (err) {
        console.error('Failed to load:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.tripId])

  const handleUpdate = async (data: any) => {
    const res = await fetch(`/api/client/travel/trips/${params.tripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed')
    toast.success('Jizda aktualizovana')
    router.push('/client/travel')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Jizda nenalezena</p>
        <Link href="/client/travel"><Button variant="link">Zpet na seznam</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/client/travel">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Zpet</Button>
        </Link>
        <h1 className="text-xl font-bold">Detail jizdy</h1>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-4 sm:p-6">
          <TripForm
            trip={trip}
            vehicles={vehicles}
            drivers={drivers}
            places={places}
            onSubmit={handleUpdate}
            onCancel={() => router.push('/client/travel')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
