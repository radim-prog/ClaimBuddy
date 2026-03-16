'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ScanLine, CalendarCheck, Car, Store, ShieldAlert, PenLine,
  Receipt, MessageCircle, ArrowRight, ChevronDown, Check, X,
  Star, Sparkles, FileSearch, Upload, Cpu, CheckCircle, TrendingUp,
  Gift, Building2, FileOutput, ShieldCheck, ArrowRightLeft,
  HelpCircle,
} from 'lucide-react'

/* ============================================================================
   VARIANT 3: "Friendly & Accessible" — Notion / Figma / Linear inspired
   Pastel palette, rounded-3xl, playful illustrations, warm tone
   ============================================================================ */

// ─── Palette ────────────────────────────────────────────────────────────────
const P = {
  lavender: '#e6e0f3',
  lavenderLight: '#f3f0fa',
  mint: '#d1fae5',
  mintLight: '#ecfdf5',
  peach: '#fde8d0',
  peachLight: '#fff7ed',
  sky: '#dbeafe',
  skyLight: '#eff6ff',
  rose: '#fce7f3',
  roseLight: '#fdf2f8',
  lemon: '#fef9c3',
  lemonLight: '#fefce8',
}

// ─── Data ───────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '1',
    emoji: '📸',
    title: 'Nahrajte doklady',
    desc: 'Fotkou, emailem nebo drag & drop. System je automaticky roztridl ke spravne firme.',
    bg: P.sky,
    bgLight: P.skyLight,
  },
  {
    num: '2',
    emoji: '🤖',
    title: 'AI vytezi data',
    desc: 'Trojkrokovy pipeline rozpozna udaje z dokladu. System je naparuje na bankovni transakce.',
    bg: P.lavender,
    bgLight: P.lavenderLight,
  },
  {
    num: '3',
    emoji: '✅',
    title: 'Ucetni zkontroluje',
    desc: 'Ucetni vidi co chybi, urguje klienta automaticky. Mesicni uzaverka na par kliknuti.',
    bg: P.mint,
    bgLight: P.mintLight,
  },
  {
    num: '4',
    emoji: '📊',
    title: 'Klient vidi svou dan',
    desc: 'Zadne prekvapeni v breznu. Klient sleduje odhadovanou dan mesic po mesici v realnem case.',
    bg: P.peach,
    bgLight: P.peachLight,
  },
]

const FEATURES = [
  {
    icon: ScanLine,
    emoji: '🔍',
    title: 'AI vytezovani dokladu',
    desc: 'Nahrajte fakturu — AI precte udaje za 5 sekund. Rozpozna dodavatele, ICO, castky i DPH sazbu.',
    bg: P.sky,
    badge: 'AI',
    size: 'large' as const,
  },
  {
    icon: CalendarCheck,
    emoji: '📅',
    title: 'Mesicni uzaverky',
    desc: 'Prubezna kontrola DPH, dokladu a terminu. Master matice zobrazi stav vsech klientu najednou.',
    bg: P.lavender,
    size: 'medium' as const,
  },
  {
    icon: Car,
    emoji: '🚗',
    title: 'Cestovni denik s AI',
    desc: 'Chytry randomizer vytvori knihu jizd z tankovani a tras. Vypocet PHM, pravne bezpecne zaznamy.',
    bg: P.mint,
    badge: 'AI',
    size: 'medium' as const,
  },
  {
    icon: Store,
    emoji: '🏪',
    title: 'Marketplace ucetnich',
    desc: 'Podnikatel hleda ucetni? Parujeme podle oboru, lokality a kapacity.',
    bg: P.peach,
    size: 'small' as const,
  },
  {
    icon: ShieldAlert,
    emoji: '🛡️',
    title: 'Krizove rizeni',
    desc: 'AI vygeneruje krizovy plan sity na miru vasemu oboru. FMEA analyza rizik.',
    bg: P.rose,
    badge: 'AI',
    size: 'small' as const,
  },
  {
    icon: PenLine,
    emoji: '✍️',
    title: 'Elektronicky podpis',
    desc: 'Integrace se Signi.com — podepisujte smlouvy bez papiru. Pravne zavazne.',
    bg: P.lemon,
    size: 'small' as const,
  },
  {
    icon: Receipt,
    emoji: '🧾',
    title: 'Fakturace + QR platby',
    desc: 'Vystavujte faktury, proformy i dobropisy. QR kod pro okamzitou platbu.',
    bg: P.skyLight,
    size: 'medium' as const,
  },
  {
    icon: MessageCircle,
    emoji: '💬',
    title: 'Komunikace klient ↔ ucetni',
    desc: 'Tematicke konverzace misto chaosu v emailu. Vse je v kontextu konkretni firmy.',
    bg: P.roseLight,
    size: 'medium' as const,
  },
]

