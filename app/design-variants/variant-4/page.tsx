'use client'

import { useEffect, useRef, useState } from 'react'

// ── Grain texture SVG (inline, no external deps) ─────────────────────────────
const GrainSVG = () => (
  <svg
    className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.035]"
    style={{ mixBlendMode: 'overlay' }}
    aria-hidden
  >
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
)

// ── Reveal hook ───────────────────────────────────────────────────────────────
function useReveal(threshold = 0.25) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

// ── Feature section ───────────────────────────────────────────────────────────
function FeatureSection({
  number,
  headline,
  sub,
  align = 'center',
}: {
  number: string
  headline: string
  sub: string
  align?: 'left' | 'center' | 'right'
}) {
  const { ref, visible } = useReveal()
  const alignClass = align === 'left' ? 'items-start text-left' : align === 'right' ? 'items-end text-right' : 'items-center text-center'

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-8 overflow-hidden">
      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: align === 'left'
            ? 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(139,92,246,0.12) 0%, transparent 70%)'
            : align === 'right'
            ? 'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(139,92,246,0.12) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,92,246,0.10) 0%, transparent 70%)',
        }}
      />

      <div
        ref={ref}
        className={`relative max-w-6xl mx-auto w-full flex flex-col gap-6 transition-all duration-1000 ease-out ${alignClass} ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <span className="text-sm font-mono tracking-[0.25em] text-purple-400/60 uppercase">
          {number}
        </span>
        <h2 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight text-white leading-[0.95] max-w-5xl">
          {headline}
        </h2>
        <p className="text-lg sm:text-xl text-white/40 max-w-xl leading-relaxed font-light">
          {sub}
        </p>
      </div>

      {/* Divider */}
      <div className="absolute bottom-0 left-8 right-8 h-px bg-white/[0.04]" />
    </section>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Variant4Page() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const heroRef = useRef<HTMLDivElement>(null)
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="bg-black text-white min-h-screen antialiased selection:bg-purple-500/30 selection:text-white">
      <GrainSVG />

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-8 py-5">
        <span className="text-sm font-semibold tracking-wide text-white/80">zajcon</span>
        <a
          href="/auth/login"
          className="text-sm text-white/40 hover:text-white transition-colors duration-300"
        >
          Přihlásit se →
        </a>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-8 overflow-hidden">
        {/* Purple glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,92,246,0.18) 0%, rgba(109,40,217,0.06) 40%, transparent 70%)',
          }}
        />
        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black to-transparent" />

        <div
          ref={heroRef}
          className={`relative text-center max-w-6xl mx-auto transition-all duration-1200 ease-out ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDuration: '1.2s' }}
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-mono tracking-[0.3em] text-white/30 uppercase">
              Účetnictví nové generace
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] xl:text-[10rem] font-bold tracking-tight leading-[0.9] text-white">
            Účetnictví,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 30%, #7c3aed 60%, #4c1d95 100%)',
              }}
            >
              přehodnoceno.
            </span>
          </h1>

          {/* Minimal subline */}
          <p className="mt-10 text-lg sm:text-xl text-white/30 font-light tracking-wide max-w-md mx-auto">
            Pro účetní, kteří nechtějí kompromisy.
          </p>

          {/* CTA */}
          <div className="mt-14">
            <a
              href="/auth/register"
              className="inline-block px-8 py-3.5 text-sm font-medium text-black bg-white rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Začít zdarma
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs font-mono tracking-widest text-white/15">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <FeatureSection
        number="01"
        headline="Vše, co potřebujete. V jednom místě."
        sub="40+ modulů. Jedno přihlášení. Žádné přepínání mezi aplikacemi."
        align="left"
      />

      <FeatureSection
        number="02"
        headline="AI, která skutečně pracuje za vás."
        sub="Vytěžování dokladů, předkontace, upozornění na termíny — automaticky."
        align="right"
      />

      <FeatureSection
        number="03"
        headline="Real-time přehled. Nulová nejistota."
        sub="Vždy víte, co je hotové, co čeká a co hoří. Bez zbytečných schůzek."
        align="left"
      />

      <FeatureSection
        number="04"
        headline="Bezpečnost na úrovni bank."
        sub="GDPR, šifrování, audit log. Vaše data jsou vaše."
        align="center"
      />

      {/* ── Stat bar ─────────────────────────────────────────────────────── */}
      <StatBar />

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <PricingSection billing={billing} onToggle={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')} />

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <FinalCTA />

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="px-8 py-10 flex items-center justify-between text-xs text-white/15 border-t border-white/[0.04]">
        <span>© 2026 zajcon.cz</span>
        <div className="flex gap-6">
          <a href="/legal/terms" className="hover:text-white/40 transition-colors">Podmínky</a>
          <a href="/legal/privacy" className="hover:text-white/40 transition-colors">Soukromí</a>
          <a href="/legal/cookies" className="hover:text-white/40 transition-colors">Cookies</a>
        </div>
      </footer>
    </div>
  )
}

