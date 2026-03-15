import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="sm" variant="purple" />
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Moderní platforma pro spolupráci účetních a jejich klientů.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Produkt</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funkce</a></li>
              <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Ceník</Link></li>
              <li><a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Portály</h4>
            <ul className="space-y-2">
              <li><Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Klientský portál</Link></li>
              <li><Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Portál pro účetní</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Právní</h4>
            <ul className="space-y-2">
              <li><span className="text-sm text-muted-foreground">Obchodní podmínky</span></li>
              <li><span className="text-sm text-muted-foreground">Ochrana osobních údajů</span></li>
              <li><span className="text-sm text-muted-foreground">GDPR</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Účetní OS. Všechna práva vyhrazena.
          </p>
        </div>
      </div>
    </footer>
  )
}
