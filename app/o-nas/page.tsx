import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Target, Heart, Zap, Shield,
  Mail, MapPin, Building2, Globe,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'O nás — ZajCon Solutions | Účetní OS',
  description:
    'ZajCon Solutions — český tým za platformou Účetní OS. Naše mise: digitalizovat spolupráci účetních a podnikatelů.',
  openGraph: {
    title: 'O nás — ZajCon Solutions',
    description: 'Český tým za platformou Účetní OS. Moderní účetnictví bez papírů.',
    type: 'website',
  },
}

const VALUES = [
  {
    icon: Target,
    title: 'Jednoduchost',
    description: 'Účetnictví je složité. Naše aplikace ne. Navrhujeme rozhraní tak, aby ho pochopil každý podnikatel i zkušený účetní.',
  },
  {
    icon: Heart,
    title: 'České prostředí',
    description: 'Stavíme pro český trh. DPH, daň z příjmů, EET, Pohoda export — rozumíme lokálním potřebám a zákonům.',
  },
  {
    icon: Zap,
    title: 'Automatizace',
    description: 'AI vytěžování dokladů, automatické připomínky termínů, předkontace — šetříme hodiny práce měsíčně.',
  },
  {
    icon: Shield,
    title: 'Bezpečnost',
    description: 'Data šifrovaná při přenosu i v klidu. Servery v EU. PBKDF2 hesla, HMAC-SHA256 autentizace. Plný soulad s GDPR.',
  },
]

const TEAM = [
  {
    name: 'Radim Zajíček',
    role: 'Zakladatel & CEO',
    description: 'Propojuje svět technologií a účetnictví. Vize: aby každý podnikatel měl přehled o financích na pár kliknutí.',
    initials: 'RZ',
  },
  {
    name: 'AI tým',
    role: 'Vývoj & Engineering',
    description: 'Moderní stack: Next.js, TypeScript, Supabase, Claude AI. Automatizace, která funguje.',
    initials: 'AI',
  },
  {
    name: 'Komunita účetních',
    role: 'Zpětná vazba & testování',
    description: 'Desítky účetních firem testují nové funkce a pomáhají formovat produkt podle reálných potřeb.',
    initials: 'KU',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-50/80 to-white dark:from-gray-900 dark:to-gray-950" />
          <div className="container relative mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-foreground">
              Tvoříme budoucnost<br />českého účetnictví
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ZajCon Solutions je česká technologická firma. Naší misí je zjednodušit
              spolupráci mezi účetními a jejich klienty pomocí moderních technologií a AI.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                Naše mise
              </h2>
            </div>
            <p className="text-center text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Účetní v Česku stráví desítky hodin měsíčně koordinací s klienty — emaily,
              telefonáty, chybějící podklady. My to chceme změnit. Účetní OS je platforma,
              kde klient nahraje doklad a účetní ho vidí okamžitě. Žádné papíry, žádný chaos.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground text-center mb-12">
              Naše hodnoty
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {VALUES.map((v) => (
                <div key={v.title} className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 mb-4">
                    <v.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground text-center mb-12">
              Kdo za tím stojí
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {TEAM.map((t) => (
                <div key={t.name} className="text-center p-6 rounded-2xl border border-border/50 bg-card">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                    <span className="text-lg font-bold text-purple-700 dark:text-purple-300">{t.initials}</span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{t.name}</h3>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">{t.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground text-center mb-10">
              Kontakt
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-card">
                <Building2 className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">ZajCon Solutions</p>
                  <p className="text-sm text-muted-foreground">IČO: bude doplněno</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-card">
                <Mail className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Email</p>
                  <p className="text-sm text-muted-foreground">info@ucetnios.cz</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-card">
                <MapPin className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Sídlo</p>
                  <p className="text-sm text-muted-foreground">Česká republika</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-card">
                <Globe className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Web</p>
                  <p className="text-sm text-muted-foreground">app.zajcon.cz</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mb-4">
              Připojte se k nám
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Začněte s Účetní OS zdarma a přesvědčte se sami.
            </p>
            <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100 font-semibold" asChild>
              <Link href="/auth/register">Vyzkoušet zdarma</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