const TESTIMONIALS = [
  {
    quote: 'Predtim jsme travili hodiny kontrolou, jestli nam klienti poslali vsechny podklady. Ted to vidime v matici na jedno kliknuti.',
    name: 'Ing. Petra Dvorakova',
    role: 'Jednatelka',
    company: 'Dvorakova & partneri s.r.o.',
    emoji: '👩‍💼',
    bg: P.lavenderLight,
  },
  {
    quote: 'Konecne system, ktery pochopi ucetni praxi v Cesku. DPH matice, uzaverky, terminy — vsechno na jednom miste.',
    name: 'Mgr. Tomas Kratochvil',
    role: 'Vedouci ucetniho oddeleni',
    company: 'EKO-UCTO Brno s.r.o.',
    emoji: '👨‍💻',
    bg: P.mintLight,
  },
  {
    quote: 'Presli jsme z Excelu a papirovych slozek. Behem mesice jsme meli vsechny klienty v systemu.',
    name: 'Jana Markova',
    role: 'Samostatna ucetni',
    company: 'Ucetnictvi Markova',
    emoji: '👩‍🏫',
    bg: P.peachLight,
  },
]

interface PlanDef {
  name: string
  emoji: string
  price: number
  priceYearly: number
  desc: string
  features: string[]
  excluded: string[]
  popular?: boolean
  bg: string
  cta: string
}

const CLIENT_PLANS: PlanDef[] = [
  {
    name: 'Free',
    emoji: '🌱',
    price: 0,
    priceYearly: 0,
    desc: 'Pro zacatek. Zakladni prehled o ucetnictvi.',
    features: ['Neomezene faktury', 'Adresar (max 5 partneru)', 'Zakladni cestovni denik', 'Zpravy s ucetnim', 'Nahravani dokladu'],
    excluded: ['AI vytezovani dokladu', 'Spisy a dokumenty', 'Rozsirene statistiky'],
    bg: P.skyLight,
    cta: 'Zacit zdarma',
  },
  {
    name: 'Plus',
    emoji: '🚀',
    price: 199,
    priceYearly: 1990,
    desc: 'Pro aktivni podnikatele. Vse co potrebujete.',
    popular: true,
    features: ['Vse z Free', 'Neomezeny adresar', 'Plny cestovni denik + CSV', '5 AI extrakci / mesic', 'Spisy — plny pristup', 'QR platebni kody'],
    excluded: ['Prioritni podpora'],
    bg: P.lavenderLight,
    cta: 'Vyzkouset 30 dni zdarma',
  },
  {
    name: 'Premium',
    emoji: '👑',
    price: 799,
    priceYearly: 7990,
    desc: 'Kompletni reseni pro velke podnikatele.',
    features: ['Vse z Plus', '50 AI extrakci / mesic', 'Proforma / faktura / dobropis', 'Rozsirene statistiky a reporty', 'Krizovy AI chatbot', 'Cestovni randomizer', 'Prioritni podpora 24/7'],
    excluded: [],
    bg: P.peachLight,
    cta: 'Vyzkouset 90 dni zdarma',
  },
]

const ACCOUNTANT_PLANS: PlanDef[] = [
  {
    name: 'Zaklad',
    emoji: '🌱',
    price: 0,
    priceYearly: 0,
    desc: 'Pro jednotlivce — zacnete bez zavazku.',
    features: ['Max 10 firem', '1 uzivatel', 'Ukoly + time tracking', 'Seznam klientu + profily', 'Terminy a uzaverky', 'Kontrola plateb'],
    excluded: ['AI vytezovani', 'Projekty a spisy'],
    bg: P.mintLight,
    cta: 'Zacit zdarma',
  },
  {
    name: 'Profi',
    emoji: '💼',
    price: 699,
    priceYearly: 6990,
    desc: 'Pro ucetni firmy. Vse pro efektivni praci.',
    popular: true,
    features: ['Max 100 firem / 5 uzivatelu', 'Skupiny klientu', 'Projekty + spisy', 'Komunikace + notifikace', 'DPH matice + dan z prijmu', 'B2B fakturace klientum', 'Google Drive integrace'],
    excluded: [],
    bg: P.lavenderLight,
    cta: 'Vyzkouset 30 dni zdarma',
  },
  {
    name: 'Enterprise',
    emoji: '🏢',
    price: 3999,
    priceYearly: 39990,
    desc: 'Neomezene reseni pro velke kancelare.',
    features: ['Neomezene firmy + uzivatele', '200 AI extrakci / mesic', 'Health score klientu', 'Znalostni baze', 'Multi-tenant sprava', 'Raynet CRM + API pristup', 'Dedikovana podpora'],
    excluded: [],
    bg: P.peachLight,
    cta: 'Kontaktujte nas',
  },
]

