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
      {/* Hero → Stats: extra spacing as requested */}
      <div className="h-24 sm:h-40" />
      <Stats />
      {/* Stats → Features: light to dark */}
      <div className="h-20 sm:h-32 bg-gradient-to-b from-background to-gray-50 dark:to-gray-950" />
      <Features />
      {/* Features → HowItWorks: dark to light */}
      <div className="h-20 sm:h-32 bg-gradient-to-b from-gray-50 dark:from-gray-950 to-background" />
      <HowItWorks />
      <Testimonials />
      {/* Testimonials → Pricing: subtle transition */}
      <div className="h-12 sm:h-20 bg-gradient-to-b from-background to-muted/30" />
      <PricingSection />
      {/* Pricing → FAQ: muted to dark */}
      <div className="h-16 sm:h-24 bg-gradient-to-b from-muted/30 via-gray-100 dark:via-gray-800/50 to-gray-100 dark:to-gray-800" />
      <FAQ />
      {/* FAQ → CTA: dark to light */}
      <div className="h-16 sm:h-24 bg-gradient-to-b from-gray-100 dark:from-gray-900 to-background" />
      <CTASection />
      <Footer />
    </div>
  )
}
