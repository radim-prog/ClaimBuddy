import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

const FOOTER_COLS = [
  {
    heading: 'Produkt',
    links: [
      { href: '#features', label: 'Funkce' },
      { href: '/pricing', label: 'Ceník' },
      { href: '/accountant/marketplace', label: 'Marketplace' },
      { href: '#faq', label: 'FAQ' },
      { href: '/auth/register', label: 'Začít zdarma' },
    ],
  },
  {
    heading: 'Řešení',
    links: [
      { href: '/pro-ucetni', label: 'Pro účetní firmy' },
      { href: '/pro-podnikatele', label: 'Pro podnikatele' },
      { href: '/claims', label: 'Pojistné události' },
      { href: '/pricing', label: 'Tarify a limity' },
    ],
  },
  {
    heading: 'Podpora',
    links: [
      { href: '/auth/login', label: 'Přihlásit se' },
      { href: '/auth/register', label: 'Registrace' },
      { href: 'mailto:podpora@zajcon.cz', label: 'Kontakt' },
      { href: 'mailto:fakturace@zajcon.cz', label: 'Fakturace' },
    ],
  },
  {
    heading: 'Společnost',
    links: [
      { href: 'https://app.zajcon.cz', label: 'Aplikace' },
      { href: '/legal/terms', label: 'Obchodní podmínky' },
      { href: '/legal/privacy', label: 'Ochrana osobních údajů' },
      { href: '/legal/cookies', label: 'Cookies' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="container mx-auto px-6 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand — wider col */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" variant="white" />
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
              Moderní platforma pro spolupráci účetních a jejich klientů. Bezpečně, přehledně, bez papírování.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="mailto:info@zajcon.cz"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                info@zajcon.cz
              </a>
            </div>
          </div>

          {/* 4 link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold text-white mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith('http') || link.href.startsWith('mailto') ? (
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                        {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
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

        {/* Divider */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 order-2 sm:order-1">
            &copy; {new Date().getFullYear()} Účetní OS s.r.o. Všechna práva vyhrazena.
          </p>
          <div className="flex items-center gap-4 order-1 sm:order-2">
            <Link href="/legal/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Podmínky
            </Link>
            <Link href="/legal/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Soukromí
            </Link>
            <Link href="/legal/cookies" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
