import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { LeadCaptureForm } from '@/components/landing/lead-capture-form'
import {
  LayoutDashboard, Users, Clock, Calculator, Shield, BarChart3,
  Zap, TrendingUp, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Pojistná Pomoc pro účetní — Spravujte desítky firem bez stresu',
  description:
    'Digitální platforma pro účetní kanceláře. Master dashboard, time tracking, DPH matice, automatické uzávěrky. Začněte zdarma.',
  openGraph: {
    title: 'Pojistná Pomoc pro účetní',
    description: 'Spravujte desítky firem bez stresu. AI automatizace, přehledy, komunikace s klienty.',
    type: 'website',
  },
}

const BENEFITS = [
  { icon: LayoutDashboard, title: 'Master Dashboard', desc: 'Všichni klienti na jedné obrazovce. Barevná matice uzávěrek — okamžitě vidíte, co chybí.' },
  { icon: Users, title: 'Klientský portál', desc: 'Klienti nahrávají doklady sami. Méně emailů, méně telefonátů, méně stresu.' },
  { icon: Clock, title: 'Time tracking + fakturace', desc: 'Sledujte čas u klientů, automaticky generujte faktury. Žádné ruční počítání.' },
  { icon: Calculator, title: 'DPH a daňové matice', desc: 'Kontrola plateb, DPH přehledy, daň z příjmů — vše v přehledných maticích.' },
  { icon: Shield, title: 'AI vytěžování dokladů', desc: 'Umělá inteligence přečte doklad za 5 sekund. Vy jen zkontrolujete a schválíte.' },
  { icon: BarChart3, title: 'Hodnocení klientů', desc: 'Automatické hodnocení spolupráce. Víte, kdo potřebuje pozornost.' },
]

const STATS = [
  { value: '70%', label: 'méně emailů s klienty' },
  { value: '< 5s', label: 'AI vytěžení dokladu' },
  { value: '100+', label: 'firem na jednom dashboardu' },
  { value: '30 dní', label: 'zdarma na vyzkoušení' },
]

const TESTIMONIALS = [
  { name: 'Jana K.', role: 'Účetní, 45 klientů', text: 'Konečně vidím na dashboardu, kdo mi co dluží. Ušetřila jsem hodiny týdně.' },
  { name: 'Tomáš M.', role: 'Účetní kancelář, 80 klientů', text: 'Klienti nahrávají doklady sami — nemusím řešit emaily s přílohami.' },
  { name: 'Eva R.', role: 'OSVČ účetní, 20 klientů', text: 'AI vytěžování je skvělé. Doklady mám zpracované za zlomek času.' },
]

export default function ProUcetniPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-purple-400/[0.07] blur-3xl" />
          <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full bg-violet-300/[0.06] blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-950/30 px-4 py-1.5 text-sm text-purple-700 dark:text-purple-300 mb-6">
                <Zap className="h-3.5 w-3.5" />
                Pro účetní kanceláře
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground leading-tight">
                Spravujte desítky firem{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600">
                  bez stresu.
                </span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
                Přestaňte lovit doklady po emailech. Nechte klienty nahrávat přímo do systému.
                Vy se soustřeďte na to, co umíte — účetnictví.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="h-12 px-8 text-base font-semibold" asChild>
                  <a href="#lead-form">
                    Vyzkoušet zdarma
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
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
              <LeadCaptureForm source="pro-ucetni" variant="accountant" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold font-display text-purple-600 dark:text-purple-400">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Proč účetní volí Pojistná Pomoc
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Nástroje navržené účetními, pro účetní. Žádné zbytečné funkce.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="group rounded-2xl border border-border/50 bg-card p-6 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-soft-md transition-all duration-200"
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
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Začněte za 3 minuty
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Zaregistrujte se', desc: 'Vyplňte formulář a získáte 30 dní plného přístupu zdarma.' },
              { step: '2', title: 'Přidejte klienty', desc: 'Importujte firmy a rozešlete pozvánky klientům do jejich portálu.' },
              { step: '3', title: 'Pracujte efektivněji', desc: 'Klienti nahrávají doklady, vy zpracováváte. Vše na jednom místě.' },
            ].map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < 2 && (
                  <div className="hidden sm:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-purple-300 to-purple-100 dark:from-purple-700 dark:to-purple-900" />
                )}
                <div className="relative inline-flex mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-950/20 flex items-center justify-center">
                    <TrendingUp className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
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

      {/* Testimonials */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              Co říkají účetní
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border/50 bg-card p-6">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-purple-600 to-violet-600 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-white max-w-2xl mx-auto">
            Připraveni na účetnictví bez stresu?
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            Založte si účet zdarma. 30 dní plný přístup, bez platební karty.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Button size="lg" className="h-12 px-8 text-base font-semibold bg-white text-purple-700 hover:bg-white/90" asChild>
              <a href="#lead-form">
                Nezávazná konzultace
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base text-white border-white/40 hover:bg-white/10" asChild>
              <Link href="/auth/register">
                Registrovat se
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
