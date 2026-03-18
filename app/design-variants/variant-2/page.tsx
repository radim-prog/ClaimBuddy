'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Footer } from '@/components/landing/footer'

// ============================================
// FADE-IN ON SCROLL HOOK
// ============================================

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useFadeIn()
  return (
    <div
      ref={ref}
      className={`fade-section ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ============================================
// DATA
// ============================================

const FEATURES = [
  {
    number: '01',
    title: 'AI vytěžování dokladů',
    desc: 'Nahrajte fakturu — AI přečte údaje za 5 sekund. Rozpozná dodavatele, částky, DPH a navrhne předkontaci podle českých standardů.',
  },
  {
    number: '02',
    title: 'Měsíční uzávěrky',
    desc: 'Master matice zobrazí stav všech klientů najednou. Průběžná kontrola DPH, dokladů a termínů — žádný deadline vám neuteče.',
  },
  {
    number: '03',
    title: 'Komunikace v kontextu',
    desc: 'Tematické konverzace místo chaosu v emailu. Klient vidí jen svou firmu, účetní má přehled přes všechny klienty.',
  },
  {
    number: '04',
    title: 'Fakturace s QR platbami',
    desc: 'Vystavujte faktury, proformy i dobropisy. QR kód přímo na faktuře — klient zaplatí jedním klikem z mobilní banky.',
  },
  {
    number: '05',
    title: 'Cestovní deník s AI',
    desc: 'Chytrý randomizér sestaví knihu jízd z tankování a tras. Výpočet PHM, právně bezpečné záznamy pro finanční úřad.',
  },
  {
    number: '06',
    title: 'Marketplace účetních',
    desc: 'Podnikatel hledá účetní? Párujeme podle oboru, lokality a kapacity. Transparentní profily s hodnocením.',
  },
]

const PLANS = [
  {
    name: 'Základ',
    price: 'Zdarma',
    period: '',
    desc: 'Pro začátek. Fakturace, doklady, komunikace.',
    features: ['10 firem', '1 uživatel', 'Fakturace + QR', 'Komunikace', 'Základní přehledy'],
  },
  {
    name: 'Professional',
    price: '1 290',
    period: '/ měs',
    desc: 'Pro účetní firmy. Vše bez omezení.',
    popular: true,
    features: ['100 firem', '10 uživatelů', 'AI vytěžování (50/měs)', 'Uzávěrky + DPH matice', 'Cestovní deník', 'Prioritní podpora'],
  },
  {
    name: 'Enterprise',
    price: '2 990',
    period: '/ měs',
    desc: 'Pro velké kanceláře. Neomezeno.',
    features: ['Neomezené firmy', 'Neomezení uživatelé', 'AI vytěžování (200/měs)', 'Vše z Professional', 'API přístup', 'Dedikovaný support'],
  },
]

// ============================================
// PAGE
// ============================================

export default function Variant2Page() {
  return (
    <div className="min-h-screen bg-white text-gray-950 selection:bg-purple-200">
      {/* Inline styles for fade animation */}
      <style jsx global>{`
        .fade-section {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fade-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-gray-950">
            Účetní<span className="text-purple-700">OS</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-950 transition-colors">Funkce</a>
            <Link href="/pro-podnikatele" className="text-sm text-gray-500 hover:text-gray-950 transition-colors">Pro podnikatele</Link>
            <Link href="/pro-ucetni" className="text-sm text-gray-500 hover:text-gray-950 transition-colors">Pro účetní</Link>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-950 transition-colors">Ceník</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-950 transition-colors">
              Přihlásit se
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-950 text-white hover:bg-gray-800 transition-colors"
            >
              Začít zdarma
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-40 pb-24 sm:pt-48 sm:pb-32">
        <div className="max-w-4xl mx-auto px-6">
          <FadeIn>
            <p className="text-sm font-medium tracking-widest uppercase text-purple-700 mb-6">
              Účetní platforma nové generace
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.05]">
              Účetnictví,
              <br />
              <span className="text-purple-700">bez kompromisů.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="mt-8 text-xl sm:text-2xl text-gray-500 leading-relaxed max-w-2xl">
              Správa účetnictví pro účetní firmy a jejich klienty.
              Doklady, uzávěrky, komunikace a AI — vše na jednom místě.
            </p>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="mt-12 flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/auth/register"
                className="group inline-flex items-center gap-2 h-14 px-8 rounded-xl bg-purple-700 text-white font-semibold text-lg hover:bg-purple-800 transition-all shadow-lg shadow-purple-700/20"
              >
                Vyzkoušet zdarma
                <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="text-sm text-gray-400 self-center">
                30 dní plný přístup. Bez platební karty.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-gray-100" />
      </div>

      {/* ─── FEATURES (list, not grid) ─── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="text-sm font-medium tracking-widest uppercase text-purple-700 mb-4">
              Funkce
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Vše, co potřebujete.
              <br />
              <span className="text-gray-400">Nic navíc.</span>
            </h2>
          </FadeIn>

          <div className="mt-20 space-y-0">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.number} delay={i * 80}>
                <div className="group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 py-10 border-t border-gray-100 last:border-b">
                  <div className="md:col-span-1">
                    <span className="text-sm font-mono text-gray-300 group-hover:text-purple-700 transition-colors">
                      {f.number}
                    </span>
                  </div>
                  <div className="md:col-span-4">
                    <h3 className="text-xl font-semibold text-gray-950 group-hover:text-purple-700 transition-colors">
                      {f.title}
                    </h3>
                  </div>
                  <div className="md:col-span-7">
                    <p className="text-gray-500 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <div className="bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <FadeIn>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              {[
                { value: '40+', label: 'modulů' },
                { value: '120+', label: 'firem pod správou' },
                { value: '36', label: 'zákonných termínů' },
                { value: '0 Kč', label: 'na prvních 30 dní' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl sm:text-4xl font-bold text-white">{s.value}</div>
                  <div className="mt-1 text-sm text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-medium tracking-widest uppercase text-purple-700 mb-4">
                Ceník
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Jednoduchý a férový.
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Začněte zdarma. Upgradujte, až budete připraveni.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 100}>
                <div
                  className={`relative rounded-2xl p-8 flex flex-col h-full transition-shadow ${
                    plan.popular
                      ? 'bg-gray-950 text-white ring-1 ring-gray-950 shadow-2xl shadow-gray-950/10'
                      : 'bg-white ring-1 ring-gray-200 hover:shadow-lg hover:shadow-gray-100'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-8">
                      <span className="inline-block px-3 py-1 rounded-full bg-purple-700 text-white text-xs font-semibold">
                        Nejoblíbenější
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold ${plan.popular ? 'text-white' : 'text-gray-950'}`}>
                      {plan.name}
                    </h3>
                    <p className={`mt-1 text-sm ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>
                      {plan.desc}
                    </p>
                  </div>

                  <div className="mb-8">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-950'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-sm ml-1 ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>
                        Kč {plan.period}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.popular ? 'text-purple-400' : 'text-purple-700'}`} />
                        <span className={`text-sm ${plan.popular ? 'text-gray-300' : 'text-gray-600'}`}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/auth/register"
                    className={`block text-center py-3 px-6 rounded-xl text-sm font-semibold transition-all ${
                      plan.popular
                        ? 'bg-white text-gray-950 hover:bg-gray-100'
                        : 'bg-gray-950 text-white hover:bg-gray-800'
                    }`}
                  >
                    Začít zdarma
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <FadeIn>
        <section className="py-24 sm:py-32">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Přestaňte řešit papíry.
              <br />
              <span className="text-purple-700">Začněte řídit účetnictví.</span>
            </h2>
            <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
              30 dní plný přístup zdarma. Žádná platební karta. Žádné závazky.
            </p>
            <div className="mt-10">
              <Link
                href="/auth/register"
                className="group inline-flex items-center gap-2 h-14 px-10 rounded-xl bg-purple-700 text-white font-semibold text-lg hover:bg-purple-800 transition-all shadow-lg shadow-purple-700/20"
              >
                Vyzkoušet zdarma
                <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  )
}
