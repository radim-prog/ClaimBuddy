'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building2, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'

type FirmClient = {
  id: string
  name: string
  ico: string
  status: string
  legal_form?: string
  has_employees?: boolean
  managing_director?: string | null
}

const statusLabels: Record<string, string> = {
  active: 'Aktivní',
  onboarding: 'Onboarding',
  paused: 'Pozastaveno',
  churned: 'Ukončeno',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  onboarding: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  churned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

export default function FirmClientsPage() {
  const [clients, setClients] = useState<FirmClient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/accountant/companies')
      .then(r => r.ok ? r.json() : { companies: [] })
      .then(data => setClients(data.companies || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.ico?.includes(search)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hledat klienta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} klientů</span>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">Žádní klienti</p>
            ) : (
              filtered.map(client => (
                <Link key={client.id} href={`/accountant/clients/${client.id}`}>
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</p>
                        <p className="text-xs text-gray-500">IČO: {client.ico}</p>
                      </div>
                    </div>
                    <Badge className={statusColors[client.status] || statusColors.active} variant="secondary">
                      {statusLabels[client.status] || client.status}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
