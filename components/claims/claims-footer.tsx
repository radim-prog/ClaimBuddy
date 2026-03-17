import Link from 'next/link'
import { Shield } from 'lucide-react'

const FOOTER_COLS = [
  {
    heading: 'Služby',
    links: [
      { href: '/claims/new', label: 'Nahlásit událost' },
      { href: '#how-it-works', label: 'Jak to funguje' },
      { href: '/claims/pricing', label: 'Ceník' },
      { href: '#faq', label: 'FAQ' },
    ],
  },
  {
    heading: 'Kontakt',
    links: [
      { href: 'mailto:podpora@zajcon.cz', label: 'podpora@zajcon.cz' },
      { href: '/auth/login?portal=client', label: 'Přihlášení klienta' },
    ],
  },
  {
    heading: 'Právní',
    links: [
      { href: '/legal/terms', label: 'Obchodní podmínky' },
      { href: '/claims/legal/privacy', label: 'Ochrana osobních údajů' },
      { href: '/legal/cookies', label: 'Cookies' },
    ],
  },
]

export function ClaimsFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold tracking-tight text-white text-sm">
                Pojistná Pomoc
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
              Profesionální zpracování pojistných událostí. Komunikujeme s pojišťovnou za vás, vyřídíme dokumentaci a zajistíme maximální plnění.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold text-white mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith('mailto') ? (
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 order-2 sm:order-1">
            &copy; {new Date().getFullYear()} Zajcon s.r.o. Všechna práva vyhrazena.
          </p>
          <div className="flex items-center gap-4 order-1 sm:order-2">
            <Link href="/legal/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Podmínky
            </Link>
            <Link href="/claims/legal/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Soukromí
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
