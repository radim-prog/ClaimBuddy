'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, X } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'

const monthNames = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
]

export function MissingDocsBar() {
  const router = useRouter()
  const { visibleCompanies, closures, loading } = useClientUser()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(sessionStorage.getItem('missing-docs-dismissed') === 'true')
    }
  }, [])

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  // Check previous month — current month is still in progress (yellow, not red)
  const prevDate = new Date(currentYear, currentMonth - 1, 1)
  const previousPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  const hasMissing = useMemo(() => {
    if (loading || visibleCompanies.length === 0) return false

    for (const company of visibleCompanies) {
      const closure = closures.find(
        (c) => c.company_id === company.id && c.period === previousPeriod,
      )
      if (!closure) return true
      if (
        closure.bank_statement_status === 'missing' ||
        closure.expense_documents_status === 'missing' ||
        closure.income_invoices_status === 'missing'
      ) {
        return true
      }
    }
    return false
  }, [visibleCompanies, closures, loading, previousPeriod])

  if (loading || !hasMissing || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('missing-docs-dismissed', 'true')
  }

  return (
    <div className="bg-red-500/85 text-white text-sm py-1.5 px-4 relative z-[90]">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/client/documents')}
          className="flex items-center gap-2 hover:underline"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            Chybí doklady za {monthNames[prevDate.getMonth()]} {prevDate.getFullYear()}
          </span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-0.5 rounded hover:bg-white/20 transition-colors flex-shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
