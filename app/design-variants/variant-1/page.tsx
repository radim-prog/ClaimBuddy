'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ShieldCheck,
  BarChart3,
  Users,
  Check,
  ArrowRight,
  Building2,
  FileSearch,
  CalendarCheck,
} from 'lucide-react'

// ── Colors ──
const NAVY = '#1e3a5f'
const GOLD = '#c9a44c'
const GOLD_LIGHT = '#f5ecd7'
const CREAM = '#faf8f4'
const WARM_GRAY = '#6b7280'

type BillingCycle = 'monthly' | 'yearly'

const PLANS = [
  {
    name: 'Starter',
    priceMonthly: 490,
    priceYearly: 4900,
    description: 'Pro začínající účetní a menší kanceláře.',
    features: ['Až 20 firem', '3 uživatelé', '10 AI extrakcí/měs', 'Email podpora'],
    popular: false,
  },
  {
    name: 'Professional',
    priceMonthly: 1290,
    priceYearly: 12900,
    description: 'Pro rostoucí účetní firmy s nároky na efektivitu.',
    features: ['Až 100 firem', '10 uživatelů', '50 AI extrakcí/měs', 'Prioritní podpora', 'API přístup', 'Vlastní šablony'],
    popular: true,
  },
  {
    name: 'Enterprise',
    priceMonthly: 2990,
    priceYearly: 29900,
    description: 'Pro velké účetní firmy a korporace.',
    features: ['Neomezený počet firem', 'Neomezení uživatelé', '200 AI extrakcí/měs', 'Dedikovaný account manager', 'SLA 99.9%', 'On-premise možnost'],
    popular: false,
  },
]

function fmtPrice(price: number): string {
  return price.toLocaleString('cs-CZ')
}

