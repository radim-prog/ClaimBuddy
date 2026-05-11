import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Ceník — připravujeme',
  description: 'V této fázi je ClaimBuddy zdarma. Ceník zveřejníme později.',
}

// MVP 11.5.2026: pricing schovaný, placení vypnuté přes STRIPE_DISABLED flag.
// Plný ceník + checkout vrátíme po MVP ověření.
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="text-3xl font-semibold">Ceník zatím nezveřejňujeme</h1>
          <p className="text-muted-foreground">
            ClaimBuddy je v této fázi zdarma — soustředíme se na ověření, že platforma reálně pomáhá s pojistnými událostmi.
            Cenovou nabídku zveřejníme až po dokončení pilotního provozu.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Zpět na úvod
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
