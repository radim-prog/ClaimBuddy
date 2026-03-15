import { Upload, Cpu, CheckCircle } from 'lucide-react'

const STEPS = [
  {
    icon: Upload,
    step: '1',
    title: 'Nahrajte doklad',
    desc: 'Vyfoťte účtenku nebo nahrajte PDF. Stačí jedno kliknutí.',
  },
  {
    icon: Cpu,
    step: '2',
    title: 'AI vytěží data',
    desc: 'Umělá inteligence rozpozná dodavatele, částku, DPH i datum.',
  },
  {
    icon: CheckCircle,
    step: '3',
    title: 'Účetní zpracuje',
    desc: 'Váš účetní dostane hotová data. Vy máte přehled v reálném čase.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
            Jak to funguje
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Tři jednoduché kroky k účetnictví bez starostí.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative text-center group">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-purple-300 to-purple-100 dark:from-purple-700 dark:to-purple-900" />
              )}

              <div className="relative inline-flex mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-950/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <s.icon className="h-10 w-10 text-purple-600 dark:text-purple-400" />
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
  )
}
