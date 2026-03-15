'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  X,
  Crown,
  Building2,
  Rocket,
  Users,
  FolderOpen,
  Star,
  Gift,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise'

interface PricingPlan {
  id: PlanTier
  name: string
  price: number
  yearlyPrice: number
  icon: typeof Rocket
  description: string
  maxCompanies: number | null
  maxUsers: number | null
  features: { name: string; included: boolean; note?: string }[]
  support: string
  popular?: boolean
}

const PLANS: PricingPlan[] = [
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
      { name: 'Seznam klientů', included: true },
      { name: 'Časové výkazy', included: true },
      { name: 'Přehled plateb', included: true },
      { name: 'Termíny a deadlines', included: true },
      { name: 'Základní úkoly', included: true },
      { name: 'Zprávy klientům', included: true, note: '5/měs' },
      { name: 'Uzávěrky', included: false },
      { name: 'DPH přehledy', included: false },
      { name: 'AI vytěžování', included: false },
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
      { name: 'Vše z Free', included: true },
      { name: 'Neomezená komunikace', included: true },
      { name: 'Matice měsíčních uzávěrek', included: true },
      { name: 'Přehled DPH', included: true },
      { name: 'AI vytěžování', included: true, note: '10/měs' },
      { name: 'Daň z příjmu', included: false },
      { name: 'Skupiny klientů', included: false },
      { name: 'Klientská fakturace', included: false },
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
      { name: 'Vše ze Starter', included: true },
      { name: 'Daň z příjmu', included: true },
      { name: 'Skupiny klientů', included: true },
      { name: 'Projekty a fáze', included: true },
      { name: 'Klientská fakturace', included: true },
      { name: 'AI vytěžování', included: true, note: '50/měs' },
      { name: 'Případy', included: false },
      { name: 'Health Score', included: false },
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
      { name: 'Vše z Professional', included: true },
      { name: 'AI vytěžování', included: true, note: '200/měs' },
      { name: 'Případy a řízení', included: true },
      { name: 'Pokročilá analytika', included: true },
      { name: 'Health Score klientů', included: true },
      { name: 'API přístup', included: true },
      { name: 'Prioritní podpora', included: true },
    ],
    support: 'Prioritní (4h)',
  },
]

interface PricingTableProps {
  onSelectPlan?: (planId: PlanTier, cycle: 'monthly' | 'yearly') => void
  currentPlan?: PlanTier
  ctaLabel?: string
  showCta?: boolean
}

export function PricingTable({ onSelectPlan, currentPlan, ctaLabel, showCta = true }: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="space-y-8">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            billingCycle === 'monthly'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Měsíčně
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            billingCycle === 'yearly'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Ročně
          <Badge variant="outline" className="ml-2 text-green-600 border-green-300 text-xs">
            -17%
          </Badge>
        </button>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isCurrent = plan.id === currentPlan
          const price = billingCycle === 'monthly'
            ? plan.price
            : plan.yearlyPrice > 0 ? Math.round(plan.yearlyPrice / 12) : 0

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col transition-shadow hover:shadow-lg ${
                plan.popular
                  ? 'border-purple-500 border-2 shadow-lg shadow-purple-100 dark:shadow-purple-900/20'
                  : ''
              } ${isCurrent ? 'ring-2 ring-purple-400' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Doporučeno
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
                  {billingCycle === 'monthly' && plan.price > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      nebo {Math.round(plan.yearlyPrice / 12).toLocaleString('cs-CZ')} Kč/měs ročně
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
                    <li key={feature.name} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
                        {feature.name}
                        {feature.note && (
                          <span className="ml-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                            ({feature.note})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {showCta && (
                  <Button
                    onClick={() => onSelectPlan?.(plan.id, billingCycle)}
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
                    ) : plan.id === 'free' ? (
                      'Začít zdarma'
                    ) : (
                      <>
                        {ctaLabel || 'Vyzkoušet 30 dní zdarma'}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature comparison note */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-full">
          <Sparkles className="h-4 w-4 text-purple-500" />
          Každý nový účet dostane 30 dní Professional zdarma
        </div>
      </div>
    </div>
  )
}
