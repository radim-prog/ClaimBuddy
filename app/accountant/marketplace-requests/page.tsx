'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Users, CheckCircle2, XCircle, Clock, Building2, Mail, MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

interface MarketplaceRequest {
  id: string
  client_name: string | null
  client_email: string | null
  company_name: string | null
  company_ico: string | null
  status: string
  message: string | null
  business_type: string | null
  budget_range: string | null
  created_at: string
  responded_at: string | null
}

const BUDGET_LABELS: Record<string, string> = {
  do_2000: 'Do 2 000 Kč/měs',
  '2000_5000': '2 000 – 5 000 Kč/měs',
  '5000_10000': '5 000 – 10 000 Kč/měs',
  nad_10000: 'Nad 10 000 Kč/měs',
  neznam: 'Nezadáno',
}

export default function MarketplaceRequestsPage() {
  const { userRole } = useAccountantUser()
  const isAdmin = userRole === 'admin'
  const [requests, setRequests] = useState<MarketplaceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [providerRegistered, setProviderRegistered] = useState(true)
  const [tab, setTab] = useState('pending')
  const [responding, setResponding] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null)

  const fetchRequests = (status?: string) => {
    const url = status ? `/api/accountant/marketplace-requests?status=${status}` : '/api/accountant/marketplace-requests'
    fetch(url)
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(data => {
        setRequests(data.requests || [])
        setProviderRegistered(data.provider_registered !== false)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRequests(tab === 'all' ? undefined : tab)
  }, [tab])

  const handleAction = async (requestId: string, action: 'accept' | 'reject') => {
    setResponding(requestId)
    try {
      const res = await fetch('/api/accountant/marketplace-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          action,
          rejection_reason: action === 'reject' ? rejectReason : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Chyba při zpracování')
        return
      }
      toast.success(action === 'accept' ? 'Žádost přijata — klient přiřazen' : 'Žádost zamítnuta')
      setShowRejectDialog(null)
      setRejectReason('')
      fetchRequests(tab === 'all' ? undefined : tab)
    } catch {
      toast.error('Chyba při zpracování')
    } finally {
      setResponding(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!providerRegistered && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
        <h1 className="text-xl font-bold mb-2">Marketplace</h1>
        <p className="text-muted-foreground mb-4">
          Pro přijímání žádostí od klientů se nejprve zaregistrujte v marketplace.
        </p>
        <Button asChild>
          <a href="/accountant/marketplace/register">Zaregistrovat se</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Žádosti od klientů</h1>
        <p className="text-sm text-muted-foreground">Klienti, kteří vás chtějí oslovit přes marketplace</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-1" />
            Čekající
          </TabsTrigger>
          <TabsTrigger value="accepted">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Přijaté
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="h-4 w-4 mr-1" />
            Zamítnuté
          </TabsTrigger>
          <TabsTrigger value="all">Všechny</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {requests.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">Žádné žádosti</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map(req => (
                <Card key={req.id} className="rounded-xl">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{req.client_name || 'Neznámý klient'}</h3>
                          {req.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-md text-xs font-medium">
                              Čeká
                            </span>
                          )}
                          {req.status === 'accepted' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md text-xs font-medium">
                              Přijato
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-md text-xs font-medium">
                              Zamítnuto
                            </span>
                          )}
                        </div>

                        {req.company_name && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {req.company_name}
                            {req.company_ico && ` (IČO: ${req.company_ico})`}
                          </p>
                        )}

                        {req.client_email && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                            <Mail className="h-3.5 w-3.5" />
                            {req.client_email}
                          </p>
                        )}

                        <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                          {req.business_type && <span>{req.business_type}</span>}
                          {req.budget_range && <span>· {BUDGET_LABELS[req.budget_range] || req.budget_range}</span>}
                          <span>· {new Date(req.created_at).toLocaleDateString('cs-CZ')}</span>
                        </div>

                        {req.message && (
                          <div className="mt-3 bg-muted/50 rounded-lg p-3 text-sm">
                            {req.message}
                          </div>
                        )}
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={responding === req.id}
                            onClick={() => handleAction(req.id, 'accept')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Přijmout
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={responding === req.id}
                            onClick={() => setShowRejectDialog(req.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Odmítnout
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowRejectDialog(null)}>
          <div className="bg-background rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Důvod odmítnutí</h3>
            <textarea
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="Volitelné — proč žádost zamítáte?"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowRejectDialog(null)}>Zrušit</Button>
              <Button variant="destructive" className="flex-1" onClick={() => handleAction(showRejectDialog, 'reject')} disabled={responding === showRejectDialog}>
                Odmítnout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
