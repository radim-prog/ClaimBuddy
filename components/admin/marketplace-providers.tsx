'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Store, CheckCircle2, XCircle, Pause, Star, StarOff,
  MapPin, Mail, Phone, Globe, ChevronDown, ChevronUp, Clock,
} from 'lucide-react'

interface Provider {
  id: string
  name: string
  ico: string
  dic: string | null
  email: string
  phone: string | null
  website: string | null
  city: string
  region: string | null
  description: string | null
  specializations: string[]
  services: string[]
  capacity_status: string
  min_price: number | null
  max_price: number | null
  status: string
  featured: boolean
  rejection_reason: string | null
  verified_at: string | null
  registered_by_name: string | null
  registered_by_email: string | null
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Čeká', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  verified: { label: 'Ověřeno', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: 'Zamítnuto', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  suspended: { label: 'Pozastaveno', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

export function MarketplaceProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/admin/marketplace?status=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setProviders(data.providers || [])
      }
    } catch {
      toast.error('Chyba při načítání')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProviders() }, [filter])

  const handleAction = async (id: string, action: string, extra?: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/accountant/admin/marketplace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, ...extra }),
      })
      if (res.ok) {
        const labels: Record<string, string> = {
          verify: 'Ověřeno', reject: 'Zamítnuto', suspend: 'Pozastaveno',
        }
        toast.success(labels[action] || 'Aktualizováno')
        setRejectReason('')
        fetchProviders()
      } else {
        toast.error('Chyba')
      }
    } catch {
      toast.error('Chyba')
    }
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      const res = await fetch('/api/accountant/admin/marketplace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, featured }),
      })
      if (res.ok) {
        toast.success(featured ? 'Označeno jako doporučené' : 'Doporučení zrušeno')
        fetchProviders()
      }
    } catch {
      toast.error('Chyba')
    }
  }

  const pendingCount = providers.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending', 'verified', 'rejected', 'all'] as const).map(s => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === 'pending' ? 'Čekající' : s === 'verified' ? 'Ověřené' : s === 'rejected' ? 'Zamítnuté' : 'Vše'}
            {s === 'pending' && pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1.5">{pendingCount}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-muted-foreground py-6">Načítání...</p>
      ) : providers.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          <Store className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Žádné registrace
        </p>
      ) : (
        <div className="space-y-2">
          {providers.map(p => {
            const sc = statusConfig[p.status] || statusConfig.pending
            const isExpanded = expandedId === p.id

            return (
              <div key={p.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      {p.featured && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sc.color}`}>{sc.label}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                      <span>IČO: {p.ico}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(p.created_at).toLocaleDateString('cs-CZ')}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t bg-gray-50/50 dark:bg-gray-800/30 space-y-3 pt-3">
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {p.email}
                      </div>
                      {p.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {p.phone}
                        </div>
                      )}
                      {p.website && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          {p.website}
                        </div>
                      )}
                      {p.dic && <div>DIČ: {p.dic}</div>}
                    </div>

                    {p.description && (
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    )}

                    {p.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.specializations.map(s => (
                          <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
                        ))}
                      </div>
                    )}

                    {p.services.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.services.map(s => (
                          <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 dark:bg-blue-900/20">{s}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Ceník: {p.min_price || '?'} – {p.max_price || '?'} Kč/měs
                      {' | '}Kapacita: {p.capacity_status === 'accepting' ? 'Přijímá' : p.capacity_status === 'limited' ? 'Omezená' : 'Plná'}
                    </div>

                    {p.registered_by_name && (
                      <div className="text-xs text-muted-foreground">
                        Registroval: {p.registered_by_name} ({p.registered_by_email})
                      </div>
                    )}

                    {p.rejection_reason && (
                      <div className="text-xs text-red-600">Důvod zamítnutí: {p.rejection_reason}</div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      {p.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => handleAction(p.id, 'verify')}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Schválit
                          </Button>
                          <div className="flex gap-1 items-center">
                            <Input
                              placeholder="Důvod zamítnutí..."
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              className="h-8 text-xs w-48"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleAction(p.id, 'reject', { rejection_reason: rejectReason })}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Zamítnout
                            </Button>
                          </div>
                        </>
                      )}
                      {p.status === 'verified' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleAction(p.id, 'suspend')}>
                            <Pause className="h-3.5 w-3.5 mr-1" /> Pozastavit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleFeatured(p.id, !p.featured)}
                          >
                            {p.featured
                              ? <><StarOff className="h-3.5 w-3.5 mr-1" /> Zrušit doporučení</>
                              : <><Star className="h-3.5 w-3.5 mr-1" /> Doporučit</>
                            }
                          </Button>
                        </>
                      )}
                      {(p.status === 'rejected' || p.status === 'suspended') && (
                        <Button size="sm" onClick={() => handleAction(p.id, 'verify')}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Schválit
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
