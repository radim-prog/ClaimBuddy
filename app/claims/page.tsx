import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { ClaimsFAQ } from '@/components/claims/claims-faq'
import {
  CheckCircle,
  Clock,
  ClipboardList,
  Shield,
  Smartphone,
  HeartHandshake,
  ArrowRight,
  Phone,
  Star,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pojistná Pomoc — Zpracujeme vaši pojistnou událost',
  description:
    'Profesionální zpracování pojistných událostí. Vyřídíme vše za vás — od nahlášení po vyplacení. Success fee, platíte jen za výsledek.',
}

const STEPS = [
  {
    num: '1',
    emoji: '📋',
    title: 'Nahlásíte událost',
    desc: 'Vyplníte jednoduchý formulář s popisem škody a nahrajete fotky. Zabere to 5 minut.',
  },
  {
    num: '2',
    emoji: '📑',
    title: 'My vše vyřídíme',
    desc: 'Zkompletujeme dokumentaci, komunikujeme s pojišťovnou a hlídáme termíny. Vy nemusíte řešit nic.',
  },
  {
    num: '3',
    emoji: '💰',
    title: 'Dostanete peníze',
    desc: 'Zajistíme maximální pojistné plnění. Platíte jen procento z vymoženého nad rámec.',
  },
]

const BENEFITS = [
  {
    icon: CheckCircle,
    title: 'Vyšší plnění',
    desc: 'V průměru získáme o 23% vyšší pojistné plnění než klienti sami.',
  },
  {
    icon: Clock,
    title: 'Šetříte čas',
    desc: 'Nemusíte studovat pojistné podmínky, psát dopisy ani volat na linky.',
  },
  {
    icon: ClipboardList,
    title: 'Kompletní servis',
    desc: 'Postaráme se o vše od A do Z — dokumentaci, komunikaci, odvolání.',
  },
  {
    icon: Shield,
    title: 'Bez rizika',
    desc: 'Success fee — neuspějeme, neplatíte. Žádné vstupní poplatky.',
  },
  {
    icon: Smartphone,
    title: 'Online přehled',
    desc: 'Sledujte stav svého případu online kdykoliv a odkudkoliv.',
  },
  {
    icon: HeartHandshake,
    title: 'Osobní přístup',
    desc: 'Každý případ má svého zpracovatele, který je vám k dispozici.',
  },
]

const PRICING_TIERS = [
  {
    name: 'Základní',
    target: 'Běžné škody do 50 000 Kč',
    fee: '15%',
    desc: 'Autopojištění, domácnost, drobné škody',
    featured: false,
  },
  {
    name: 'Standard',
    target: 'Škody 50 000 – 500 000 Kč',
    fee: '12%',
    desc: 'Majetkové škody, odpovědnost, úrazy',
    featured: true,
  },
  {
    name: 'Premium',
    target: 'Škody nad 500 000 Kč',
    fee: '10%',
    desc: 'Průmyslové škody, složité případy, odvolání',
    featured: false,
  },
]

const STATS = [
  { value: '500+', label: 'vyřízených případů' },
  { value: 'Ø 23%', label: 'vyšší plnění' },
  { value: 'Do 14 dnů', label: 'vyřízení' },
  { value: '4.9/5', label: 'hodnocení' },
]

export default function ClaimsLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background" />
          <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-blue-400/[0.07] blur-3xl" />
          <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full bg-blue-300/[0.06] blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 px-4 py-1.5 text-sm text-blue-700 dark:text-blue-300 mb-8">
            <Shield className="h-3.5 w-3.5" />
            Platíte jen za výsledek
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Zpracujeme vaši{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
              pojistnou událost
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Vyřídíme vše za vás — od nahlášení škody po vyplacení pojistného plnění.
            Platíte jen za výsledek.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/claims/new"
              className="inline-flex items-center justify-center h-12 px-8 text-base font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Nahlásit událost
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center h-12 px-8 text-base font-medium rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors"
            >
              Jak to funguje ↓
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Jak to funguje ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Jak to funguje
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Tři jednoduché kroky k vyřízení pojistné události.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative text-center group">
                {/* Connector line */}
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

      {/* ── Proč my (výhody) ───────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Proč řešit pojistnou událost s námi
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Profesionální přístup, který vám ušetří čas a přinese vyšší plnění.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-border/50 bg-card p-6 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/50 transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Ceník ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Transparentní ceník
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Platíte jen za výsledek. Žádné vstupní poplatky.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-6 text-center transition-all duration-200 ${
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

                <h3 className="text-lg font-semibold text-foreground mt-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{tier.target}</p>

                <div className="my-6">
                  <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {tier.fee}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">success fee</span>
                </div>

                <p className="text-sm text-muted-foreground">{tier.desc}</p>

                <Link
                  href="/claims/new"
                  className={`mt-6 inline-flex items-center justify-center w-full h-10 rounded-md text-sm font-medium transition-colors ${
                    tier.featured
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  Nahlásit událost
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
            Success fee se počítá z vymoženého plnění nad rámec toho, co pojišťovna nabídla původně.
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Často kladené otázky
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Máte otázku? Zde najdete odpovědi na nejčastější dotazy.
            </p>
          </div>

          <ClaimsFAQ />
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
            Máte pojistnou událost? Začněte teď.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Vyplnění formuláře zabere jen 5 minut. Ozveme se vám do 24 hodin.
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

          <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Phone className="h-4 w-4" />
            Nebo zavolejte: +420 XXX XXX XXX
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
