'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calculator, FileSignature } from 'lucide-react'
import { useCompany } from '../layout'
import { OsvcTaxWorkspace } from '@/components/taxes/osvc-tax-workspace'
import { SroTaxWorkspace } from '@/components/taxes/sro-tax-workspace'
import { QuestionnaireViewer } from '@/components/taxes/questionnaire-viewer'
import type { TaxRates } from '@/lib/tax-calculator'
import type { TaxAnnualConfigRow } from '@/lib/types/tax'

export default function TaxesPage() {
  const { company, companyId, employees } = useCompany()
  const [year, setYear] = useState(new Date().getFullYear())
  const [rates, setRates] = useState<TaxRates | null>(null)
  const [config, setConfig] = useState<Partial<TaxAnnualConfigRow> | null>(null)
  const [yearTotals, setYearTotals] = useState({ revenue: 0, expenses: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/accountant/tax-annual?company_id=${companyId}&year=${year}`)
        if (res.ok) {
          const data = await res.json()
          setConfig(data.config || {})
          setYearTotals(data.yearTotals || { revenue: 0, expenses: 0 })
          setRates(data.rates || null)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [companyId, year])

  const isFO = company.legal_form === 'OSVČ'
  const basePath = `/accountant/clients/${companyId}`

  return (
    <div className="space-y-4">
      {/* Sub-navigation: Daně / Dohodáři */}
      <div className="flex items-center gap-1 border-b border-border pb-2">
        <Link
          href={`${basePath}/taxes`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
        >
          <Calculator className="h-3.5 w-3.5" />
          Daně
        </Link>
        <Link
          href={`${basePath}/dohodari`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <FileSignature className="h-3.5 w-3.5" />
          Dohodáři
        </Link>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setYear(y => y - 1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-lg font-semibold font-display min-w-[60px] text-center">{year}</span>
        <button
          onClick={() => setYear(y => y + 1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Tax questionnaire */}
      <QuestionnaireViewer companyId={companyId} year={year} />

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      ) : isFO ? (
        <OsvcTaxWorkspace
          companyId={companyId}
          year={year}
          config={config || {}}
          yearTotals={yearTotals}
          rates={rates}
          onConfigUpdate={setConfig}
        />
      ) : (
        <SroTaxWorkspace
          companyId={companyId}
          company={company}
          year={year}
          config={config || {}}
          yearTotals={yearTotals}
          rates={rates}
          employees={employees}
          onConfigUpdate={setConfig}
        />
      )}
    </div>
  )
}
