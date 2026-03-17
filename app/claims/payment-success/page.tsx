'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ClaimsNavbar } from '@/components/claims/claims-navbar'
import { ClaimsFooter } from '@/components/claims/claims-footer'
import { CheckCircle2, Loader2, Clock, ArrowRight } from 'lucide-react'

function PaymentSuccessInner() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const caseId = searchParams.get('case_id')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simple verification — the webhook handles the actual payment confirmation
    if (sessionId) {
      setVerified(true)
    }
    setLoading(false)
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-full max-w-md">
        <div className="h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {verified ? 'Platba přijata' : 'Děkujeme za objednávku'}
        </h1>

        <p className="text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
          Vaše platba byla úspěšně zpracována. Odborný poradce vám bude přidělen do 24 hodin.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-3 text-left">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Co bude následovat?</p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                <li>1. Přidělíme vám odborného poradce</li>
                <li>2. Poradce vás bude kontaktovat</li>
                <li>3. Začneme řešit vaši pojistnou událost</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/auth/login?portal=client"
            className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            Přejít do klientského portálu
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
          <Link
            href="/claims"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Zpět na hlavní stránku
          </Link>
        </div>

        {caseId && (
          <p className="mt-6 text-xs text-gray-400">
            ID případu: {caseId}
          </p>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <ClaimsNavbar />
      <main className="flex-1 py-12">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          }
        >
          <PaymentSuccessInner />
        </Suspense>
      </main>
      <ClaimsFooter />
    </div>
  )
}
