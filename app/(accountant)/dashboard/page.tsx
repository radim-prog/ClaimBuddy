'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type StatusType = 'missing' | 'uploaded' | 'approved'

type Company = {
  id: string
  name: string
  ico: string
}

type MonthlyClosure = {
  id: string
  company_id: string
  period: string
  status: string
  bank_statement_status: StatusType
  expense_invoices_status: StatusType
  receipts_status: StatusType
  income_invoices_status: StatusType
}

type MatrixData = {
  companies: Company[]
  closures: MonthlyClosure[]
  stats: {
    total: number
    missing: number
    uploaded: number
    approved: number
  }
}

const months = [
  'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer',
  'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'
]

// Status color mapping
const statusColors: Record<StatusType, { bg: string; text: string; border: string }> = {
  missing: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300'
  },
  uploaded: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300'
  },
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300'
  }
}

function getMonthStatus(closures: MonthlyClosure[], companyId: string, monthIndex: number): StatusType {
  const period = `2025-${String(monthIndex + 1).padStart(2, '0')}`
  const closure = closures.find(
    c => c.company_id === companyId && c.period === period
  )

  if (!closure) return 'missing'

  // Všechny 4 kategorie musí být approved pro celkový status approved
  const allApproved =
    closure.bank_statement_status === 'approved' &&
    closure.expense_invoices_status === 'approved' &&
    closure.receipts_status === 'approved' &&
    closure.income_invoices_status === 'approved'

  if (allApproved) return 'approved'

  // Pokud alespoň jedna kategorie je uploaded
  const anyUploaded =
    closure.bank_statement_status === 'uploaded' ||
    closure.expense_invoices_status === 'uploaded' ||
    closure.receipts_status === 'uploaded' ||
    closure.income_invoices_status === 'uploaded'

  if (anyUploaded) return 'uploaded'

  return 'missing'
}

function StatusCell({
  companyId,
  companyName,
  monthIndex,
  closures
}: {
  companyId: string
  companyName: string
  monthIndex: number
  closures: MonthlyClosure[]
}) {
  const status = getMonthStatus(closures, companyId, monthIndex)
  const colors = statusColors[status]
  const period = `2025-${String(monthIndex + 1).padStart(2, '0')}`

  const closure = closures.find(
    c => c.company_id === companyId && c.period === period
  )

  const tooltipContent = closure ? `
    ${companyName} - ${months[monthIndex]} 2025

    Výpis z banky: ${closure.bank_statement_status === 'approved' ? '✓' : closure.bank_statement_status === 'uploaded' ? '⏳' : '✗'}
    Výdaje: ${closure.expense_invoices_status === 'approved' ? '✓' : closure.expense_invoices_status === 'uploaded' ? '⏳' : '✗'}
    Příjmy: ${closure.income_invoices_status === 'approved' ? '✓' : closure.income_invoices_status === 'uploaded' ? '⏳' : '✗'}
    Účtenky: ${closure.receipts_status === 'approved' ? '✓' : closure.receipts_status === 'uploaded' ? '⏳' : '✗'}
  ` : `${companyName} - ${months[monthIndex]} 2025\n\nŽádné dokumenty`

  return (
    <td className="px-2 py-2 text-center">
      <Link href={`/accountant/clients/${companyId}`}>
        <div
          className={`
            w-12 h-12 mx-auto rounded-lg border-2 transition-all cursor-pointer
            ${colors.bg} ${colors.border}
            hover:scale-110 hover:shadow-lg
            flex items-center justify-center
            relative group
          `}
          title={tooltipContent}
        >
        <span className={`text-xs font-semibold ${colors.text}`}>
          {status === 'approved' ? '✓' : status === 'uploaded' ? '⏳' : '!'}
        </span>

        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-pre-line shadow-xl max-w-xs">
            <div className="font-bold mb-1">{companyName}</div>
            <div className="text-gray-300 mb-2">{months[monthIndex]} 2025</div>
            {closure && (
              <div className="space-y-1 text-left">
                <div className="flex items-center">
                  <span className={closure.bank_statement_status === 'approved' ? 'text-green-400' : closure.bank_statement_status === 'uploaded' ? 'text-yellow-400' : 'text-red-400'}>
                    {closure.bank_statement_status === 'approved' ? '✓' : closure.bank_statement_status === 'uploaded' ? '⏳' : '✗'}
                  </span>
                  <span className="ml-2">Výpis z banky</span>
                </div>
                <div className="flex items-center">
                  <span className={closure.expense_invoices_status === 'approved' ? 'text-green-400' : closure.expense_invoices_status === 'uploaded' ? 'text-yellow-400' : 'text-red-400'}>
                    {closure.expense_invoices_status === 'approved' ? '✓' : closure.expense_invoices_status === 'uploaded' ? '⏳' : '✗'}
                  </span>
                  <span className="ml-2">Výdajové faktury</span>
                </div>
                <div className="flex items-center">
                  <span className={closure.income_invoices_status === 'approved' ? 'text-green-400' : closure.income_invoices_status === 'uploaded' ? 'text-yellow-400' : 'text-red-400'}>
                    {closure.income_invoices_status === 'approved' ? '✓' : closure.income_invoices_status === 'uploaded' ? '⏳' : '✗'}
                  </span>
                  <span className="ml-2">Příjmové faktury</span>
                </div>
                <div className="flex items-center">
                  <span className={closure.receipts_status === 'approved' ? 'text-green-400' : closure.receipts_status === 'uploaded' ? 'text-yellow-400' : 'text-red-400'}>
                    {closure.receipts_status === 'approved' ? '✓' : closure.receipts_status === 'uploaded' ? '⏳' : '✗'}
                  </span>
                  <span className="ml-2">Účtenky</span>
                </div>
              </div>
            )}
          </div>
          <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1.5"></div>
        </div>
        </div>
      </Link>
    </td>
  )
}

