'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Crown, Users, Building, Sparkles, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

type FirmData = {
  plan_tier: string
  status: string
}

type LimitInfo = {
  current: number
  limit: number
}

type FirmResponse = {
  firm: FirmData
  stats: { client_count: number; team_count: number }
  limits: {
    users: LimitInfo
    clients: LimitInfo
    extractions: LimitInfo
  }
}

const PLAN_INFO: Record<string, { name: string; price: number; features: string[] }> = {
  free: {
    name: 'Free',
    price: 0,
    features: ['Až 5 klientů', '1 uživatel', 'Základní funkce'],
  },
  starter: {
    name: 'Starter',
    price: 690,
    features: ['Až 20 klientů', '3 uživatelé', '10 extrakcí/měsíc', 'Emailová podpora'],
  },
  professional: {
    name: 'Professional',
    price: 1490,
    features: ['Až 100 klientů', '10 uživatelů', '50 extrakcí/měsíc', 'Google Drive', 'Raynet CRM', 'Prioritní podpora'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 2990,
    features: ['Neomezený počet klientů', 'Neomezený počet uživatelů', '200 extrakcí/měsíc', 'Vše z Professional', 'Dedikovaná podpora'],
  },
}

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

function UsageBar({ label, current, limit, icon: Icon }: { label: string; current: number; limit: number; icon: React.ComponentType<{ className?: string }> }) {
  const isUnlimited = !isFinite(limit)
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100)
  const isOver = !isUnlimited && current > limit

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-200">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          {label}
        </span>
        <span className={isOver ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
          {current} / {isUnlimited ? '∞' : limit}
          {isOver && (
            <AlertTriangle className="inline ml-1 h-3.5 w-3.5" />
          )}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={`h-2 ${isOver ? '[&>div]:bg-red-500' : percentage > 80 ? '[&>div]:bg-amber-500' : ''}`}
        />
      )}
      {isUnlimited && (
        <div className="h-2 rounded-full bg-green-100 dark:bg-green-900/20">
          <div className="h-full rounded-full bg-green-500 w-full opacity-30" />
        </div>
      )}
    </div>
  )
}

export function FirmBilling() {
  const [data, setData] = useState<FirmResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/accountant/firm')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data?.firm) {
    return <p className="text-muted-foreground text-center py-12">Data nedostupná</p>
  }

  const tier = data.firm.plan_tier || 'free'
  const plan = PLAN_INFO[tier] || PLAN_INFO.free
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.free

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Plan card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" /> Váš plán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={tierColor}>{plan.name}</Badge>
                {data.firm.status === 'active' && (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Aktivní
                  </span>
                )}
              </div>
              {plan.price > 0 && (
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.price.toLocaleString('cs-CZ')}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400"> Kč/měs</span>
                </div>
              )}
              {plan.price === 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">Zdarma</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" /> Aktuální využití
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <UsageBar
            label="Uživatelé"
            current={data.limits.users.current}
            limit={data.limits.users.limit}
            icon={Users}
          />
          <UsageBar
            label="Klienti"
            current={data.limits.clients.current}
            limit={data.limits.clients.limit}
            icon={Building}
          />
          <UsageBar
            label="Extrakce (tento měsíc)"
            current={data.limits.extractions.current}
            limit={data.limits.extractions.limit}
            icon={Sparkles}
          />
        </CardContent>
      </Card>
    </div>
  )
}
