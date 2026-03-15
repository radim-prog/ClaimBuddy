import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { PricingSection } from '@/components/landing/pricing-section'
import { FAQ } from '@/components/landing/faq'
import { CTASection } from '@/components/landing/cta-section'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Ceník — Účetní OS',
  description:
    'Transparentní ceník pro klienty i účetní. Začněte zdarma, rozšiřte podle potřeb. 30 dní plného přístupu bez platební karty.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-8">
        <PricingSection />
      </div>
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  )
}