export default function AccountantDashboard() {
  const [data, setData] = useState<MatrixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/accountant/matrix')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Načítám Master Matici...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Nepodařilo se načíst data: {error || 'Neznámá chyba'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { companies, closures, stats } = data

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Master Matice 2025</h1>
        <p className="mt-2 text-gray-600">
          Přehled všech klientů a stavu jejich měsíčních uzávěrek
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex items-center gap-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-100 border-2 border-red-300 flex items-center justify-center">
            <span className="text-xs text-red-700">!</span>
          </div>
          <span className="text-sm text-gray-700">Chybí dokumenty</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center">
            <span className="text-xs text-yellow-700">⏳</span>
          </div>
          <span className="text-sm text-gray-700">Nahrané, čeká na schválení</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-green-100 border-2 border-green-300 flex items-center justify-center">
            <span className="text-xs text-green-700">✓</span>
          </div>
          <span className="text-sm text-gray-700">Schváleno</span>
        </div>
      </div>

      {/* Master Matrix Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider sticky left-0 bg-gradient-to-r from-blue-600 to-purple-600 z-10">
                Klient
              </th>
              {months.map((month, index) => (
                <th key={index} className="px-2 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {companies.map((company, companyIndex) => (
              <tr key={company.id} className={companyIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10">
                  <div>
                    <div className="font-semibold">{company.name}</div>
                    <div className="text-xs text-gray-500">IČO: {company.ico}</div>
                  </div>
                </td>
                {months.map((_, monthIndex) => (
                  <StatusCell
                    key={monthIndex}
                    companyId={company.id}
                    companyName={company.name}
                    monthIndex={monthIndex}
                    closures={closures}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <span className="text-2xl text-red-600">!</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Chybějící dokumenty</p>
              <p className="text-2xl font-bold text-gray-900">{stats.missing}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <span className="text-2xl text-yellow-600">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Čeká na schválení</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uploaded}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-2xl text-green-600">✓</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Schváleno</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
