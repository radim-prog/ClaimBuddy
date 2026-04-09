import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PRODUCT_BRAND, PRODUCT_PROJECT_NAME } from '@/lib/product-config'

export const metadata: Metadata = {
  title: `${PRODUCT_PROJECT_NAME} — ${PRODUCT_BRAND}`,
  description:
    'Samostatná claims aplikace pro hlášení, správu a zpracování pojistných událostí.',
  openGraph: {
    title: `${PRODUCT_PROJECT_NAME} — ${PRODUCT_BRAND}`,
    description: 'Samostatná claims aplikace pro hlášení a zpracování pojistných událostí.',
    type: 'website',
  },
}

export default function LandingPage() {
  redirect('/claims')
}
