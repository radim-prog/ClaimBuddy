import type { Metadata } from 'next'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { ClaimIntakeForm } from './claim-intake-form'

export const metadata: Metadata = {
  title: 'Nahlásit pojistnou událost — Pojistná Pomoc',
  description:
    'Nahlaste pojistnou událost online. Jednoduché a rychlé hlášení škody — auto, majetek, život, odpovědnost, cestovní pojištění a další.',
}

export default function ClaimIntakePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-8 pb-16">
        <ClaimIntakeForm />
      </main>
      <Footer />
    </div>
  )
}
