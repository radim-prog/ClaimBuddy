'use client'

import { ClaimIntakeForm } from '@/app/claims/new/claim-intake-form'

export default function ClientClaimNewPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
          Nahlásit pojistnou událost
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Vyplňte formulář pro nahlášení nové pojistné události
        </p>
      </div>
      <ClaimIntakeForm />
    </div>
  )
}
