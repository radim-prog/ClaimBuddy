'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PricingTable } from '@/components/pricing-table'
import {
  ArrowRight,
  BarChart3,
  Clock,
  FileText,
  Users,
  Calculator,
  Brain,
  Check,
} from 'lucide-react'

const BENEFITS = [
  {
    icon: FileText,
    title: 'Uzávěrky a DPH',
    description: 'Měsíční matice uzávěrek, přehled DPH za všechny klienty na jednom místě.',
  },
  {
    icon: Brain,
    title: 'AI vytěžování dokumentů',
    description: 'Automatické rozpoznání faktur a dokladů. Ušetřete hodiny ručního přepisování.',
  },
  {
    icon: Clock,
    title: 'Time tracking',
    description: 'Sledování odpracovaného času, kapacity týmu a automatický výpočet výplat.',
  },
  {
    icon: BarChart3,
    title: 'Analytika a přehledy',
    description: 'Revenue tracking, náklady, zdraví klientů — vše přehledně na jednom dashboardu.',
  },
  {
    icon: Calculator,
    title: 'Daňové přehledy',
    description: 'DPH matice, daň z příjmu, DPFO kalkulátor s odpočty a slevami.',
  },
  {
    icon: Users,
    title: 'Klientský portál',
    description: 'Každý klient má vlastní přístup — dokumenty, zprávy, faktury.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'Konečně mám přehled o všech klientech na jednom místě. Uzávěrky, DPH, platby — vše vidím v matici.',
    author: 'Ing. Petra Nováková',
    role: 'Účetní kancelář, 45 klientů',
  },
  {
    quote: 'AI vytěžování nám šetří 2 hodiny denně. Faktura přijde, systém ji přečte a navrhne zaúčtování.',
    author: 'Jan Dvořák',
    role: 'Daňový poradce, 80 klientů',
  },
  {
    quote: 'Klienti si sami nahrávají doklady a vidí stav svých uzávěrek. Méně telefonátů, více práce.',
    author: 'Marie Svobodová',
    role: 'OSVČ účetní, 20 klientů',
  },
]

const FAQ = [
  {
    q: 'Co je zahrnuto ve 30denním trialu?',
    a: 'Plný přístup k tarifu Profi — uzávěrky, DPH, daňové přehledy, skupiny klientů, projekty, analytika a vše ostatní. Po 30 dnech přejdete na Základ nebo si vyberete tarif.',
  },
  {
    q: 'Mohu kdykoliv zrušit předplatné?',
    a: 'Ano, předplatné můžete zrušit kdykoliv. Vaše data zůstanou přístupná (read-only), nic se nemaže.',
  },
  {
    q: 'Jak funguje AI vytěžování?',
    a: 'Nahrajete PDF nebo fotku dokladu, AI ho přečte a navrhne zaúčtování podle českých účetních standardů. Stačí potvrdit nebo upravit.',
  },
  {
    q: 'Potřebuji Pohodu nebo jiný účetní program?',
    a: 'Účetní OS není náhrada Pohody — je to operační systém pro řízení účetní kanceláře. Data můžete exportovat do XML pro Pohodu.',
  },
  {
    q: 'Kolik firem mohu spravovat na Free tarifu?',
    a: 'Tarif Základ umožňuje až 10 firem s 1 uživatelem. Dostanete seznam klientů, evidenci času, kontrolu plateb, termíny a základní komunikaci.',
  },
]

export default function PricingPage() {
  function handleSelectPlan(planId: string): void {
    const params = planId === 'free' ? '' : `?plan=${planId}`
    window.location.href = `/auth/register${params}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold font-display text-gray-900 dark:text-white">
              Účetní OS
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Přihlásit se</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                Vyzkoušet zdarma
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 sm:py-24 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200">
            30 dní Profi zdarma
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-gray-900 dark:text-white mb-4 leading-tight">
            Účetní operační systém
            <br />
            <span className="text-purple-600">pro moderní kanceláře</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Spravujte klienty, uzávěrky, DPH, fakturace a dokumenty na jednom místě.
            AI vytěží vaše doklady. Klienti mají vlastní portál.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/auth/register">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                Začít zdarma
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Zobrazit tarify
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-center text-gray-900 dark:text-white mb-12">
            Vše co potřebujete pro řízení účetní kanceláře
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b) => {
              const Icon = b.icon
              return (
                <Card key={b.title} className="border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{b.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{b.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-center text-gray-900 dark:text-white mb-4">
            Jednoduchý a transparentní ceník
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-xl mx-auto">
            Začněte zdarma, upgradujte až budete potřebovat. Žádné skryté poplatky.
          </p>
          <PricingTable
            onSelectPlan={handleSelectPlan}
            ctaLabel="Začít zdarma"
          />
        </div>
      </section>

      {/* Comparison with competitors */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-center text-gray-900 dark:text-white mb-4">
            Proč Účetní OS?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Nejsme fakturační nástroj. Jsme operační systém pro celou účetní kancelář.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-400 mb-4 text-sm uppercase tracking-wider">Běžné fakturační nástroje</h3>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2"><span className="w-5 text-center">-</span> Fakturace a kontakty</li>
                  <li className="flex items-center gap-2"><span className="w-5 text-center">-</span> Základní přehledy</li>
                  <li className="flex items-center gap-2"><span className="w-5 text-center">-</span> Export do PDF</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-purple-600 mb-4 text-sm uppercase tracking-wider">Účetní OS</h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Uzávěrky, DPH, daň z příjmu</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> AI vytěžování dokladů</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Klientský portál</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Time tracking a kapacity</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Case management</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Health Score klientů</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-center text-gray-900 dark:text-white mb-12">
            Co říkají účetní
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-gray-600 dark:text-gray-300 mb-4 italic text-sm leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.author}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-center text-gray-900 dark:text-white mb-12">
            Časté otázky
          </h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-gray-900 dark:text-white mb-4">
            Začněte spravovat klienty efektivněji
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            30 dní Profi zdarma. Žádná kreditní karta. Zrušení kdykoliv.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
              Vyzkoušet zdarma
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calculator className="h-4 w-4" />
            Účetní OS &copy; {new Date().getFullYear()}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/auth/login" className="hover:text-gray-700 dark:hover:text-gray-300">Přihlásit se</Link>
            <Link href="/auth/register" className="hover:text-gray-700 dark:hover:text-gray-300">Registrace</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