// ── Stat bar ──────────────────────────────────────────────────────────────────
function StatBar() {
  const { ref, visible } = useReveal(0.3)
  const stats = [
    { value: '120+', label: 'aktivních klientů' },
    { value: '40+', label: 'modulů v platformě' },
    { value: '99.9%', label: 'uptime' },
    { value: '0 Kč', label: 'za první měsíc' },
  ]

  return (
    <section className="relative py-24 px-8 border-y border-white/[0.04]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 50% 100% at 50% 50%, rgba(139,92,246,0.05) 0%, transparent 70%)' }}
      />
      <div
        ref={ref}
        className={`relative max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-2">
            <span className="text-4xl sm:text-5xl font-bold text-white tracking-tight">{s.value}</span>
            <span className="text-sm text-white/30 font-light">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function PricingSection({
  billing,
  onToggle,
}: {
  billing: 'monthly' | 'yearly'
  onToggle: () => void
}) {
  const { ref, visible } = useReveal(0.15)

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      sub: 'Pro začátek',
      features: ['5 klientů', '1 uživatel', 'Základní funkce'],
      cta: 'Začít zdarma',
      href: '/auth/register',
      accent: false,
    },
    {
      name: 'Starter',
      price: { monthly: 490, yearly: 408 },
      sub: 'Pro malé firmy',
      features: ['20 klientů', '3 uživatelé', '10 extrakcí / měs'],
      cta: 'Vybrat Starter',
      href: '/auth/register',
      accent: false,
    },
    {
      name: 'Professional',
      price: { monthly: 1290, yearly: 1075 },
      sub: 'Nejoblíbenější',
      features: ['100 klientů', '10 uživatelů', '50 extrakcí / měs', 'AI předkontace'],
      cta: 'Vybrat Professional',
      href: '/auth/register',
      accent: true,
    },
    {
      name: 'Enterprise',
      price: { monthly: 2990, yearly: 2492 },
      sub: 'Bez limitů',
      features: ['Neomezení klienti', 'Neomezení uživatelé', '200 extrakcí / měs', 'Prioritní podpora'],
      cta: 'Kontaktovat nás',
      href: '/auth/register',
      accent: false,
    },
  ]

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center py-32 px-8 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(109,40,217,0.08) 0%, transparent 70%)' }}
      />

      <div
        ref={ref}
        className={`relative w-full max-w-6xl mx-auto transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
            Jednoduchý ceník.
          </h2>
          <p className="text-white/30 text-lg font-light mb-10">Žádné skryté poplatky. Změna nebo zrušení kdykoliv.</p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4">
            <span className={`text-sm transition-colors ${billing === 'monthly' ? 'text-white' : 'text-white/30'}`}>
              Měsíčně
            </span>
            <button
              onClick={onToggle}
              role="switch"
              aria-checked={billing === 'yearly'}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                billing === 'yearly' ? 'bg-purple-600' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                  billing === 'yearly' ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className={`text-sm transition-colors ${billing === 'yearly' ? 'text-white' : 'text-white/30'}`}>
              Ročně
              {billing === 'yearly' && (
                <span className="ml-2 text-xs text-purple-400">–17%</span>
              )}
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const price = plan.price[billing]
            const isAccent = plan.accent
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col p-8 rounded-2xl transition-all duration-300 ${
                  isAccent
                    ? 'bg-white/[0.06] border border-purple-500/30 shadow-[0_0_60px_rgba(139,92,246,0.15)]'
                    : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04]'
                }`}
              >
                {isAccent && (
                  <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
                )}

                <div className="mb-8">
                  <p className="text-xs font-mono tracking-widest text-white/30 uppercase mb-3">{plan.name}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-bold text-white">{price === 0 ? 'Zdarma' : `${price.toLocaleString('cs')}`}</span>
                    {price > 0 && <span className="text-white/30 text-sm mb-1.5"> Kč/měs</span>}
                  </div>
                  <p className="text-xs text-white/25">{plan.sub}</p>
                </div>

                <ul className="flex flex-col gap-3 mb-10 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/50">
                      <span className="w-1 h-1 rounded-full bg-purple-400/60 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className={`block text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isAccent
                      ? 'bg-purple-600 text-white hover:bg-purple-500'
                      : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.10] hover:text-white'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTA() {
  const { ref, visible } = useReveal(0.3)

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-8 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 60%, rgba(139,92,246,0.15) 0%, rgba(76,29,149,0.05) 50%, transparent 70%)',
        }}
      />
      {/* Top fade */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black to-transparent" />

      <div
        ref={ref}
        className={`relative text-center transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <h2 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight text-white leading-[0.95] mb-8">
          Připraveni začít?
        </h2>
        <p className="text-white/30 text-lg font-light mb-12 max-w-sm mx-auto">
          30 dní zdarma. Žádná kreditní karta.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/auth/register"
            className="px-10 py-4 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Vytvořit účet zdarma
          </a>
          <a
            href="/pricing"
            className="px-10 py-4 text-sm text-white/40 hover:text-white transition-colors duration-300"
          >
            Porovnat plány →
          </a>
        </div>
      </div>
    </section>
  )
}
