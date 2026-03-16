'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  Crown,
  Sparkles,
  Gift,
  ArrowRight,
  Star,
  Zap,
  CreditCard,
  ExternalLink,
  FileText,
  Receipt,
  Users,
  Car,
  ScanLine,
  MessageSquare,
  ScrollText,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { usePlanFeatures } from '@/lib/hooks/use-plan-features'

type ClientTier = 'free' | 'plus' | 'premium'

const PLANS: {
  id: ClientTier
  name: string
  price: number
  yearlyPrice: number
  icon: typeof Gift
  description: string
  features: { name: string; icon: typeof FileText }[]
  highlight?: string
  popular?: boolean
}[] = [
  {
    id: 'free',
    name: 'Zdarma',
    price: 0,
    yearlyPrice: 0,
    icon: Gift,
    description: 'Základní fakturace a správa dokladů',
    features: [
      { name: 'Vystavování faktur', icon: Receipt },
      { name: 'Nahrávání dokladů', icon: FileText },
      { name: 'Cestovní deník (základní)', icon: Car },
      { name: 'Zprávy účetnímu', icon: MessageSquare },
      { name: 'Přehled / dashboard', icon: Sparkles },
    ],
    highlight: 'Navždy zdarma',
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 199,
    yearlyPrice: 1990,
    icon: Sparkles,
    description: 'Pro aktivní podnikatele',
    features: [
      { name: 'Vše z Free', icon: Check },
      { name: 'Adresář — neomezeno', icon: Users },
      { name: 'Cestovní deník — plný', icon: Car },
      { name: 'Vytěžování dokladů (5/měs)', icon: ScanLine },
      { name: 'Spisy — plný přístup', icon: FileText },
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 399,
    yearlyPrice: 3990,
    icon: Crown,
    description: 'Kompletní sada nástrojů',
    features: [
      { name: 'Vše z Plus', icon: Check },
      { name: 'Vytěžování dokladů (20/měs)', icon: ScanLine },
      { name: 'Proforma → faktura → dobropis', icon: Receipt },
      { name: 'QR platební kódy', icon: Star },
      { name: 'Rozšířené statistiky', icon: Sparkles },
      { name: 'Prioritní podpora', icon: Crown },
    ],
  },
]

export default function ClientSubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const { planTier, subscription, loading, refreshFeatures } = usePlanFeatures()
  const currentPlan = (planTier || 'free') as ClientTier

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

  const handleSelectPlan = async (planId: ClientTier) => {
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
        toast.info(data.error || 'Platba bude brzy k dispozici.')
      }
    } catch {
      toast.error('Chyba při vytváření platby.')
    }
  }

  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.info(data.error || 'Správa předplatného není k dispozici.')
    } catch {
      toast.error('Chyba při otevírání správy předplatného.')
    }
  }

  const currentPlanData = PLANS.find(p => p.id === currentPlan)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Předplatné</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Vyberte si tarif podle vašich potřeb
        </p>
      </div>

      {/* Current plan */}
      {currentPlan !== 'free' && (
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="py-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  {currentPlanData?.icon ? <currentPlanData.icon className="h-6 w-6" /> : <Crown className="h-6 w-6" />}
                </div>
                <div>
                  <p className="text-xs text-white/70">Aktuální tarif</p>
                  <h3 className="text-lg font-bold font-display">{currentPlanData?.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-100 border-green-400/50">
                  <Zap className="h-3 w-3 mr-1" />
                  Aktivní
                </Badge>
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            billingCycle === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Měsíčně
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            billingCycle === 'yearly'
              ? 'bg-blue-600 text-white'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isCurrent = plan.id === currentPlan
          const price = billingCycle === 'monthly' ? plan.price : (plan.yearlyPrice > 0 ? Math.round(plan.yearlyPrice / 12) : 0)

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular
                  ? 'border-blue-500 border-2 shadow-soft-lg shadow-blue-100 dark:shadow-blue-900/20'
                  : ''
              } ${isCurrent ? 'ring-2 ring-blue-400' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Doporučeno
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pt-8">
                <div className={`mx-auto p-3 rounded-xl mb-3 ${
                  plan.popular
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Icon className={`h-7 w-7 ${
                    plan.popular ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'
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
                  {plan.highlight && (
                    <p className="text-sm text-green-600 mt-1 font-medium">{plan.highlight}</p>
                  )}
                  {billingCycle === 'yearly' && plan.yearlyPrice > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      {plan.yearlyPrice.toLocaleString('cs-CZ')} Kč/rok
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature) => {
                    const FIcon = feature.icon
                    return (
                      <li key={feature.name} className="flex items-start gap-2.5 text-sm">
                        <FIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature.name}</span>
                      </li>
                    )
                  })}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={isCurrent ? 'outline' : plan.popular ? 'default' : 'outline'}
                  className={`w-full ${
                    plan.popular && !isCurrent
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : ''
                  }`}
                  disabled={isCurrent || plan.id === 'free'}
                >
                  {isCurrent ? (
                    'Aktuální tarif'
                  ) : plan.id === 'free' ? (
                    'Zdarma'
                  ) : (
                    <>
                      Vybrat {plan.name}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQ / value proposition */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <CardContent className="py-8">
          <h3 className="text-lg font-bold text-gray-900 font-display dark:text-white mb-4 text-center">
            Proč si vybrat Účetní OS?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="mx-auto w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white">Fakturace zdarma</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Vystavujte faktury bez limitu, navždy zdarma.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <ScanLine className="h-5 w-5 text-blue-600" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white">AI vytěžování</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Nahrajte doklad, AI přečte vše za vás.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white">Chytrý cesťák</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">AI sestaví cestovní deník z vašich dokladů.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing details & legal */}
      <Card>
        <CardContent className="py-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Fakturační údaje poskytovatele
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div><span className="text-gray-500">Společnost:</span> ZajCon Solutions s.r.o.</div>
            <div><span className="text-gray-500">IČO:</span> 21890331</div>
            <div><span className="text-gray-500">Sídlo:</span> Česká republika</div>
            <div><span className="text-gray-500">DIČ:</span> CZ21890331</div>
          </div>

          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <ScrollText className="h-4 w-4" />
            <span>
              Zakoupením předplatného souhlasíte s{' '}
              <Link href="/legal/terms" className="text-blue-600 hover:underline" target="_blank">
                Všeobecnými obchodními podmínkami
              </Link>
              {' '}a{' '}
              <Link href="/legal/privacy" className="text-blue-600 hover:underline" target="_blank">
                Zásadami ochrany osobních údajů
              </Link>.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
