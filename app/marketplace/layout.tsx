import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Marketplace účetních — Pojistná Pomoc',
  description:
    'Najděte svou účetní firmu. Katalog ověřených účetních s transparentními cenami, specializacemi a dostupností.',
  openGraph: {
    title: 'Marketplace účetních — Pojistná Pomoc',
    description: 'Najděte svou účetní firmu. Katalog ověřených účetních.',
    type: 'website',
  },
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
