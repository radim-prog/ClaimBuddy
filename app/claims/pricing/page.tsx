import type { Metadata } from 'next'
import Link from 'next/link'
import { ClaimsNavbar } from '@/components/claims/claims-navbar'
import { ClaimsFooter } from '@/components/claims/claims-footer'
import {
  Check,
  X,
  ArrowRight,
  Shield,
  Star,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'Ceník — Pojistná Pomoc',
  description:
    'Transparentní ceník služeb. Self-service zdarma, konzultace od 1 499 Kč, plné zastoupení s success fee.',
}

const TIERS = [
  {
    name: 'Self-service',
    price: 'Zdarma',
    priceNote: 'bez asistence',
    desc: 'Nahlásíte událost, nahrajete dokumenty a řešíte si vše sami.',
    features: [
      'Formulář nahlášení PU',
      'Upload dokumentů a fotek',
      'Přehled vašich událostí',
      'Online sledování stavu',
    ],
    featured: false,
    cta: 'Začít zdarma',
  },
  {
    name: 'AI zpracování',
    price: '199 Kč',
    priceNote: 'jednorázově',
    desc: 'AI analyzuje vaše fotky a dokumenty a sestaví hlášenku automaticky.',
    features: [
      'Vše ze Self-service',
      'AI analýza fotek a dokumentů',
      'Automatická hlášenka',
      'Posouzení nároku',
      'Hotovo do 15 minut',
    ],
    featured: false,
    cta: 'Vyzkoušet AI',
  },
  {
    name: 'Konzultace',
    price: '1 499 Kč',
    priceNote: 'jednorázově',
    desc: 'Analyzujeme vaše podklady a poradíme, jak postupovat.',
    features: [
      'Vše ze Self-service',
      'Analýza podkladů (~1h)',
      'Chat s poradcem',
      'Doporučení postupu',
      'Pomoc se sepsáním hlášení',
      'Odpovědi na dotazy k pojištění',
    ],
    featured: true,
    cta: 'Objednat konzultaci',
  },
  {
    name: 'Plné zastoupení',
    price: '1 499 Kč',
    priceNote: '+ success fee z plnění',
    desc: 'Převezmeme komunikaci s pojišťovnou a řešíme vše za vás.',
    features: [
      'Vše z Konzultace',
      'Plná moc (elektronický podpis)',
      'Komunikace s pojišťovnou za vás',
      'Průběžný reporting do spisu',
      'Odvolání proti zamítnutí',
      'Success fee 10 % z celkového plnění',
    ],
    featured: false,
    cta: 'Chci zastoupení',
  },
]

const SUCCESS_FEE_FLAT = '10 %'

const COMPARISON_ROWS: { label: string; self: boolean; ai: boolean; consult: boolean; full: boolean }[] = [
  { label: 'Nahlášení PU online', self: true, ai: true, consult: true, full: true },
  { label: 'Upload dokumentů a fotek', self: true, ai: true, consult: true, full: true },
  { label: 'Přehled vašich událostí', self: true, ai: true, consult: true, full: true },
  { label: 'Online sledování stavu', self: true, ai: true, consult: true, full: true },
  { label: 'AI analýza fotek a dokumentů', self: false, ai: true, consult: false, full: false },
  { label: 'Automatická hlášenka (AI)', self: false, ai: true, consult: false, full: false },
  { label: 'Analýza podkladů (poradce)', self: false, ai: false, consult: true, full: true },
  { label: 'Chat s poradcem', self: false, ai: false, consult: true, full: true },
  { label: 'Doporučení postupu', self: false, ai: false, consult: true, full: true },
  { label: 'Pomoc se sepsáním hlášení', self: false, ai: false, consult: true, full: true },
  { label: 'Plná moc (elektronický podpis)', self: false, ai: false, consult: false, full: true },
  { label: 'Komunikace s pojišťovnou', self: false, ai: false, consult: false, full: true },
  { label: 'Průběžný reporting', self: false, ai: false, consult: false, full: true },
  { label: 'Odvolání proti zamítnutí', self: false, ai: false, consult: false, full: true },
]

const PRICING_FAQ = [
  {
    q: 'Co je success fee?',
    a: 'Success fee je 10 % z celkového pojistného plnění, které vám pojišťovna vyplatí. Platíte jej pouze u plného zastoupení a pouze tehdy, když pojišťovna plnění skutečně vyplatí.',
  },
  {
    q: 'Kdy platím 1 499 Kč?',
    a: 'Jednorázová platba se hradí předem — před zpřístupněním poradce. Platbu provedete bezpečně online kartou. Po zaplacení vám bude přidělen osobní poradce.',
  },
  {
    q: 'Co když pojišťovna nic nevyplatí?',
    a: 'U konzultace platíte pouze fixní poplatek 1 499 Kč bez ohledu na výsledek. U plného zastoupení platíte fixní poplatek 1 499 Kč + success fee — pokud pojišťovna nic nevyplatí, success fee neúčtujeme.',
  },
  {
    q: 'Mohu přejít z konzultace na plné zastoupení?',
    a: 'Ano, kdykoliv. Fixní poplatek 1 499 Kč je u obou služeb stejný, takže nedoplácíte nic navíc. Stačí podepsat plnou moc a my převezmeme komunikaci s pojišťovnou.',
  },
  {
    q: 'Z čeho se počítá success fee?',
    a: 'Success fee se počítá z celkového pojistného plnění, které vám pojišťovna vyplatí. Sazba je jednotná — 10 % bez ohledu na výši škody.',
  },
]

