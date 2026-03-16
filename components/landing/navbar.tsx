'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { Menu, X, ChevronDown, ScanLine, Grid3x3, Car, Users, AlertTriangle, PenTool } from 'lucide-react'

const NAV_LINKS = [
  { href: '/pro-ucetni', label: 'Pro účetní' },
  { href: '/pro-podnikatele', label: 'Pro podnikatele' },
  // 'Funkce' handled separately as dropdown
  { href: '/pricing', label: 'Ceník' },
  { href: '/accountant/marketplace', label: 'Marketplace' },
]

const FEATURE_LINKS = [
  { href: '/funkce/vytezovani', label: 'AI Vytěžování dokladů', icon: ScanLine },
  { href: '/funkce/uzaverky', label: 'Měsíční uzávěrky', icon: Grid3x3 },
  { href: '/funkce/cestovni-denik', label: 'Cestovní deník', icon: Car },
  { href: '/funkce/marketplace', label: 'Marketplace účetních', icon: Users },
  { href: '/funkce/krizove-rizeni', label: 'Krizové řízení', icon: AlertTriangle },
  { href: '/funkce/podpisovani', label: 'Elektronické podepisování', icon: PenTool },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-sm border-b border-gray-100 dark:border-gray-800'
          : 'bg-transparent backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto flex h-18 items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo size="md" variant="purple" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.slice(0, 2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-gray-800/70 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Funkce dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setFeaturesOpen(true)}
            onMouseLeave={() => setFeaturesOpen(false)}
          >
            <button
              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-gray-800/70 rounded-lg transition-colors flex items-center gap-1"
            >
              Funkce
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>
            {featuresOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 z-50">
                {FEATURE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setFeaturesOpen(false)}
                  >
                    <link.icon className="h-4 w-4 text-purple-500" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {NAV_LINKS.slice(2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-gray-800/70 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-sm font-medium" asChild>
            <Link href="/auth/login">Přihlášení</Link>
          </Button>
          <Button
            size="sm"
            className="text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200 dark:shadow-purple-900/30 px-4"
            asChild
          >
            <Link href="/auth/register">Začít zdarma</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Zavřít menu' : 'Otevřít menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-4 space-y-1">
          {NAV_LINKS.slice(0, 2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center py-2.5 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Funkce expandable section */}
          <div>
            <button
              className="flex items-center justify-between w-full py-2.5 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
            >
              <span>Funkce</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileFeaturesOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileFeaturesOpen && (
              <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-purple-200 dark:border-purple-800 pl-3">
                {FEATURE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 py-2 px-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => { setMobileOpen(false); setMobileFeaturesOpen(false) }}
                  >
                    <link.icon className="h-4 w-4 text-purple-500" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {NAV_LINKS.slice(2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center py-2.5 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/auth/login">Přihlášení</Link>
            </Button>
            <Button
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              asChild
            >
              <Link href="/auth/register">Začít zdarma</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
