import type { Metadata } from 'next'
import Link from 'next/link'
import { ClaimsNavbar } from '@/components/claims/claims-navbar'
import { ClaimsFooter } from '@/components/claims/claims-footer'

export const metadata: Metadata = {
  title: 'Ceník — připravujeme | Pojistná Pomoc',
  description: 'V této fázi je Pojistná Pomoc zdarma. Ceník zveřejníme později.',
}

// MVP 11.5.2026: tier UI schované, placení vypnuté (STRIPE_DISABLED).
// Plný ceník + úrovně služeb vrátíme po dokončení pilotního provozu.
export default function ClaimsPricingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClaimsNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="text-3xl font-semibold">Ceník zatím nezveřejňujeme</h1>
          <p className="text-muted-foreground">
            Pojistná Pomoc je v této fázi zdarma — soustředíme se na ověření,
            že platforma reálně pomáhá s pojistnými událostmi.
            Cenovou nabídku zveřejníme až po dokončení pilotního provozu.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/claims"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Zpět na úvod
            </Link>
            <Link
              href="/claims/new"
              className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              Nahlásit pojistnou událost
            </Link>
          </div>
        </div>
      </main>
      <ClaimsFooter />
    </div>
  )
}