const STEPS = [
  {
    num: '1',
    emoji: '📋',
    title: 'Nahlásíte událost',
    desc: 'Vyplníte jednoduchý formulář a nahrajete fotky. Zabere to 5 minut.',
  },
  {
    num: '2',
    emoji: '🎯',
    title: 'Vyberete službu',
    desc: 'Zvolíte si self-service, konzultaci nebo plné zastoupení podle vašich potřeb.',
  },
  {
    num: '3',
    emoji: '💰',
    title: 'My řešíme za vás',
    desc: 'Analyzujeme podklady, komunikujeme s pojišťovnou a zajistíme maximální plnění.',
  },
]

function FeatureIcon({ included }: { included: boolean }) {
  return included ? (
    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
  ) : (
    <X className="h-5 w-5 text-gray-300 dark:text-gray-600" />
  )
}

export default function ClaimsPricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <ClaimsNavbar />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background" />
          <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-blue-400/[0.07] blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 px-4 py-1.5 text-sm text-blue-700 dark:text-blue-300 mb-6">
            <Shield className="h-3.5 w-3.5" />
            Základní nahlášení ZDARMA
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Transparentní ceník
          </h1>

          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Vyberte si úroveň služby, která vám vyhovuje. Vždy začínáte zdarma.
          </p>
        </div>
      </section>

      {/* ── Pricing karty ─────────────────────────────────────── */}
      <section className="py-8 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-200 ${
                  tier.featured
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg shadow-blue-500/10 scale-[1.02]'
                    : 'border-border/50 bg-card hover:shadow-md'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1">
                    <Star className="h-3 w-3" />
                    Doporučeno
                  </div>
                )}

                <h3 className="text-lg font-semibold text-foreground mt-2 text-center">
                  {tier.name}
                </h3>

                <div className="my-4 text-center">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {tier.price}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">{tier.priceNote}</p>
                </div>

                <p className="text-sm text-muted-foreground text-center mb-4">{tier.desc}</p>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/claims/new"
                  className={`inline-flex items-center justify-center w-full h-10 rounded-md text-sm font-medium transition-colors ${
                    tier.featured
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Success fee info ─────────────────────────────────── */}
      <section className="py-8 md:py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">
              Success fee
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Platí pouze u plného zastoupení. Účtujeme{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">{SUCCESS_FEE_FLAT}</span>{' '}
              z celkového pojistného plnění, které vám pojišťovna vyplatí.
              Pokud pojišťovna nic nevyplatí, success fee neúčtujeme.
            </p>
          </div>
        </div>
      </section>

      {/* ── Srovnávací tabulka ────────────────────────────────── */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              Srovnání služeb
            </h2>
            <p className="mt-2 text-muted-foreground">
              Podrobný přehled toho, co je zahrnuto v každém tarifu.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-sm font-semibold text-foreground px-6 py-4 w-[36%]">
                    Funkce
                  </th>
                  <th className="text-center text-sm font-semibold text-foreground px-3 py-4">
                    Self-service
                  </th>
                  <th className="text-center text-sm font-semibold text-purple-600 dark:text-purple-400 px-3 py-4">
                    AI zpracování
                  </th>
                  <th className="text-center text-sm font-semibold text-blue-600 dark:text-blue-400 px-3 py-4">
                    Konzultace
                  </th>
                  <th className="text-center text-sm font-semibold text-foreground px-3 py-4">
                    Plné zastoupení
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i < COMPARISON_ROWS.length - 1 ? 'border-b border-border/30' : ''}
                  >
                    <td className="text-sm text-foreground px-6 py-3">{row.label}</td>
                    <td className="text-center px-3 py-3">
                      <span className="inline-flex justify-center">
                        <FeatureIcon included={row.self} />
                      </span>
                    </td>
                    <td className="text-center px-3 py-3 bg-purple-50/30 dark:bg-purple-950/10">
                      <span className="inline-flex justify-center">
                        <FeatureIcon included={row.ai} />
                      </span>
                    </td>
                    <td className="text-center px-3 py-3 bg-blue-50/30 dark:bg-blue-950/10">
                      <span className="inline-flex justify-center">
                        <FeatureIcon included={row.consult} />
                      </span>
                    </td>
                    <td className="text-center px-3 py-3">
                      <span className="inline-flex justify-center">
                        <FeatureIcon included={row.full} />
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Price row */}
                <tr className="border-t-2 border-border/50 bg-muted/30">
                  <td className="text-sm font-semibold text-foreground px-6 py-4">Cena</td>
                  <td className="text-center px-3 py-4">
                    <span className="text-sm font-bold text-foreground">Zdarma</span>
                  </td>
                  <td className="text-center px-3 py-4 bg-purple-50/30 dark:bg-purple-950/10">
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">199 Kč</span>
                  </td>
                  <td className="text-center px-3 py-4 bg-blue-50/30 dark:bg-blue-950/10">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">1 499 Kč</span>
                  </td>
                  <td className="text-center px-3 py-4">
                    <span className="text-sm font-bold text-foreground">1 499 Kč + fee</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Jak to funguje ────────────────────────────────────── */}
      <section className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              Jak to funguje
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative text-center group">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-blue-300 to-blue-100 dark:from-blue-700 dark:to-blue-900" />
                )}

                <div className="relative inline-flex mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-950/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="text-4xl">{step.emoji}</span>
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              Časté otázky k ceníku
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {PRICING_FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
            Máte pojistnou událost? Začněte teď.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Začněte zdarma, službu si vyberete až po nahlášení.
          </p>

          <div className="mt-8">
            <Link
              href="/claims/new"
              className="inline-flex items-center justify-center h-14 px-10 text-lg font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              Nahlásit pojistnou událost
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Nebo nám napište na{' '}
            <a href="mailto:podpora@zajcon.cz" className="text-blue-600 hover:underline">
              podpora@zajcon.cz
            </a>
          </p>
        </div>
      </section>

      <ClaimsFooter />
    </div>
  )
}
