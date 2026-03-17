import type { Metadata } from 'next'
import { ClaimsNavbar } from '@/components/claims/claims-navbar'
import { ClaimsFooter } from '@/components/claims/claims-footer'
import { ClaimIntakeForm } from './claim-intake-form'

export const metadata: Metadata = {
  title: 'Nahlásit pojistnou událost — Pojistná Pomoc',
  description:
    'Nahlaste pojistnou událost online. Jednoduché a rychlé hlášení škody — auto, majetek, život, odpovědnost, cestovní pojištění a další.',
}

export default function ClaimIntakePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <ClaimsNavbar />
      <main className="flex-1 pt-8 pb-16">
        <ClaimIntakeForm />
      </main>
      <ClaimsFooter />
    </div>
  )
}
