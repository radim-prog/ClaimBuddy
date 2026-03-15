import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-purple-600 to-blue-600 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-white max-w-2xl mx-auto">
          Připraveni na účetnictví bez stresu?
        </h2>
        <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
          Založte si účet zdarma a vyzkoušejte plný tarif na 30 dní. Bez platební karty.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="h-12 px-8 text-base font-semibold bg-white text-purple-700 hover:bg-white/90"
            asChild
          >
            <Link href="/auth/login">
              Začít zdarma
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base border-white/30 text-white hover:bg-white/10"
            asChild
          >
            <a href="#pricing">Zobrazit ceník</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