const FAQ_ITEMS = [
  {
    emoji: '🔍',
    q: 'Jak funguje AI vytezovani dokladu?',
    a: 'Nahrajete foto nebo PDF dokladu. OCR engine precte text, AI model extrahuje klicove udaje (dodavatel, ICO, castka, DPH sazba) a navrhne predkontaci podle ceskych ucetnich standardu. Vysledek zkontrolujete ve split-screen verifikaci.',
  },
  {
    emoji: '🎁',
    q: 'Muzu to vyzkouset zdarma?',
    a: 'Ano! Zakladni tarif je zdarma navzdy. Navic kazdy novy uzivatel dostane 30 dni tarifu Professional zdarma, bez nutnosti zadavat platebni kartu. Po uplynutí se automaticky prepnete na Free.',
  },
  {
    emoji: '🏢',
    q: 'Kolik firem muzu spravovat?',
    a: 'Zalezi na tarifu. Zaklad (zdarma): 10 firem a 1 uzivatel. Profi (699 Kc/mes): 100 firem a 5 uzivatelu. Enterprise: bez limitu.',
  },
  {
    emoji: '💬',
    q: 'Jak funguje komunikace s klienty?',
    a: 'Kazda konverzace ma vlastni tema a stav. Klient vidi jen svou firmu, ucetni ma prehled pres vsechny klienty na jednom miste. Zadny chaos v emailu.',
  },
  {
    emoji: '📤',
    q: 'Exportujete do Pohody?',
    a: 'Ano. Generujeme XML exporty kompatibilni s Pohodou — faktury vydane, prijate doklady a pokladni doklady. Export stahnete a nahrajete do Pohody rucne.',
  },
  {
    emoji: '🚗',
    q: 'Jak funguje cestovni denik?',
    a: 'Klient zadava vozidla, ridice a oblibene trasy. AI randomizer umi automaticky sestavit knihu jizd z evidovanych tankovani — generuje realisticke trasy s vypoctem PHM.',
  },
  {
    emoji: '🔒',
    q: 'Je to bezpecne? Jak resite GDPR?',
    a: 'Data jsou sifrovana pri prenosu (TLS) i v klidu. Databaze bezi na Supabase s row-level security. Servery jsou v EU (Frankfurt). Plne v souladu s GDPR.',
  },
]

// ─── STAT DATA ──────────────────────────────────────────────────────────────
const STATS = [
  { value: '40+', label: 'modulu v platforme', emoji: '🧩' },
  { value: '120+', label: 'firem pod spravou', emoji: '🏢' },
  { value: '72', label: 'clanku v bazi', emoji: '📚' },
  { value: '0 Kc', label: 'na prvnich 30 dni', emoji: '🎉' },
]

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function V3Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/design-variants/variant-3" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
            U
          </div>
          <span className="font-bold text-gray-900 text-lg">UcetniOS</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Jak to funguje</a>
          <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Funkce</a>
          <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Cenik</a>
          <a href="#faq" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Prihlasit se
          </Link>
          <Link
            href="/auth/register"
            className="text-sm font-semibold px-5 py-2.5 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            Zacit zdarma
          </Link>
        </div>
      </div>
    </nav>
  )
}

