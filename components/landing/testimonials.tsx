'use client'

import { Quote } from 'lucide-react'

interface Testimonial {
  quote: string
  name: string
  position: string
  company: string
  clientCount: number
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Předtím jsme trávili hodiny kontrolou, jestli nám klienti poslali všechny podklady. Teď to vidíme v matici na jedno kliknutí. Ušetřili jsme minimálně 2 dny měsíčně.',
    name: 'Ing. Petra Dvořáková',
    position: 'Jednatelka',
    company: 'Dvořáková & partneři s.r.o.',
    clientCount: 85,
    initials: 'PD',
  },
  {
    quote: 'Konečně systém, který pochopí účetní praxi v Česku. DPH matice, uzávěrky, termíny — všechno na jednom místě. A klienti si nahrávají doklady sami, bez mailování.',
    name: 'Mgr. Tomáš Kratochvíl',
    position: 'Vedoucí účetního oddělení',
    company: 'EKO-ÚČTO Brno s.r.o.',
    clientCount: 120,
    initials: 'TK',
  },
  {
    quote: 'Přešli jsme z Excelu a papírových složek. Během měsíce jsme měli všechny klienty v systému. Automatické připomínky termínů nám zachránily nejeden pozdní podání.',
    name: 'Jana Marková',
    position: 'Samostatná účetní',
    company: 'Účetnictví Marková',
    clientCount: 32,
    initials: 'JM',
  },
]

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
            Co říkají naši uživatelé
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Účetní firmy po celém Česku šetří čas a zlepšují spolupráci s klienty.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="relative rounded-2xl border border-border/50 bg-card p-6 sm:p-8 flex flex-col"
            >
              {/* Quote icon */}
              <Quote className="h-8 w-8 text-purple-200 dark:text-purple-800 mb-4 flex-shrink-0" />

              {/* Quote text */}
              <blockquote className="text-sm sm:text-base text-foreground/90 leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                {/* Avatar placeholder */}
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                    {t.initials}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.position}, {t.company}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {t.clientCount} klientů
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
