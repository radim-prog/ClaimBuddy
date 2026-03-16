'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Star, Building2, Sparkles } from 'lucide-react'

type BillingCycle = 'monthly' | 'yearly'

interface PlanFeature {
  text: string
  included: boolean
  highlight?: boolean
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
  decoy?: boolean
}

// Format price with Czech thousands separator (1 499 → "1 499")
function fmtPrice(price: number): string {
  if (price === 0) return 'Zdarma'
  return price.toLocaleString('cs-CZ')
}

// =============================================================================
// CLIENT PLANS — decoy: Premium at 799 Kč makes Plus (199 Kč) look like a steal
// =============================================================================
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
    badge: 'Nejoblíbenější',
    priceMonthly: 199,
    priceYearly: 1990,
    description: 'Pro aktivní podnikatele. Vše co potřebujete.',
    popular: true,
    features: [
      { text: 'Vše z Free', included: true },
      { text: 'Neomezený adresář', included: true },
      { text: 'Plný cestovní deník + CSV export', included: true },
      { text: '5 AI extrakcí / měsíc', included: true, highlight: true },
      { text: 'Spisy — plný přístup', included: true },
      { text: 'Více vozidel + tankování', included: true },
      { text: 'QR platební kódy', included: true, highlight: true },
      { text: 'Prioritní podpora', included: false },
    ],
    cta: 'Vyzkoušet 90 dní zdarma',
  },
  {
    name: 'Premium',
    badge: 'Pro náročné',
    priceMonthly: 799,
    priceYearly: 7990,
    description: 'Kompletní řešení pro velké podnikatele.',
    decoy: true,
    features: [
      { text: 'Vše z Plus', included: true },
      { text: '50 AI extrakcí / měsíc', included: true, highlight: true },
      { text: 'Proforma / faktura / dobropis', included: true },
      { text: 'Rozšířené statistiky a reporty', included: true },
      { text: 'Krizový AI chatbot', included: true, highlight: true },
      { text: 'Cestovní randomizér', included: true },
      { text: 'Extra vytěžování: 7 Kč/ks', included: true },
      { text: 'Prioritní podpora 24/7', included: true },
    ],
    cta: 'Vyzkoušet 90 dní',
  },
]

// =============================================================================
// ACCOUNTANT PLANS — decoy: Enterprise at 3 999 Kč makes Profi (699 Kč) the obvious choice
// =============================================================================
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
    description: 'Pro účetní firmy. Vše pro efektivní práci.',
    popular: true,
    features: [
      { text: 'Max 100 firem / 5 uživatelů', included: true },
      { text: 'Skupiny klientů', included: true },
      { text: 'Projekty + spisy', included: true },
      { text: 'Komunikace + notifikace', included: true, highlight: true },
      { text: 'DPH matice + daň z příjmů', included: true, highlight: true },
      { text: 'B2B fakturace klientům', included: true },
      { text: 'Google Drive integrace', included: true },
      { text: 'Analytika nákladů a zisku', included: true },
    ],
    cta: 'Vyzkoušet 90 dní zdarma',
  },
  {
    name: 'Enterprise',
    badge: 'Pro velké firmy',
    priceMonthly: 3999,
    priceYearly: 39990,
    description: 'Neomezené řešení pro velké kanceláře.',
    decoy: true,
    features: [
      { text: 'Neomezené firmy + uživatelé', included: true },
      { text: '200 AI extrakcí / měsíc', included: true, highlight: true },
      { text: 'Health score klientů', included: true },
      { text: 'Znalostní báze', included: true },
      { text: 'Multi-tenant správa', included: true, highlight: true },
      { text: 'Raynet CRM + API přístup', included: true },
      { text: 'Onboarding konzultace', included: true },
      { text: 'Dedikovaná podpora', included: true },
    ],
    cta: 'Kontaktujte nás',
  },
]

