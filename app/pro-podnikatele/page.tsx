import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { LeadCaptureForm } from '@/components/landing/lead-capture-form'
import {
  Upload, FileText, MessageSquare, PieChart, Bell, FolderOpen,
  CheckCircle, Smartphone, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Účetní OS pro podnikatele — Účetnictví pod kontrolou',
  description:
    'Nahrávejte doklady, sledujte uzávěrky, komunikujte s účetním. Vše na jednom místě. Začněte zdarma.',
  openGraph: {
    title: 'Účetní OS pro podnikatele',
    description: 'Přestaňte řešit účetnictví přes email. Moderní portál pro spolupráci s účetním.',
    type: 'website',
  },
}

const PAIN_POINTS = [
  { problem: 'Hledáte doklady po emailech?', solution: 'Nahrajte doklad z mobilu za 5 sekund.' },
  { problem: 'Nevíte, co účetní potřebuje?', solution: 'Dashboard vám ukáže, co chybí.' },
  { problem: 'Zapomínáte na termíny?', solution: 'Automatická upozornění před deadlinem.' },
]

const FEATURES = [
  { icon: Upload, title: 'Rychlé nahrávání', desc: 'Vyfoťte doklad telefonem. AI přečte vše za vás.' },
  { icon: FileText, title: 'Přehled faktur', desc: 'Tvorba faktur, QR kódy pro platby, evidence pohledávek.' },
  { icon: MessageSquare, title: 'Chat s účetním', desc: 'Ptejte se přímo v aplikaci. Konec emailových řetězců.' },
  { icon: PieChart, title: 'Přehled financí', desc: 'DPH, daně, uzávěrky — vše vidíte v reálném čase.' },
  { icon: Bell, title: 'Upozornění', desc: 'Nikdy nezmeškáte termín. Připomínky na míru.' },
  { icon: FolderOpen, title: 'Cestovní deník', desc: 'Evidence jízd a tankování. CSV export pro účetního.' },
]

export default function ProPodnikatelePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-blue-400/[0.07] blur-3xl" />
          <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full bg-sky-300/[0.06] blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 px-4 py-1.5 text-sm text-blue-700 dark:text-blue-300 mb-6">
                <Smartphone className="h-3.5 w-3.5" />
                Pro podnikatele a firmy
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground leading-tight">
                Účetnictví{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-600">
                  pod kontrolou.
                </span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
                Přestaňte řešit účetnictví přes email. Nahrajte doklad z mobilu,
                sledujte stav uzávěrek a komunikujte s účetním — vše na jednom místě.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="h-12 px-8 text-base font-semibold bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/auth/register">
                    Vyzkoušet zdarma
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                  <Link href="/#pricing">Zobrazit ceník</Link>
                </Button>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Bez platební karty. 30 dní plný přístup.
              </p>
            </div>

            {/* Lead form */}
            <div id="lead-form">
              <LeadCaptureForm source="pro-podnikatele" variant="client" />
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-16 border-y border-border/40 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {PAIN_POINTS.map((p) => (
              <div key={p.problem} className="text-center">
                <p className="text-sm text-red-500 dark:text-red-400 line-through mb-2">{p.problem}</p>
                <p className="text-base font-semibold text-foreground flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  {p.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Vše co potřebujete
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Jednoduchý portál pro spolupráci s vaším účetním.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border/50 bg-card p-6 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-soft-md transition-all duration-200"
              >
                <div className="mb-4 inline-flex rounded-xl bg-blue-100 dark:bg-blue-900/30 p-3">
                  <f.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Jak to funguje
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', icon: Upload, title: 'Nahrajte doklad', desc: 'Vyfoťte účtenku nebo nahrajte PDF. Stačí jedno kliknutí.' },
              { step: '2', icon: CheckCircle, title: 'AI vytěží data', desc: 'Umělá inteligence rozpozná dodavatele, částku, DPH i datum.' },
              { step: '3', icon: MessageSquare, title: 'Účetní zpracuje', desc: 'Váš účetní dostane hotová data. Vy máte přehled v reálném čase.' },
            ].map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < 2 && (
                  <div className="hidden sm:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-blue-300 to-blue-100 dark:from-blue-700 dark:to-blue-900" />
                )}
                <div className="relative inline-flex mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-950/20 flex items-center justify-center">
                    <s.icon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {s.step}
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
      <section className="py-20 sm:py-28 bg-gradient-to-br from-blue-600 to-sky-600 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-white max-w-2xl mx-auto">
            Začněte mít účetnictví pod kontrolou
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            Zaregistrujte se a získáte 30 dní plného přístupu zdarma.
          </p>
          <div className="mt-10">
            <Button size="lg" className="h-12 px-8 text-base font-semibold bg-white text-blue-700 hover:bg-white/90" asChild>
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
