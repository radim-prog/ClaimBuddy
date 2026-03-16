import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ScanLine, Tags, Layers, CheckCircle2, ArrowRight, Upload, Sparkles, FileCheck,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Vytěžování dokladů — Automatická extrakce dat z faktur',
  description:
    'Nahrajte fakturu nebo paragon a AI vytěží údaje za 5 sekund. OCR rozpoznání, automatická kategorizace, split-screen verifikace.',
  openGraph: {
    title: 'AI Vytěžování dokladů',
    description: 'Automatická extrakce dat z faktur, paragonů a bankovních výpisů pomocí AI.',
    type: 'website',
  },
}

const BENEFITS = [
  { icon: ScanLine, title: 'OCR rozpoznání', desc: 'Pokročilé optické rozpoznání textu přečte i nekvalitní skeny a fotky z mobilu. Podporuje češtinu i slovenštinu.' },
  { icon: Tags, title: 'Automatická kategorizace', desc: 'AI rozpozná typ dokladu a přiřadí správnou kategorii, dodavatele i účetní předkontaci.' },
  { icon: Layers, title: 'Hromadné zpracování', desc: 'Nahrajte desítky dokladů najednou. Fronta je zpracuje postupně a upozorní vás, až bude hotovo.' },
  { icon: CheckCircle2, title: 'Split-screen verifikace', desc: 'Doklad vlevo, vytěžená data vpravo. Zkontrolujte a schvalte jedním kliknutím.' },
]

const STEPS = [
  { icon: Upload, title: 'Nahrajte doklad', desc: 'Foťte mobilem nebo nahrajte PDF. Podporujeme faktury, paragony i bankovní výpisy.' },
  { icon: Sparkles, title: 'AI vytěží údaje', desc: 'Umělá inteligence přečte doklad za 5 sekund a rozpozná všechny klíčové údaje.' },
  { icon: FileCheck, title: 'Zkontrolujte a schvalte', desc: 'Ověřte vytěžená data v přehledném formuláři a schvalte jedním klikem.' },
]

export default function VytezovaniPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground leading-tight">
            Nahrajte doklad, AI ho přečte{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600">
              za 5 sekund.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Přestaňte ručně opisovat faktury. Naše AI vytěží všechny údaje automaticky —
            vy jen zkontrolujete a schválíte.
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
            Podporuje faktury, paragony i bankovní výpisy.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Proč AI vytěžování?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Ušetřete hodiny ručního přepisování. AI zvládne i nekvalitní skeny.
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
            Zkuste AI vytěžování na vlastních dokladech
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            30 dní zdarma, bez platební karty. Stačí se zaregistrovat.
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