// =============================================================================
// PLAN CARD — popular gets lifted/glowing, decoy gets muted
// =============================================================================
function PlanCard({ plan, billing, accentColor }: { plan: Plan; billing: BillingCycle; accentColor: string }) {
  const price = billing === 'monthly' ? plan.priceMonthly : plan.priceYearly
  const period = billing === 'monthly' ? '/měs' : '/rok'
  const savingsPercent = plan.priceMonthly > 0
    ? Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)
    : 0

  const isPopular = plan.popular
  const isDecoy = plan.decoy

  return (
    <div
      className={`
        relative rounded-2xl border p-6 flex flex-col transition-all duration-300
        min-h-[520px]
        ${isPopular
          ? `border-${accentColor}-400 dark:border-${accentColor}-500 shadow-2xl ring-2 ring-${accentColor}-400/30 dark:ring-${accentColor}-500/30 scale-[1.03] z-10 bg-gradient-to-b from-white to-${accentColor}-50/30 dark:from-gray-900 dark:to-${accentColor}-950/20`
          : isDecoy
            ? 'border-border/40 bg-muted/20 dark:bg-gray-900/50'
            : 'border-border/50 bg-white dark:bg-gray-900'
        }
      `}
      style={isPopular ? {
        borderColor: accentColor === 'blue' ? '#3b82f6' : '#a855f7',
        boxShadow: `0 0 40px ${accentColor === 'blue' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)'}, 0 20px 40px rgba(0,0,0,0.08)`,
      } : undefined}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge
            className={`
              px-3 py-1 text-white text-xs font-semibold whitespace-nowrap
              ${isPopular
                ? accentColor === 'blue'
                  ? 'bg-blue-600 hover:bg-blue-600 shadow-md'
                  : 'bg-purple-600 hover:bg-purple-600 shadow-md'
                : 'bg-gray-500 hover:bg-gray-500'
              }
            `}
          >
            {isPopular && <Star className="w-3 h-3 mr-1 inline" />}
            {isDecoy && <Building2 className="w-3 h-3 mr-1 inline" />}
            {plan.badge}
          </Badge>
        </div>
      )}

      {/* Plan name + description */}
      <div className="mb-6 mt-1">
        <h3 className={`text-xl font-bold font-display ${isPopular ? 'text-foreground' : isDecoy ? 'text-muted-foreground' : 'text-foreground'}`}>
          {plan.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6 min-h-[72px]">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold font-display ${isPopular ? 'text-foreground' : isDecoy ? 'text-muted-foreground/80' : 'text-foreground'}`}>
            {price === 0 ? 'Zdarma' : `${fmtPrice(price)}\u00A0Kč`}
          </span>
          {price > 0 && (
            <span className="text-sm text-muted-foreground">{period}</span>
          )}
        </div>
        {billing === 'yearly' && savingsPercent > 0 && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">
            Úspora {savingsPercent} % oproti měsíčnímu
          </p>
        )}
        {billing === 'monthly' && price > 0 && (
          <p className="text-sm text-muted-foreground/60 mt-1">
            {/* Show yearly equivalent for anchoring */}
            nebo {fmtPrice(plan.priceYearly)} Kč/rok
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5 text-sm">
            {f.included ? (
              <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                f.highlight && isPopular
                  ? accentColor === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
                  : 'text-green-600 dark:text-green-400'
              }`} />
            ) : (
              <X className="h-4 w-4 text-muted-foreground/30 mt-0.5 flex-shrink-0" />
            )}
            <span className={`${
              f.included
                ? f.highlight ? 'text-foreground font-medium' : 'text-foreground'
                : 'text-muted-foreground/50'
            }`}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        className={`w-full ${
          isPopular
            ? accentColor === 'blue'
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
            : ''
        }`}
        variant={isPopular ? 'default' : 'outline'}
        size="lg"
        asChild
      >
        <Link href={isDecoy && plan.priceMonthly >= 3000 ? '/auth/register?plan=enterprise' : '/auth/register'}>
          {plan.cta}
        </Link>
      </Button>

      {/* Popular plan extra nudge */}
      {isPopular && (
        <p className="text-xs text-center text-muted-foreground mt-3">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Zvoleno 73 % našich zákazníků
        </p>
      )}
    </div>
  )
}

// =============================================================================
// PRICING SECTION
// =============================================================================
export function PricingSection() {
  const [billing, setBilling] = useState<BillingCycle>('monthly')
  const [portal, setPortal] = useState<'client' | 'accountant'>('client')

  const plans = portal === 'client' ? CLIENT_PLANS : ACCOUNTANT_PLANS
  const accentColor = portal === 'client' ? 'blue' : 'purple'

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
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
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              portal === 'client'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Klientský portál
          </button>
          <button
            onClick={() => setPortal('accountant')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              portal === 'accountant'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Portál pro účetní
          </button>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <span className={`text-sm transition-colors ${billing === 'monthly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            Měsíčně
          </span>
          <button
            onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
            role="switch"
            aria-checked={billing === 'yearly'}
            aria-label="Přepnout roční/měsíční fakturaci"
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
              billing === 'yearly'
                ? accentColor === 'blue' ? 'bg-blue-600' : 'bg-purple-600'
                : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                billing === 'yearly' ? 'translate-x-0.5' : 'translate-x-6'
              }`}
            />
          </button>
          <span className={`text-sm transition-colors ${billing === 'yearly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            Ročně
          </span>
          <Badge
            variant="secondary"
            className={`text-xs transition-opacity duration-200 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ${
              billing === 'yearly' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Ušetříte až 17 %
          </Badge>
        </div>

        {/* Plans grid — fixed height cards, no jumping */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan) => (
            <PlanCard key={`${portal}-${plan.name}`} plan={plan} billing={billing} accentColor={accentColor} />
          ))}
        </div>

        {/* Addons note */}
        <div className="mt-14 text-center">
          <p className="text-sm text-muted-foreground">
            Potřebujete více? Nabízíme doplňky — extra vytěžování od 7 Kč/doklad,
            další uživatelé od 99 Kč/měsíc.{' '}
            <Link href="/pricing" className={`${accentColor === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'} hover:underline font-medium`}>
              Kompletní ceník →
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
