import type { Metadata } from 'next'
import StripeLanding from '@/components/landing/stripe-landing'

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
  return <StripeLanding />
}
