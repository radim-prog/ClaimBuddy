import { Upload, Cpu, CheckCircle, TrendingUp } from 'lucide-react'

const STEPS = [
  {
    icon: Upload,
    step: '01',
    title: 'Klient nahraje doklady',
    desc: 'Fotkou, emailem nebo přes sběrný inbox. Doklady se automaticky roztřídí ke správné firmě.',
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Cpu,
    step: '02',
    title: 'AI vytěží a napáruje',
    desc: 'Trojkrokový AI pipeline rozpozná data z dokladu. Systém je napáruje na bankovní transakce.',
    accent: 'from-purple-500 to-violet-500',
  },
  {
    icon: CheckCircle,
    step: '03',
    title: 'Účetní zkontroluje a uzavře',
    desc: 'Účetní vidí co chybí, urguje klienta automaticky. Měsíční uzávěrka na pár kliknutí.',
    accent: 'from-emerald-500 to-green-500',
  },
  {
    icon: TrendingUp,
    step: '04',
    title: 'Klient vidí svou daň průběžně',
    desc: 'Žádné překvapení v březnu. Klient sleduje odhadovanou daň měsíc po měsíci v reálném čase.',
    accent: 'from-amber-500 to-orange-500',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/[0.02] to-background dark:via-purple-950/10" />

      <div className="container relative mx-auto px-4">
        <div className="text-center mb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-500 mb-3">
            Jak to funguje
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            Od dokladu k uzávěrce.{' '}
            <span className="text-muted-foreground">Automaticky.</span>
          </h2>
        </div>

        <div className="max-w-5xl mx-auto">
          {STEPS.map((s, i) => (
            <div
              key={s.step}
              className={`flex items-start gap-6 sm:gap-10 mb-16 last:mb-0 ${
                i % 2 === 1 ? 'sm:flex-row-reverse sm:text-right' : ''
              }`}
            >
              {/* Number + icon */}
              <div className="flex-shrink-0">
                <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${s.accent} p-[2px]`}>
                  <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                    <s.icon className="h-8 w-8 sm:h-10 sm:w-10 text-foreground" />
                  </div>
                  <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-foreground text-background text-xs font-black flex items-center justify-center">
                    {s.step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block w-px h-16 mx-auto bg-gradient-to-b from-border to-transparent" />
                )}
              </div>

              {/* Text */}
              <div className="pt-2 sm:pt-4">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  {s.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed max-w-md">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
