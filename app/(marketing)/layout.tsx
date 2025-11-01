import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">ClaimBuddy</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            <Link href="/pricing" className="text-sm font-medium transition-colors hover:text-primary">
              Ceník
            </Link>
            <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
              O nás
            </Link>
            <Link href="/faq" className="text-sm font-medium transition-colors hover:text-primary">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Přihlásit se</Button>
            </Link>
            <Link href="/register">
              <Button>Začít zdarma</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-semibold">ClaimBuddy</h3>
              <p className="text-sm text-muted-foreground">
                Profesionální asistence při pojistných událostech.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Produkt</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="hover:text-primary">Ceník</Link></li>
                <li><Link href="/about" className="hover:text-primary">O nás</Link></li>
                <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Právní</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/legal/terms" className="hover:text-primary">Obchodní podmínky</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-primary">Ochrana soukromí</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-primary">Cookies</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Kontakt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>info@claimbuddy.cz</li>
                <li>+420 XXX XXX XXX</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            © 2025 ClaimBuddy s.r.o. Všechna práva vyhrazena.
          </div>
        </div>
      </footer>
    </div>
  );
}
