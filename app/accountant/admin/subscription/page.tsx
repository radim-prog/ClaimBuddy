'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { toast } from 'sonner'

type PlanTier = 'starter' | 'professional' | 'enterprise'

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
    id: 'starter',
    name: 'Starter',
    price: 990,
    yearlyPrice: 9900,
    icon: Rocket,
    description: 'Pro začínající účetní a malé kanceláře',
    maxCompanies: 15,
    maxUsers: 2,
    features: [
      'Matice měsíčních uzávěrek',
      'Správa dokumentů',
      'Základní úkoly',
      'Přehled DPH',
      'E-mail notifikace',
      'Export CSV',
    ],
    support: 'E-mail (48h)',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 2490,
    yearlyPrice: 24900,
    icon: Crown,
    description: 'Pro profesionální účetní kanceláře',
    maxCompanies: 60,
    maxUsers: 5,
    features: [
      'Vše ze Starter',
      'GTD s R-Tasks skóring',
      'Fakturace klientů',
      'Týmová spolupráce',
      'Pokročilé reporty',
      'Kimi AI vytěžování',
      'Klávesové zkratky',
      'Projekty a fáze',
    ],
    support: 'E-mail (24h) + telefon',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4990,
    yearlyPrice: 49900,
    icon: Building2,
    description: 'Pro velké kanceláře a daňové poradce',
    maxCompanies: null,
    maxUsers: null,
    features: [
      'Vše z Professional',
      'Neomezené firmy',
      'Neomezení uživatelé',
      'API přístup',
      'White-label branding',
      'SLA garance 99.9%',
      'Dedikovaný onboarding',
      'Prioritní podpora',
    ],
    support: 'Prioritní (4h)',
  },
]

const ADDONS = [
  { label: 'Firma nad limit', price: 49, unit: '/měsíc/firma' },
  { label: 'Uživatel nad limit', price: 299, unit: '/měsíc/uživatel' },
  { label: 'Jednorázový onboarding', price: 2990, unit: 'jednorázově' },
]

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [currentPlan] = useState<PlanTier>('professional') // Simulated current plan

  const handleSelectPlan = (planId: PlanTier) => {
    if (planId === currentPlan) {
      toast.info('Toto je váš aktuální tarif.')
      return
    }
    toast.success(`Tarif ${PLANS.find(p => p.id === planId)?.name} bude brzy k dispozici. Kontaktujte nás pro aktivaci.`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Předplatné</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Správa vašeho tarifu Účetní OS
        </p>
      </div>

      {/* Current plan banner */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Crown className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-white/80">Aktuální tarif</p>
                <h3 className="text-2xl font-bold">Professional</h3>
                <p className="text-sm text-white/80 mt-1">
                  Trial verze - 30 dní zdarma
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-100 border-green-400/50">
                  <Zap className="h-3 w-3 mr-1" />
                  Aktivní
                </Badge>
              </div>
              <p className="text-sm text-white/80 mt-2">
                60 firem · 5 uživatelů
              </p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isCurrent = plan.id === currentPlan
          const price = billingCycle === 'monthly' ? plan.price : Math.round(plan.yearlyPrice / 12)

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular
                  ? 'border-purple-500 border-2 shadow-lg shadow-purple-100 dark:shadow-purple-900/20'
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
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {price.toLocaleString('cs-CZ')}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">Kč/měs</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-green-600 mt-1">
                      {plan.yearlyPrice.toLocaleString('cs-CZ')} Kč/rok
                    </p>
                  )}
                </div>

                {/* Limits */}
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

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Support */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <Shield className="h-3 w-3" />
                  Podpora: {plan.support}
                </div>

                {/* CTA */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={isCurrent ? 'outline' : plan.popular ? 'default' : 'outline'}
                  className={`w-full ${
                    plan.popular && !isCurrent
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : ''
                  }`}
                  disabled={isCurrent}
                >
                  {isCurrent ? (
                    'Aktuální tarif'
                  ) : (
                    <>
                      Vybrat tarif
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Doplňkové služby</CardTitle>
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
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
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
            <Button variant="outline" className="gap-2">
              <Phone className="h-4 w-4" />
              +420 777 123 456
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