function V3Hero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Pastel background blobs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full opacity-40 blur-3xl" style={{ background: P.lavender }} />
      <div className="absolute top-40 right-[10%] w-80 h-80 rounded-full opacity-30 blur-3xl" style={{ background: P.sky }} />
      <div className="absolute bottom-10 left-[30%] w-64 h-64 rounded-full opacity-30 blur-3xl" style={{ background: P.mint }} />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-200 mb-8">
          <span className="text-base">✨</span>
          <span className="text-sm font-medium text-violet-700">Ucetnictvi nemusi byt nudne</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
          Vsechno na jednom miste.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500">
            Jednoduche.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Nahravejte doklady, sledujte uzaverky, komunikujte s ucetnim.
          Ucetni spravuji desitky firem s automatizaci a prehledy.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-3xl bg-gray-900 text-white font-semibold text-base hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/25"
          >
            Vyzkouset zdarma
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-3xl bg-white text-gray-700 font-semibold text-base border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            Zobrazit cenik
          </a>
        </div>

        <p className="mt-5 text-sm text-gray-400">
          Bez platebni karty. 30 dni plny pristup. Zruseni jednim klikem.
        </p>

        {/* Illustration area — pastel cards floating */}
        <div className="mt-16 relative max-w-3xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { emoji: '📄', label: 'Doklady', bg: P.skyLight },
              { emoji: '🤖', label: 'AI vytezeni', bg: P.lavenderLight },
              { emoji: '📊', label: 'Prehledy', bg: P.mintLight },
              { emoji: '💬', label: 'Komunikace', bg: P.peachLight },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl p-6 text-center transition-transform hover:-translate-y-1 hover:shadow-lg"
                style={{ background: item.bg }}
              >
                <div className="text-3xl mb-2">{item.emoji}</div>
                <div className="text-sm font-semibold text-gray-700">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function V3Stats() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center p-6 rounded-3xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="text-2xl mb-2">{s.emoji}</div>
              <div className="text-3xl font-extrabold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function V3HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
            <span className="text-base">🔄</span>
            <span className="text-sm font-medium text-emerald-700">Jednoduchy proces</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Od dokladu k uzaverce.{' '}
            <span className="text-gray-400">Automaticky.</span>
          </h2>
        </div>

        <div className="space-y-6">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-5 p-6 rounded-3xl transition-all hover:shadow-md"
              style={{ background: step.bgLight }}
            >
              {/* Number bubble */}
              <div
                className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: step.bg }}
              >
                {step.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Krok {step.num}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function V3Features() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-200 mb-6">
            <span className="text-base">🎨</span>
            <span className="text-sm font-medium text-violet-700">Realne funkce, ne sliby</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Vse co potrebujete
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Dva portaly, jeden system. Klienti nahravaji — ucetni zpracovavaji.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {/* Row 1: large + medium */}
          <FeatureCard feature={FEATURES[0]} className="lg:col-span-2 lg:row-span-2" />
          <FeatureCard feature={FEATURES[1]} className="lg:col-span-2" />
          <FeatureCard feature={FEATURES[2]} className="lg:col-span-2" />

          {/* Row 2: smalls */}
          <FeatureCard feature={FEATURES[3]} className="lg:col-span-1" />
          <FeatureCard feature={FEATURES[4]} className="lg:col-span-1" />
          <FeatureCard feature={FEATURES[5]} className="lg:col-span-2" />

          {/* Row 3: mediums */}
          <FeatureCard feature={FEATURES[6]} className="lg:col-span-2" />
          <FeatureCard feature={FEATURES[7]} className="lg:col-span-2" />
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature, className = '' }: { feature: typeof FEATURES[number]; className?: string }) {
  return (
    <div
      className={`group relative rounded-3xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg border border-transparent hover:border-gray-200 ${className}`}
      style={{ background: feature.bg }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{feature.emoji}</div>
        {feature.badge && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/60 text-xs font-semibold text-violet-700">
            <Sparkles className="w-3 h-3" />
            {feature.badge}
          </span>
        )}
      </div>

      <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>

      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Vice</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  )
}