export default function DesignVariant1() {
  const [billing, setBilling] = useState<BillingCycle>('monthly')

  return (
    <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
      {/* ── Navbar ── */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" style={{ color: NAVY }} />
            <span className="text-xl font-serif font-bold tracking-tight" style={{ color: NAVY }}>
              ZajCon
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#reasons" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Proč ZajCon
            </a>
            <a href="#pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Ceník
            </a>
            <Link
              href="/auth/login"
              className="text-sm font-semibold px-5 py-2 rounded-md text-white transition-colors"
              style={{ backgroundColor: NAVY }}
            >
              Přihlásit se
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="py-28 sm:py-36">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em] mb-6"
            style={{ color: GOLD }}
          >
            Platforma pro účetní firmy
          </p>
          <h1
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight"
            style={{ color: NAVY }}
          >
            Účetnictví, které budí
            <br />
            důvěru
          </h1>
          <p className="mt-6 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: WARM_GRAY }}>
            Spravujte desítky firem, automatizujte doklady a komunikujte
            s klienty — vše na jednom místě, bezpečně a profesionálně.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-md text-white text-base font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: NAVY }}
            >
              Vyzkoušet zdarma
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-md text-base font-semibold border-2 transition-colors hover:bg-gray-50"
              style={{ color: NAVY, borderColor: NAVY }}
            >
              Zobrazit ceník
            </a>
          </div>
          <p className="mt-5 text-sm" style={{ color: WARM_GRAY }}>
            Bez platební karty. 30 dní plný přístup.
          </p>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}40, transparent)` }} />
      </div>

      {/* ── 3 reasons ── */}
      <section id="reasons" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em] mb-4"
              style={{ color: GOLD }}
            >
              Proč ZajCon
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: NAVY }}>
              Tři pilíře naší platformy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {[
              {
                icon: ShieldCheck,
                title: 'Bezpečnost a spolehlivost',
                desc: 'Šifrovaná komunikace, auditní logy a zálohování dat. Vaši klienti mohou důvěřovat, že jejich data jsou v bezpečí.',
              },
              {
                icon: FileSearch,
                title: 'AI automatizace dokladů',
                desc: 'Nahrajte fakturu — umělá inteligence rozpozná data, navrhne předkontaci a zařadí doklad. Ušetříte hodiny práce.',
              },
              {
                icon: BarChart3,
                title: 'Přehled a kontrola',
                desc: 'Daňové matice, uzávěrky, DPH přehledy a health score klientů. Vše na jednom místě, přehledně.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: GOLD_LIGHT }}
                >
                  <item.icon className="h-6 w-6" style={{ color: GOLD }} />
                </div>
                <h3 className="font-serif text-xl font-bold mb-3" style={{ color: NAVY }}>
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed" style={{ color: WARM_GRAY }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Numbers strip ── */}
      <section className="py-16" style={{ backgroundColor: NAVY }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: '120+', label: 'Firem ve správě' },
            { value: '30 000+', label: 'Zpracovaných dokladů' },
            { value: '99.9%', label: 'Dostupnost' },
            { value: '4.9/5', label: 'Hodnocení klientů' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl sm:text-4xl font-serif font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em] mb-4"
              style={{ color: GOLD }}
            >
              Ceník
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: NAVY }}>
              Transparentní ceny bez skrytých poplatků
            </h2>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full border border-gray-200 bg-white">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billing === 'monthly'
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={billing === 'monthly' ? { backgroundColor: NAVY } : {}}
              >
                Měsíčně
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billing === 'yearly'
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={billing === 'yearly' ? { backgroundColor: NAVY } : {}}
              >
                Ročně
                <span className="ml-1.5 text-xs font-semibold" style={{ color: billing === 'yearly' ? GOLD_LIGHT : GOLD }}>
                  -17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-8 transition-all ${
                  plan.popular
                    ? 'ring-2 shadow-lg bg-white'
                    : 'border border-gray-200 bg-white'
                }`}
                style={plan.popular ? { ringColor: GOLD } : {}}
              >
                {plan.popular && (
                  <div
                    className="text-xs font-bold uppercase tracking-wider mb-4 px-3 py-1 rounded-full inline-block text-white"
                    style={{ backgroundColor: GOLD }}
                  >
                    Nejpopulárnější
                  </div>
                )}
                <h3 className="font-serif text-2xl font-bold" style={{ color: NAVY }}>
                  {plan.name}
                </h3>
                <p className="text-sm mt-1 mb-6" style={{ color: WARM_GRAY }}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold font-serif" style={{ color: NAVY }}>
                    {fmtPrice(billing === 'monthly' ? plan.priceMonthly : Math.round(plan.priceYearly / 12))}
                  </span>
                  <span className="text-sm ml-1" style={{ color: WARM_GRAY }}>
                    Kč/měs
                  </span>
                  {billing === 'yearly' && (
                    <div className="text-xs mt-1" style={{ color: WARM_GRAY }}>
                      Účtováno {fmtPrice(plan.priceYearly)} Kč/rok
                    </div>
                  )}
                </div>
                <Link
                  href="/auth/register"
                  className="block w-full text-center py-3 rounded-md text-sm font-semibold transition-all"
                  style={
                    plan.popular
                      ? { backgroundColor: NAVY, color: 'white' }
                      : { border: `2px solid ${NAVY}`, color: NAVY }
                  }
                >
                  Začít s {plan.name}
                </Link>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: WARM_GRAY }}>
                      <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: GOLD }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" style={{ color: NAVY }}>
            Připraveni na změnu?
          </h2>
          <p className="text-lg mb-8" style={{ color: WARM_GRAY }}>
            Přidejte se k desítkám účetních firem, které už spravují klienty efektivněji.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-md text-white text-base font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: NAVY }}
          >
            Vyzkoušet 30 dní zdarma
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs" style={{ color: WARM_GRAY }}>
          <span>ZajCon Solutions s.r.o. | IČO: 21890331</span>
          <div className="flex gap-4">
            <Link href="/legal/terms" className="hover:text-gray-900 transition-colors">Podmínky</Link>
            <Link href="/legal/privacy" className="hover:text-gray-900 transition-colors">Ochrana dat</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
