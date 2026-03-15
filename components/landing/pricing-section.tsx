'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'

type BillingCycle = 'monthly' | 'yearly'

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  name: string
  badge?: string
  priceMonthly: number
  priceYearly: number
  description: string
  features: PlanFeature[]
  cta: string
  popular?: boolean
}

const CLIENT_PLANS: Plan[] = [
  {
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Pro začátek. Základní přehled o účetnictví.',
    features: [
      { text: 'Neomezené faktury', included: true },
      { text: 'Adresář (max 5 partnerů)', included: true },
      { text: 'Základní cestovní deník', included: true },
      { text: 'Zprávy s účetním', included: true },
      { text: 'Nahrávání dokladů', included: true },
      { text: 'AI vytěžování dokladů', included: false },
      { text: 'Spisy a dokumenty', included: false },
      { text: 'Rozšířené statistiky', included: false },
    ],
    cta: 'Začít zdarma',
  },
  {
    name: 'Plus',
    badge: 'Oblíbený',
    priceMonthly: 199,
    priceYearly: 1990,
    description: 'Pro aktivní podnikatele s pravidelnými doklady.',
    popular: true,
    features: [
      { text: 'Vše z Free', included: true },
      { text: 'Neomezený adresář', included: true },
      { text: 'Plný cestovní deník + CSV', included: true },
      { text: '5 AI extrakcí / měsíc', included: true },
      { text: 'Spisy — plný přístup', included: true },
      { text: 'Více vozidel + tankování', included: true },
      { text: 'QR platební kódy', included: false },
      { text: 'Prioritní podpora', included: false },
    ],
    cta: 'Vyzkoušet 30 dní',
  },
  {
    name: 'Premium',
    priceMonthly: 399,
    priceYearly: 3990,
    description: 'Kompletní řešení pro náročné podnikatele.',
    features: [
      { text: 'Vše z Plus', included: true },
      { text: '20 AI extrakcí / měsíc', included: true },
      { text: 'Proforma / faktura / dobropis', included: true },
      { text: 'QR platební kódy', included: true },
      { text: 'Rozšířené statistiky', included: true },
      { text: 'Prioritní podpora', included: true },
      { text: 'Extra vytěžování: 9 Kč/ks', included: true },
      { text: 'Cestovní randomizér', included: true },
    ],
    cta: 'Vyzkoušet 30 dní',
  },
]

const ACCOUNTANT_PLANS: Plan[] = [
  {
    name: 'Základ',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Pro jednotlivce — začněte bez závazku.',
    features: [
      { text: 'Max 10 firem', included: true },
      { text: '1 uživatel', included: true },
      { text: 'Úkoly + time tracking', included: true },
      { text: 'Seznam klientů + profily', included: true },
      { text: 'Termíny a uzávěrky', included: true },
      { text: 'Kontrola plateb (matice)', included: true },
      { text: 'AI vytěžování', included: false },
      { text: 'Projekty a spisy', included: false },
    ],
    cta: 'Začít zdarma',
  },
  {
    name: 'Profi',
    badge: 'Nejlepší hodnota',
    priceMonthly: 699,
    priceYearly: 6990,
    description: 'Pro účetní firmy do 100 klientů.',
    popular: true,
    features: [
      { text: 'Max 100 firem / 5 uživatelů', included: true },
      { text: 'Skupiny klientů', included: true },
      { text: 'Projekty + spisy', included: true },
      { text: 'Komunikace + notifikace', included: true },
      { text: 'DPH matice + daň z příjmů', included: true },
      { text: 'B2B fakturace klientům', included: true },
      { text: 'Google Drive integrace', included: true },
      { text: 'Analytika', included: true },
    ],
    cta: 'Vyzkoušet 30 dní',
  },
  {
    name: 'Business',
    priceMonthly: 1499,
    priceYearly: 14990,
    description: 'Neomezené pro velké účetní kanceláře.',
    features: [
      { text: 'Neomezené firmy + uživatelé', included: true },
      { text: '100 AI extrakcí / měsíc', included: true },
      { text: 'Health score klientů', included: true },
      { text: 'Znalostní báze', included: true },
      { text: 'Admin panel + onboarding', included: true },
      { text: 'Raynet CRM sync', included: true },
      { text: 'API přístup', included: true },
      { text: 'Prioritní podpora', included: true },
    ],
    cta: 'Vyzkoušet 30 dní',
  },
]

function PlanCard({ plan, billing }: { plan: Plan; billing: BillingCycle }) {
  const price = billing === 'monthly' ? plan.priceMonthly : plan.priceYearly
  const period = billing === 'monthly' ? '/měs' : '/rok'
  const savingsPercent = plan.priceMonthly > 0
    ? Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)
    : 0

  return (
    <div
      className={`relative rounded-2xl border p-6 flex flex-col ${
        plan.popular
          ? 'border-purple-400 dark:border-purple-600 shadow-soft-lg ring-1 ring-purple-400/20'
          : 'border-border/50'
      }`}
    >
      {plan.badge && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white hover:bg-purple-600">
          {plan.badge}
        </Badge>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold font-display text-foreground">{plan.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold font-display text-foreground">
            {price === 0 ? 'Zdarma' : `${price.toLocaleString('cs')}\u00A0Kč`}
          </span>
          {price > 0 && <span className="text-sm text-muted-foreground">{period}</span>}
        </div>
        {billing === 'yearly' && savingsPercent > 0 && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">
            Úspora {savingsPercent}% oproti měsíčnímu
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5 text-sm">
            {f.included ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
            )}
            <span className={f.included ? 'text-foreground' : 'text-muted-foreground/60'}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <Button
        className="w-full"
        variant={plan.popular ? 'default' : 'outline'}
        asChild
      >
        <Link href="/auth/login">{plan.cta}</Link>
      </Button>
    </div>
  )
}

export function PricingSection() {
  const [billing, setBilling] = useState<BillingCycle>('monthly')
  const [portal, setPortal] = useState<'client' | 'accountant'>('client')

  const plans = portal === 'client' ? CLIENT_PLANS : ACCOUNTANT_PLANS

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
            Jednoduchý a transparentní ceník
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Začněte zdarma, rozšiřte podle potřeb. Bez skrytých poplatků.
          </p>
        </div>

        {/* Portal toggle */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setPortal('client')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              portal === 'client'
                ? 'bg-blue-600 text-white shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Klientský portál
          </button>
          <button
            onClick={() => setPortal('accountant')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              portal === 'accountant'
                ? 'bg-purple-600 text-white shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Portál pro účetní
          </button>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${billing === 'monthly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            Měsíčně
          </span>
          <button
            onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              billing === 'yearly' ? 'bg-purple-600' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                billing === 'yearly' ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className={`text-sm ${billing === 'yearly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            Ročně
          </span>
          {billing === 'yearly' && (
            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              Ušetříte až 17%
            </Badge>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} billing={billing} />
          ))}
        </div>

        {/* Addons note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Potřebujete více? Nabízíme per-use addony — extra vytěžování od 9 Kč/doklad,
            přidaní uživatelé od 99 Kč/měsíc.{' '}
            <Link href="/pricing" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
              Kompletní ceník
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