function V3Testimonials() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 mb-6">
            <span className="text-base">💬</span>
            <span className="text-sm font-medium text-amber-700">Co rikaji nasi uzivatele</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Ucetni firmy po celem Cesku setri cas
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-3xl p-6 sm:p-8 flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: t.bg }}
            >
              {/* Avatar emoji */}
              <div className="text-4xl mb-4">{t.emoji}</div>

              {/* Quote */}
              <blockquote className="text-sm text-gray-700 leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="pt-4 border-t border-gray-200/50">
                <p className="text-sm font-bold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.role}, {t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function V3Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [portal, setPortal] = useState<'client' | 'accountant'>('client')
  const plans = portal === 'client' ? CLIENT_PLANS : ACCOUNTANT_PLANS

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-200 mb-6">
            <span className="text-base">💰</span>
            <span className="text-sm font-medium text-pink-700">Jednoduchy a transparentni cenik</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Zacnete zdarma, rozsirite podle potreb
          </h2>
          <p className="mt-4 text-lg text-gray-500">Bez skrytych poplatku. Zruseni jednim klikem.</p>
        </div>

        {/* Portal toggle */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setPortal('client')}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              portal === 'client'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            🧑‍💼 Klientsky portal
          </button>
          <button
            onClick={() => setPortal('accountant')}
            className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              portal === 'accountant'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            📊 Portal pro ucetni
          </button>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <span className={`text-sm ${billing === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
            Mesicne
          </span>
          <button
            onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              billing === 'yearly' ? 'bg-violet-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                billing === 'yearly' ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className={`text-sm ${billing === 'yearly' ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
            Rocne
          </span>
          {billing === 'yearly' && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              -17 %
            </span>
          )}
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <V3PlanCard key={`${portal}-${plan.name}`} plan={plan} billing={billing} />
          ))}
        </div>
      </div>
    </section>
  )
}

function V3PlanCard({ plan, billing }: { plan: PlanDef; billing: 'monthly' | 'yearly' }) {
  const price = billing === 'monthly' ? plan.price : plan.priceYearly
  const period = billing === 'monthly' ? '/mes' : '/rok'

  return (
    <div
      className={`relative rounded-3xl p-6 flex flex-col transition-all hover:shadow-lg ${
        plan.popular ? 'ring-2 ring-violet-400 shadow-lg scale-[1.02]' : ''
      }`}
      style={{ background: plan.bg }}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-500 text-white text-xs font-semibold shadow-md">
            <Star className="w-3 h-3" /> Nejoblibenejsi
          </span>
        </div>
      )}

      <div className="mb-4 mt-1">
        <div className="text-2xl mb-2">{plan.emoji}</div>
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
      </div>

      <div className="mb-6">
        <span className="text-3xl font-extrabold text-gray-900">
          {price === 0 ? 'Zdarma' : `${price.toLocaleString('cs-CZ')} Kc`}
        </span>
        {price > 0 && <span className="text-sm text-gray-400 ml-1">{period}</span>}
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            <span className="text-gray-700">{f}</span>
          </li>
        ))}
        {plan.excluded.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <X className="w-4 h-4 mt-0.5 text-gray-300 flex-shrink-0" />
            <span className="text-gray-400">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/auth/register"
        className={`block w-full text-center py-3 px-6 rounded-2xl font-semibold text-sm transition-all ${
          plan.popular
            ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-md'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        {plan.cta}
      </Link>
    </div>
  )
}

function V3FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-200 mb-6">
            <span className="text-base">❓</span>
            <span className="text-sm font-medium text-sky-700">Caste dotazy</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Odpovedi na to, co vas zajima
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className={`rounded-3xl border transition-all ${
                  isOpen
                    ? 'border-gray-200 bg-white shadow-sm'
                    : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  <span className="text-xl flex-shrink-0">{item.emoji}</span>
                  <span className="flex-1 text-sm font-semibold text-gray-900">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pl-14">
                      <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function V3CTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-6">
        <div
          className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
          style={{ background: P.lavenderLight }}
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-50 blur-2xl" style={{ background: P.peach }} />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-50 blur-2xl" style={{ background: P.mint }} />

          <div className="relative">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">
              Pripraveni to vyzkouset?
            </h2>
            <p className="text-gray-600 max-w-lg mx-auto mb-8">
              Zaregistrujte se zdarma a ziskejte 30 dni plneho pristupu. Bez platebni karty, bez zavazku.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-3xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all shadow-lg"
              >
                Zacit zdarma
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pro-ucetni"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-3xl bg-white text-gray-700 font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all"
              >
                Vice o platforme
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function V3Footer() {
  return (
    <footer className="border-t border-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              U
            </div>
            <span className="font-bold text-gray-900">UcetniOS</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Ochrana soukromi</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Podminky</Link>
            <Link href="/contact" className="hover:text-gray-600 transition-colors">Kontakt</Link>
          </div>

          <p className="text-sm text-gray-400">
            &copy; 2026 UcetniOS
          </p>
        </div>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function Variant3Page() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <V3Navbar />
      <V3Hero />
      <V3Stats />
      <V3HowItWorks />
      <V3Features />
      <V3Testimonials />
      <V3Pricing />
      <V3FAQ />
      <V3CTA />
      <V3Footer />
    </div>
  )
}
