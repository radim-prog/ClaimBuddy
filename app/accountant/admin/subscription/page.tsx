'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  Crown,
  Building2,
  Rocket,
  Users,
  FolderOpen,
  Zap,
  Shield,
  Phone,
  Mail,
  ArrowRight,
  Star,
  CreditCard,
  Gift,
  ExternalLink,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePlanFeatures } from '@/lib/hooks/use-plan-features'

type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise'

const PLANS: {
  id: PlanTier
  name: string
  price: number
  yearlyPrice: number
  icon: typeof Rocket
  description: string
  maxCompanies: number | null
  maxUsers: number | null
  features: string[]
  support: string
  popular?: boolean
}[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    icon: Gift,
    description: 'Pro vyzkoušení a jednoduché účetnictví',
    maxCompanies: 5,
    maxUsers: 1,
    features: [
      'Seznam klientů',
      'Časové výkazy',
      'Přehled plateb',
      'Termíny a deadlines',
      'Základní úkoly',
      'Zprávy klientům (5/měs)',
    ],
    support: 'Komunita',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 490,
    yearlyPrice: 4900,
    icon: Rocket,
    description: 'Pro začínající účetní a malé kanceláře',
    maxCompanies: 20,
    maxUsers: 3,
    features: [
      'Vše z Free',
      'Neomezená komunikace',
      'Matice měsíčních uzávěrek',
      'Přehled DPH',
      'AI vytěžování (10/měs)',
    ],
    support: 'E-mail (48h)',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 1290,
    yearlyPrice: 12900,
    icon: Crown,
    description: 'Pro profesionální účetní kanceláře',
    maxCompanies: 100,
    maxUsers: 10,
    features: [
      'Vše ze Starter',
      'Daň z příjmu',
      'Skupiny klientů',
      'Projekty a fáze',
      'Klientská fakturace',
      'AI vytěžování (50/měs)',
    ],
    support: 'E-mail (24h) + telefon',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 2990,
    yearlyPrice: 29900,
    icon: Building2,
    description: 'Pro velké kanceláře a daňové poradce',
    maxCompanies: null,
    maxUsers: null,
    features: [
      'Vše z Professional',
      'AI vytěžování (200/měs)',
      'Případy a řízení',
      'Pokročilá analytika',
      'Health Score klientů',
      'API přístup',
      'Prioritní podpora',
    ],
    support: 'Prioritní (4h)',
  },
]

const ADDONS = [
  { label: 'Extra vytěžování (50 kreditů)', price: 490, unit: 'jednorázově' },
  { label: 'Extra vytěžování (200 kreditů)', price: 1490, unit: 'jednorázově' },
  { label: 'Firma nad limit', price: 49, unit: '/měsíc/firma' },
  { label: 'Jednorázový onboarding', price: 2990, unit: 'jednorázově' },
]

