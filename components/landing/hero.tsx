import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-purple-400/[0.07] blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full bg-blue-300/[0.06] blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-950/30 px-4 py-1.5 text-sm text-purple-700 dark:text-purple-300 mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          30 dní zdarma na vyzkoušení
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          Účetnictvi pod kontrolou.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            Pro klienty i účetní.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Nahrávejte doklady, sledujte uzávěrky, komunikujte s účetním — vše na jednom místě.
          Účetní spravují desítky firem bez stresu s automatizací a přehledy.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="h-12 px-8 text-base font-semibold" asChild>
            <Link href="/auth/login">
              Začít zdarma
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
            <a href="#pricing">Zobrazit ceník</a>
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Bez platební karty. 30 dní plný přístup.
        </p>
      </div>
    </section>
  )
}
