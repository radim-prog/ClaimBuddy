import {
  FileText, PieChart, Bell, MessageSquare, Upload, Shield,
  Users, LayoutDashboard, Clock, Calculator, FolderOpen, BarChart3,
} from 'lucide-react'

const CLIENT_FEATURES = [
  { icon: Upload, title: 'Nahrávání dokladů', desc: 'Vyfotíte, nahrajete — AI vytěží data za vás.' },
  { icon: FileText, title: 'Faktury a pohledávky', desc: 'Tvorba, evidence, QR kódy pro platby.' },
  { icon: PieChart, title: 'Přehled financí', desc: 'DPH, daně a uzávěrky na jednom místě.' },
  { icon: MessageSquare, title: 'Komunikace', desc: 'Zprávy s účetním přímo v aplikaci.' },
  { icon: Bell, title: 'Upozornění', desc: 'Včas vás upozorníme na termíny.' },
  { icon: FolderOpen, title: 'Cestovní deník', desc: 'Evidence jízd, tankování, CSV export.' },
]

const ACCOUNTANT_FEATURES = [
  { icon: LayoutDashboard, title: 'Master Dashboard', desc: 'Přehled všech klientů na jednom místě.' },
  { icon: Users, title: 'Správa klientů', desc: 'Profily, dokumenty, vstupní dotazníky.' },
  { icon: Clock, title: 'Time Tracking', desc: 'Sledování času s automatickou fakturací.' },
  { icon: Calculator, title: 'DPH & Uzávěrky', desc: 'Matice kontrol, termíny, hromadné zpracování.' },
  { icon: Shield, title: 'Znalostní báze', desc: '30+ článků k DPH, dani, zákonům.' },
  { icon: BarChart3, title: 'Analytika', desc: 'Health score klientů, výkonnostní přehledy.' },
]

function FeatureCard({ icon: Icon, title, desc }: { icon: typeof FileText; title: string; desc: string }) {
  return (
    <div className="group relative rounded-2xl border border-border/50 bg-card p-6 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-soft-md transition-all duration-200">
      <div className="mb-4 inline-flex rounded-xl bg-purple-100 dark:bg-purple-900/30 p-3">
        <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
            Vše co potřebujete
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Dva portály, jeden systém. Klienti nahrávají — účetní zpracovávají.
          </p>
        </div>

        {/* Client features */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-blue-200 to-transparent dark:from-blue-800" />
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Klientský portál
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-blue-200 to-transparent dark:from-blue-800" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CLIENT_FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>

        {/* Accountant features */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-purple-200 to-transparent dark:from-purple-800" />
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Portál pro účetní
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-purple-200 to-transparent dark:from-purple-800" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACCOUNTANT_FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </div>
    </section>
  )
}
