import {
  ScanLine, CalendarCheck, Car, Store, ShieldAlert, PenLine,
  Receipt, MessageCircle, ArrowRight, Sparkles, Brain, Zap,
} from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  {
    icon: ScanLine,
    accent: 'from-blue-500 to-cyan-400',
    accentBg: 'bg-blue-500/10',
    accentText: 'text-blue-400',
    title: 'AI vytěžování dokladů',
    desc: 'Nahrajte fakturu nebo účtenku — AI přečte údaje za 5 sekund. Rozpozná dodavatele, IČO, částky, DPH sazbu i datum splatnosti. Automaticky navrhne předkontaci podle českých účetních standardů (197 účtů, 27 pravidel). Tříkrokový pipeline: OCR rozpoznání → AI extrakce dat → split-screen verifikace. Podporuje faktury, paragony, bankovní výpisy i pokladní doklady.',
    badge: 'AI',
    href: '/funkce/vytezovani',
    size: 'large' as const,
  },
  {
    icon: CalendarCheck,
    accent: 'from-violet-500 to-purple-400',
    accentBg: 'bg-violet-500/10',
    accentText: 'text-violet-400',
    title: 'Měsíční uzávěrky',
    desc: 'Průběžná kontrola DPH, dokladů a termínů. Master matice zobrazí stav všech klientů najednou — žádný termín vám neuteče.',
    href: '/pro-ucetni',
    size: 'medium' as const,
  },
  {
    icon: Car,
    accent: 'from-emerald-500 to-green-400',
    accentBg: 'bg-emerald-500/10',
    accentText: 'text-emerald-400',
    title: 'Cestovní deník s AI',
    desc: 'Chytrý randomizér vytvoří knihu jízd z tankování a tras. Výpočet PHM, právně bezpečné záznamy.',
    badge: 'AI',
    href: '/pro-podnikatele',
    size: 'medium' as const,
  },
  {
    icon: Store,
    accent: 'from-amber-500 to-orange-400',
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-400',
    title: 'Marketplace účetních',
    desc: 'Podnikatel hledá účetní? Párujeme podle oboru, lokality a kapacity. Transparentní profily a hodnocení.',
    href: '/marketplace',
    size: 'small' as const,
  },
  {
    icon: ShieldAlert,
    accent: 'from-red-500 to-rose-400',
    accentBg: 'bg-red-500/10',
    accentText: 'text-red-400',
    title: 'Krizové řízení podniku',
    desc: 'AI vygeneruje krizový plán šitý na míru vašemu oboru. FMEA analýza rizik, akční kroky, varovné signály.',
    badge: 'AI',
    href: '/pro-podnikatele',
    size: 'small' as const,
  },
  {
    icon: PenLine,
    accent: 'from-sky-500 to-blue-400',
    accentBg: 'bg-sky-500/10',
    accentText: 'text-sky-400',
    title: 'Elektronický podpis',
    desc: 'Integrace se Signi.com — podepisujte smlouvy, plné moci a dokumenty bez papíru. Právně závazné.',
    href: '/pro-ucetni',
    size: 'small' as const,
  },
  {
    icon: Receipt,
    accent: 'from-indigo-500 to-blue-400',
    accentBg: 'bg-indigo-500/10',
    accentText: 'text-indigo-400',
    title: 'Fakturace + QR platby',
    desc: 'Vystavujte faktury, proformy i dobropisy. QR kód pro okamžitou platbu přímo na faktuře — klient zaplatí jedním klikem.',
    href: '/pro-podnikatele',
    size: 'medium' as const,
  },
  {
    icon: MessageCircle,
    accent: 'from-pink-500 to-fuchsia-400',
    accentBg: 'bg-pink-500/10',
    accentText: 'text-pink-400',
    title: 'Komunikace klient ↔ účetní',
    desc: 'Tematické konverzace místo chaosu v emailu. Klient vidí jen svou firmu, účetní má přehled přes všechny klienty.',
    href: '/pro-podnikatele',
    size: 'medium' as const,
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28 bg-gray-900 dark:bg-gray-950 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Reálné funkce, ne sliby</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-white">
            Vše na jednom místě
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Dva portály, jeden systém. Klienti nahrávají — účetní zpracovávají.
            AI automatizuje to, co jde.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {/* Row 1: large + medium */}
          <FeatureCard feature={FEATURES[0]} className="lg:col-span-2 lg:row-span-2" />
          <FeatureCard feature={FEATURES[1]} className="lg:col-span-2" />

          {/* Row 2: medium + medium */}
          <FeatureCard feature={FEATURES[2]} className="lg:col-span-2" />

          {/* Row 3: 3 small */}
          <FeatureCard feature={FEATURES[3]} className="lg:col-span-1" />
          <FeatureCard feature={FEATURES[4]} className="lg:col-span-1" />
          <FeatureCard feature={FEATURES[5]} className="lg:col-span-2" />

          {/* Row 4: medium + medium */}
          <FeatureCard feature={FEATURES[6]} className="lg:col-span-2" />
          <FeatureCard feature={FEATURES[7]} className="lg:col-span-2" />
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  feature,
  className = '',
}: {
  feature: typeof FEATURES[number]
  className?: string
}) {
  const Icon = feature.icon

  return (
    <Link
      href={feature.href}
      className={`group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300 flex flex-col ${className}`}
    >
      {/* Gradient glow on hover */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />

      <div className="relative flex-1 flex flex-col">
        {/* Icon + badge row */}
        <div className="flex items-start justify-between mb-4">
          <div className={`inline-flex rounded-xl ${feature.accentBg} p-3`}>
            <Icon className={`h-5 w-5 ${feature.accentText}`} />
          </div>
          {feature.badge && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300">
              {feature.badge === 'AI' && <Brain className="h-3 w-3" />}
              {feature.badge}
            </span>
          )}
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-white mb-2 group-hover:text-white/90">
          {feature.title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed flex-1">
          {feature.desc}
        </p>

        {/* CTA */}
        <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${feature.accentText} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
          <span>Více</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
