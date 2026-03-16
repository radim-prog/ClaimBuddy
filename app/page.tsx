import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { Stats } from '@/components/landing/stats'
import { Features } from '@/components/landing/features'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Testimonials } from '@/components/landing/testimonials'
import { PricingSection } from '@/components/landing/pricing-section'
import { FAQ } from '@/components/landing/faq'
import { CTASection } from '@/components/landing/cta-section'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Účetní OS — Účetnictví pod kontrolou pro klienty i účetní',
  description:
    'Nahrávejte doklady, sledujte uzávěrky, komunikujte s účetním. Účetní spravují desítky firem s automatizací a přehledy. Začněte zdarma.',
  openGraph: {
    title: 'Účetní OS — Účetnictví pod kontrolou',
    description: 'Moderní platforma pro spolupráci účetních a jejich klientů. Začněte zdarma.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <PricingSection />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  )
}