interface TrialStatus {
  isTrialing: boolean
  daysRemaining: number
  trialEnd: string | null
  trialTier: string
}

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [trial, setTrial] = useState<TrialStatus | null>(null)
  const { planTier, subscription, loading, refreshFeatures } = usePlanFeatures()
  const currentPlan = (planTier || 'free') as PlanTier

  // Fetch trial status
  useEffect(() => {
    fetch('/api/subscription/trial')
      .then(r => r.json())
      .then(data => { if (data.trial) setTrial(data.trial) })
      .catch(() => {})
  }, [])

  // Handle success/cancel URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      toast.success('Předplatné úspěšně aktivováno!')
      refreshFeatures()
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('cancelled') === 'true') {
      toast.info('Platba byla zrušena.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [refreshFeatures])

  const handleSelectPlan = async (planId: PlanTier) => {
    if (planId === currentPlan) {
      toast.info('Toto je váš aktuální tarif.')
      return
    }

    if (planId === 'free') {
      toast.info('Pro přechod na Free kontaktujte podporu.')
      return
    }

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: planId, cycle: billingCycle }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.info(data.error || `Tarif ${PLANS.find(p => p.id === planId)?.name} bude brzy k dispozici.`)
      }
    } catch {
      toast.error('Chyba při vytváření platby. Zkuste to znovu.')
    }
  }

  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.info(data.error || 'Správa předplatného není k dispozici.')
      }
    } catch {
      toast.error('Chyba při otevírání správy předplatného.')
    }
  }

  const currentPlanData = PLANS.find(p => p.id === currentPlan)

  function getButtonLabel(planId: PlanTier, isCurrent: boolean, isDowngrade: boolean): React.ReactNode {
    if (isCurrent) return 'Aktuální tarif'
    if (isDowngrade) return 'Kontaktovat podporu'
    if (planId === 'free') return 'Free'
    return (
      <>
        Vybrat tarif
        <ArrowRight className="h-4 w-4 ml-2" />
      </>
    )
  }

  let statusLabel: string
  switch (subscription?.status) {
    case 'trialing':
      statusLabel = 'Zkušební verze'
      break
    case 'past_due':
      statusLabel = 'Po splatnosti'
      break
    default:
      statusLabel = 'Aktivní'
  }

  const statusColor = subscription?.status === 'past_due'
    ? 'bg-red-500/20 text-red-100 border-red-400/50'
    : 'bg-green-500/20 text-green-100 border-green-400/50'

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Předplatné</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Správa vašeho tarifu Účetní OS
        </p>
      </div>

      {/* Trial countdown banner */}
      {trial && trial.isTrialing && trial.daysRemaining > 0 && (
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6" />
                <div>
                  <p className="font-semibold">
                    Zkušební verze Professional — zbývá {trial.daysRemaining} {trial.daysRemaining === 1 ? 'den' : trial.daysRemaining < 5 ? 'dny' : 'dní'}
                  </p>
                  <p className="text-sm text-white/80">
                    Po skončení bude váš účet přepnut na Free. Vyberte si tarif a udržte si všechny funkce.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-white text-orange-600 hover:bg-white/90 font-semibold"
                onClick={() => document.getElementById('pricing-cards')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Vybrat tarif
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current plan banner */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
        <CardContent className="py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                {currentPlanData?.icon ? <currentPlanData.icon className="h-8 w-8" /> : <Crown className="h-8 w-8" />}
              </div>
              <div>
                <p className="text-sm text-white/80">Aktuální tarif</p>
                <h3 className="text-2xl font-bold font-display">
                  {loading ? 'Načítání...' : currentPlanData?.name || currentPlan}
                </h3>
                {subscription?.trial_end && (
                  <p className="text-sm text-white/80 mt-1">
                    Trial do {new Date(subscription.trial_end).toLocaleDateString('cs-CZ')}
                  </p>
                )}
                {subscription?.current_period_end && !subscription?.trial_end && (
                  <p className="text-sm text-white/80 mt-1">
                    Další platba: {new Date(subscription.current_period_end).toLocaleDateString('cs-CZ')}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <Badge className={statusColor}>
                <Zap className="h-3 w-3 mr-1" />
                {statusLabel}
              </Badge>
              {currentPlanData && (
                <p className="text-sm text-white/80">
                  {currentPlanData.maxCompanies ? `${currentPlanData.maxCompanies} firem` : 'Neomezeno firem'}
                  {' · '}
                  {currentPlanData.maxUsers ? `${currentPlanData.maxUsers} uživatelů` : 'Neomezeno uživatelů'}
                </p>
              )}
              {currentPlan !== 'free' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManageSubscription}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs"
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Spravovat
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            billingCycle === 'monthly'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Měsíčně
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            billingCycle === 'yearly'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Ročně
          <Badge variant="outline" className="ml-2 text-green-600 border-green-300 text-xs">
            -17%
          </Badge>
        </button>
      </div>

      {/* Pricing cards */}
      <div id="pricing-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isCurrent = plan.id === currentPlan
          const price = billingCycle === 'monthly' ? plan.price : (plan.yearlyPrice > 0 ? Math.round(plan.yearlyPrice / 12) : 0)
          const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === currentPlan)

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular
                  ? 'border-purple-500 border-2 shadow-soft-lg shadow-purple-100 dark:shadow-purple-900/20'
                  : ''
              } ${isCurrent ? 'ring-2 ring-purple-400' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Nejpopulárnější
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pt-8">
                <div className={`mx-auto p-3 rounded-xl mb-3 ${
                  plan.popular
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Icon className={`h-8 w-8 ${
                    plan.popular ? 'text-purple-600' : 'text-gray-600 dark:text-gray-300'
                  }`} />
                </div>
                <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {price > 0 ? price.toLocaleString('cs-CZ') : 'Zdarma'}
                    </span>
                    {price > 0 && <span className="text-gray-500 dark:text-gray-400">Kč/měs</span>}
                  </div>
                  {billingCycle === 'yearly' && plan.yearlyPrice > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      {plan.yearlyPrice.toLocaleString('cs-CZ')} Kč/rok
                    </p>
                  )}
                </div>

                <div className="flex justify-center gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <FolderOpen className="h-4 w-4" />
                    {plan.maxCompanies ? `${plan.maxCompanies} firem` : 'Neomezeno'}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <Users className="h-4 w-4" />
                    {plan.maxUsers ? `${plan.maxUsers} uživat.` : 'Neomezeno'}
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <Shield className="h-3 w-3" />
                  Podpora: {plan.support}
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={isCurrent ? 'outline' : plan.popular ? 'default' : 'outline'}
                  className={`w-full ${
                    plan.popular && !isCurrent
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : ''
                  }`}
                  disabled={isCurrent || plan.id === 'free'}
                >
                  {getButtonLabel(plan.id, isCurrent, isDowngrade)}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Doplňkové služby</CardTitle>
          <CardDescription>Rozšíření nad rámec vašeho tarifu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ADDONS.map((addon) => (
              <div
                key={addon.label}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {addon.label}
                </span>
                <span className="text-sm">
                  <span className="font-bold text-gray-900 dark:text-white">
                    +{addon.price} Kč
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1 text-xs">
                    {addon.unit}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <CardContent className="py-8 text-center">
          <h3 className="text-lg font-bold text-gray-900 font-display dark:text-white mb-2">
            Potřebujete pomoc s výběrem?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
            Rádi vám pomůžeme najít správný tarif pro vaši účetní kancelář.
            Nabízíme také individuální řešení na míru.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              info@ucetnios.cz
            </Button>
            <Button variant="outline" className="gap-2" disabled>
              <Phone className="h-4 w-4" />
              Nezadáno
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
