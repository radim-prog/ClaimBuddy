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
  Users,
  FolderOpen,
  Star,
  Gift,
  ArrowRight,
  Sparkles,
  Briefcase,
} from 'lucide-react'

type AccountantTier = 'zaklad' | 'profi' | 'business'
type ClientTier = 'free' | 'plus' | 'premium'

interface PricingPlan {
  id: string
  name: string
  price: number
  yearlyPrice: number
  icon: typeof Crown
  description: string
  maxCompanies: number | null
  maxUsers: number | null
  features: { name: string; included: boolean; note?: string }[]
  support: string
  popular?: boolean
}

const ACCOUNTANT_PLANS: PricingPlan[] = [
  {
    id: 'zaklad',
    name: 'Základ',
    price: 0,
    yearlyPrice: 0,
    icon: Gift,
    description: 'Pro začátek a vyzkoušení',
    maxCompanies: 10,
    maxUsers: 1,
    features: [
      { name: 'Seznam klientů + profily', included: true },
      { name: 'Evidence času', included: true },
      { name: 'Kontrola plateb', included: true },
      { name: 'Termíny a deadlines', included: true },
      { name: 'Základní úkoly', included: true },
      { name: 'Komunikace', included: true, note: 'omezená' },
      { name: 'Vytěžování dokladů', included: false },
      { name: 'Uzávěrky a DPH matice', included: false },
    ],
    support: 'Komunita',
  },
  {
    id: 'profi',
    name: 'Profi',
    price: 699,
    yearlyPrice: 6990,
    icon: Crown,
    description: 'Pro profesionální účetní kanceláře',
    maxCompanies: 100,
    maxUsers: 5,
    features: [
      { name: 'Vše ze Základ', included: true },
      { name: 'Skupiny klientů', included: true },
      { name: 'Projekty + spisy', included: true },
      { name: 'Plná komunikace', included: true },
      { name: 'Uzávěrky, DPH matice, daň z příjmů', included: true },
      { name: 'B2B fakturace klientům', included: true },
      { name: 'Analytika', included: true },
      { name: 'Google Drive integrace', included: true },
      { name: 'Vytěžování', included: false, note: 'per-use addon' },
    ],
    support: 'E-mail (24h)',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 1499,
    yearlyPrice: 14990,
    icon: Building2,
    description: 'Pro velké kanceláře — neomezeno',
    maxCompanies: null,
    maxUsers: null,
    features: [
      { name: 'Vše z Profi', included: true },
      { name: 'Vytěžování', included: true, note: '100/měs v ceně' },
      { name: 'Health score klientů', included: true },
      { name: 'Znalostní báze', included: true },
      { name: 'Onboarding editor', included: true },
      { name: 'Admin panel', included: true },
      { name: 'Raynet CRM sync', included: true },
      { name: 'API přístup', included: true },
      { name: 'Prioritní podpora', included: true },
    ],
    support: 'Prioritní (4h)',
  },
]

const CLIENT_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    icon: Gift,
    description: 'Základní přístup zdarma',
    maxCompanies: null,
    maxUsers: null,
    features: [
      { name: 'Faktury — neomezeno', included: true },
      { name: 'Adresář', included: true, note: 'max 5 partnerů' },
      { name: 'Cestovní deník — základní', included: true },
      { name: 'Zprávy s účetním', included: true },
      { name: 'Nahrávání dokladů', included: true },
      { name: 'Vytěžování dokladů', included: false },
      { name: 'Spisy', included: false },
    ],
    support: 'Komunita',
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 199,
    yearlyPrice: 1990,
    icon: Briefcase,
    description: 'Pro aktivní podnikatele',
    maxCompanies: null,
    maxUsers: null,
    features: [
      { name: 'Vše z Free', included: true },
      { name: 'Adresář — neomezeno', included: true },
      { name: 'Cestovní deník — plný', included: true },
      { name: 'Vytěžování dokladů', included: true, note: '5/měs' },
      { name: 'Spisy — plný přístup', included: true },
      { name: 'Rozšířené statistiky', included: false },
      { name: 'QR platební kódy', included: false },
    ],
    support: 'E-mail (48h)',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 399,
    yearlyPrice: 3990,
    icon: Crown,
    description: 'Kompletní sada nástrojů',
    maxCompanies: null,
    maxUsers: null,
    features: [
      { name: 'Vše z Plus', included: true },
      { name: 'Vytěžování dokladů', included: true, note: '20/měs' },
      { name: 'Proforma → faktura → dobropis', included: true },
      { name: 'QR platební kódy', included: true },
      { name: 'Rozšířené statistiky', included: true },
      { name: 'Prioritní podpora', included: true },
    ],
    support: 'Prioritní (24h)',
  },
]

interface PricingTableProps {
  portal?: 'accountant' | 'client'
  onSelectPlan?: (planId: string, cycle: 'monthly' | 'yearly') => void
  currentPlan?: string
  ctaLabel?: string
  showCta?: boolean
}

export function PricingTable({
  portal = 'accountant',
  onSelectPlan,
  currentPlan,
  ctaLabel,
  showCta = true,
}: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const plans = portal === 'accountant' ? ACCOUNTANT_PLANS : CLIENT_PLANS

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
      <div className={`grid grid-cols-1 gap-6 ${
        plans.length === 2 ? 'md:grid-cols-2' :
        plans.length === 3 ? 'md:grid-cols-3' :
        plans.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'
      }`}>
        {plans.map((plan) => {
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

                {plan.maxCompanies !== null || plan.maxUsers !== null ? (
                  <div className="flex justify-center gap-4 mb-6 text-sm">
                    {plan.maxCompanies !== undefined && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <FolderOpen className="h-4 w-4" />
                        {plan.maxCompanies ? `${plan.maxCompanies} firem` : 'Neomezeno'}
                      </div>
                    )}
                    {plan.maxUsers !== undefined && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <Users className="h-4 w-4" />
                        {plan.maxUsers ? `${plan.maxUsers} uživat.` : 'Neomezeno'}
                      </div>
                    )}
                  </div>
                ) : null}

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
                    ) : plan.price === 0 ? (
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
          Každý nový účet dostane 30 dní Profi zdarma
        </div>
      </div>
    </div>
  )
}
