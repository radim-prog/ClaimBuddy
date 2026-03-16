import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Shield, Star, Brain, MessageCircle, ArrowRight, ClipboardList, Search, HeartHandshake,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Marketplace účetních — Najděte ideálního účetního',
  description:
    'Spojujeme podnikatele s ověřenými účetními. Inteligentní matching, hodnocení, přímá komunikace v aplikaci.',
  openGraph: {
    title: 'Marketplace účetních',
    description: 'Najděte ideálního účetního pro vaši firmu. Ověřené profily, hodnocení, AI matching.',
    type: 'website',
  },
}

const BENEFITS = [
  { icon: Shield, title: 'Ověřené profily', desc: 'Každý účetní projde verifikací. Vidíte certifikace, zkušenosti a specializaci na konkrétní obory.' },
  { icon: Star, title: 'Hodnocení a recenze', desc: 'Transparentní hodnocení od skutečných klientů. Vyberte účetního s nejlepšími referencemi.' },
  { icon: Brain, title: 'Inteligentní matching', desc: 'AI analyzuje vaše požadavky a navrhne účetní, kteří nejlépe odpovídají vaší firmě a oboru.' },
  { icon: MessageCircle, title: 'Přímá komunikace', desc: 'Komunikujte s účetním přímo v aplikaci. Žádné emaily, žádné telefony — vše na jednom místě.' },
]

const STEPS = [
  { icon: ClipboardList, title: 'Zadejte požadavky', desc: 'Popište svou firmu, obor a co od účetního očekáváte. Čím více detailů, tím lepší shoda.' },
  { icon: Search, title: 'AI najde nejlepší shodu', desc: 'Algoritmus porovná vaše požadavky s profily účetních a navrhne nejlepší kandidáty.' },
  { icon: HeartHandshake, title: 'Komunikujte přímo v appce', desc: 'Domluvte podmínky přímo v aplikaci a začněte spolupracovat bez zbytečných kroků.' },
]

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground leading-tight">
            Spojujeme podnikatele{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600">
              s ověřenými účetními.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Hledáte účetního pro svou firmu? Náš marketplace vám najde ideální shodu
            podle oboru, velikosti firmy a vašich požadavků.
          </p>
          <div className="mt-8">
            <Button size="lg" className="h-12 px-8 text-base font-semibold" asChild>
              <Link href="/auth/register">
                Vyzkoušet zdarma
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Zdarma pro podnikatele. Bez závazků.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Proč hledat účetního u nás
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Transparentní výběr s ověřenými profily a reálnými recenzemi.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border/50 bg-card p-6 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-soft-md transition-all duration-200"
              >
                <div className="mb-4 inline-flex rounded-xl bg-purple-100 dark:bg-purple-900/30 p-3">
                  <b.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Jak to funguje
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center">
                {i < 2 && (
                  <div className="hidden sm:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-purple-300 to-purple-100 dark:from-purple-700 dark:to-purple-900" />
                )}
                <div className="relative inline-flex mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-950/20 flex items-center justify-center">
                    <s.icon className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-purple-600 to-violet-600 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-white max-w-2xl mx-auto">
            Najděte svého účetního ještě dnes
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            Zaregistrujte se zdarma a nechte AI najít ideální shodu pro vaši firmu.
          </p>
          <div className="mt-10">
            <Button size="lg" className="h-12 px-8 text-base font-semibold bg-white text-purple-700 hover:bg-white/90" asChild>
              <Link href="/auth/register">
                Vyzkoušet zdarma
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
