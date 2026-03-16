'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  RefreshCw,
  Users,
  Zap,
  BarChart3,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

type MarketingOverview = {
  ecomail: {
    lists: Array<{ id: number; name: string; subscriber_count: number }> | null
    campaigns: Array<{
      id: number
      name: string
      status: string
      sent?: number
      opened?: number
      clicked?: number
    }> | null
    automations: Array<{ id: string; name: string; status: string }> | null
  } | null
  stats: {
    totalUsers: number
    marketingOptIn: number
    trialUsers: number
    planCounts: Record<string, number>
  }
}

export function OperationsMarketing() {
  const [data, setData] = useState<MarketingOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/accountant/marketing')
      if (res.ok) setData(await res.json())
    } catch {
      // silently fail
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/accountant/marketing/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(
          `Synchronizace: ${result.synced} kontaktu, ${result.errors} chyb`
        )
        fetchData()
      } else {
        toast.error(result.error || 'Chyba pri synchronizaci')
      }
    } catch {
      toast.error('Chyba pri synchronizaci')
    } finally {
      setSyncing(false)
    }
  }

  const campaigns = Array.isArray(data?.ecomail?.campaigns)
    ? data!.ecomail!.campaigns!
    : []
  const automations = Array.isArray(data?.ecomail?.automations)
    ? data!.ecomail!.automations!
    : []
  const lists = Array.isArray(data?.ecomail?.lists)
    ? data!.ecomail!.lists!
    : []

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data?.ecomail ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Ecomail pripojen
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400">
                {loading ? 'Nacitam...' : 'Ecomail neni nakonfigurovan'}
              </span>
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`}
          />
          {syncing ? 'Synchronizace...' : 'Sync kontaktu'}
        </Button>
      </div>

      {/* Stats cards */}
      {data?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="rounded-xl shadow-soft-sm">
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 mx-auto text-purple-500 mb-1" />
              <p className="text-xl font-bold">{data.stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">
                Celkem uzivatelu
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-soft-sm">
            <CardContent className="p-3 text-center">
              <Mail className="h-5 w-5 mx-auto text-blue-500 mb-1" />
              <p className="text-xl font-bold">{data.stats.marketingOptIn}</p>
              <p className="text-xs text-muted-foreground">
                Marketing opt-in
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-soft-sm">
            <CardContent className="p-3 text-center">
              <Zap className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-xl font-bold">{data.stats.trialUsers}</p>
              <p className="text-xs text-muted-foreground">Trial</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-soft-sm">
            <CardContent className="p-3 text-center">
              <BarChart3 className="h-5 w-5 mx-auto text-green-500 mb-1" />
              <p className="text-xl font-bold">
                {Object.values(data.stats.planCounts).reduce(
                  (a, b) => a + b,
                  0
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Aktivni predplatne
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ecomail Lists */}
      {lists.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Kontaktni seznamy</h4>
          <div className="space-y-1">
            {lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between text-sm py-1.5 px-3 bg-muted/30 rounded-lg"
              >
                <span>{list.name}</span>
                <Badge variant="outline">
                  {list.subscriber_count} kontaktu
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaigns */}
      {campaigns.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Kampane</h4>
          <div className="space-y-1">
            {campaigns.slice(0, 10).map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between text-sm py-1.5 px-3 bg-muted/30 rounded-lg"
              >
                <span className="truncate mr-2">{campaign.name}</span>
                <Badge
                  variant={campaign.status === 'sent' ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {campaign.status === 'sent'
                    ? 'Odeslano'
                    : campaign.status === 'draft'
                      ? 'Koncept'
                      : campaign.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automations */}
      {automations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Automatizace</h4>
          <div className="space-y-1">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="flex items-center justify-between text-sm py-1.5 px-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>{automation.name}</span>
                </div>
                <Badge
                  variant={
                    automation.status === 'active' ? 'default' : 'outline'
                  }
                  className="text-xs"
                >
                  {automation.status === 'active' ? 'Aktivni' : 'Neaktivni'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data?.ecomail && !loading && (
        <p className="text-sm text-muted-foreground">
          Nastavte ECOMAIL_API_KEY a ECOMAIL_LIST_ID_CLIENTS v environment
          variables pro aktivaci email marketingu.
        </p>
      )}
    </div>
  )
}
