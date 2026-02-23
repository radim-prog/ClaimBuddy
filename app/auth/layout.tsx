import { Calculator, FileText, Users, TrendingUp, Shield, Clock } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-gray-950">
        {children}
      </div>

      {/* Right: Brand panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="mb-8">
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">
            Workflow pro účetní kancelář
          </h2>
          <p className="text-purple-200 text-lg leading-relaxed">
            120 firem na jedné obrazovce. Víte přesně, co chybí, kdo nereaguje a co hoří.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 my-8">
          {[
            { icon: Calculator, label: 'Master Matrix', desc: '12 měsíců × N firem' },
            { icon: Shield, label: 'Attention systém', desc: 'Co hoří, kdo nereaguje' },
            { icon: Clock, label: 'GTD úkoly', desc: 'Inbox → zpracováno' },
            { icon: FileText, label: 'Dokumenty', desc: 'Upload, OCR, archiv' },
            { icon: Users, label: 'Klientský portál', desc: 'Samoobsluha klientů' },
            { icon: TrendingUp, label: 'Reporty', desc: 'Přehledy a statistiky' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <item.icon className="h-5 w-5 text-purple-300 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-sm">{item.label}</div>
                <div className="text-purple-300 text-xs">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-purple-300 text-sm">
          app.zajcon.cz
        </p>
      </div>
    </div>
  )
}
