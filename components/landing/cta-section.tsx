import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.3),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_70%)]" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="container relative mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Přestaňte řešit papíry.
          <br />
          <span className="text-purple-300">Začněte řídit účetnictví.</span>
        </h2>

        <p className="mt-6 text-lg text-purple-200/80 max-w-xl mx-auto">
          30 dní plný přístup zdarma. Žádná platební karta.
          Žádné závazky. Zrušíte kdykoliv.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 h-14 px-10 rounded-xl bg-white text-purple-900 font-bold text-lg hover:bg-purple-50 transition-all hover:scale-105 shadow-2xl shadow-purple-500/25"
          >
            Vyzkoušet zdarma
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/pro-ucetni"
            className="inline-flex items-center gap-2 h-14 px-10 rounded-xl border-2 border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-all"
          >
            Více o platformě
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-purple-300/70">
          <span>✓ Pro účetní firmy</span>
          <span className="w-1 h-1 rounded-full bg-purple-400/30" />
          <span>✓ Pro podnikatele</span>
          <span className="w-1 h-1 rounded-full bg-purple-400/30" />
          <span>✓ Pro pojistné události</span>
        </div>
      </div>
    </section>
  )
}
