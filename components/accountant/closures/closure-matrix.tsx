'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const monthLabels = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']

interface MonthCell {
  status: string | null
  progress: number
  color: 'green' | 'yellow' | 'red' | 'gray'
  transaction_count: number
}

export interface MatrixCompany {
  company_id: string
  company_name: string
  months: Record<string, MonthCell>
}

interface ClosureMatrixProps {
  year: number
  companies: MatrixCompany[]
  selectedCompanyId?: string | null
  onSelectCompany?: (companyId: string, period: string) => void
  className?: string
}

const colorClasses: Record<string, string> = {
  green: 'bg-green-500 hover:bg-green-600 text-white',
  yellow: 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900',
  red: 'bg-red-500 hover:bg-red-600 text-white',
  gray: 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500',
}

export function ClosureMatrix({ year, companies, selectedCompanyId, onSelectCompany, className }: ClosureMatrixProps) {
  const router = useRouter()
  const periods = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)

  const handleCellClick = (companyId: string, period: string, color: string) => {
    if (color === 'gray') return
    if (onSelectCompany) {
      onSelectCompany(companyId, period)
    } else {
      router.push(`/accountant/clients/${companyId}/closures/${period}`)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Matice uzávěrek {year}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left py-1.5 px-2 font-medium text-muted-foreground sticky left-0 bg-background min-w-[140px]">
                Firma
              </th>
              {monthLabels.map((label, i) => (
                <th key={i} className="text-center py-1.5 px-1 font-medium text-muted-foreground w-10">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr
                key={company.company_id}
                className={cn(
                  'border-t border-border/50',
                  selectedCompanyId === company.company_id && 'bg-blue-50 dark:bg-blue-950/30'
                )}
              >
                <td className="py-1 px-2 font-medium truncate max-w-[180px] sticky left-0 bg-background">
                  {company.company_name}
                </td>
                {periods.map((period) => {
                  const cell = company.months[period]
                  if (!cell) {
                    return <td key={period} className="p-0.5"><div className="w-8 h-6 rounded bg-gray-100 dark:bg-gray-800" /></td>
                  }

                  return (
                    <td key={period} className="p-0.5">
                      <button
                        onClick={() => handleCellClick(company.company_id, period, cell.color)}
                        disabled={cell.color === 'gray'}
                        className={cn(
                          'w-8 h-6 rounded text-[10px] font-bold tabular-nums transition-colors flex items-center justify-center mx-auto',
                          colorClasses[cell.color],
                          cell.color !== 'gray' && 'cursor-pointer'
                        )}
                        title={`${company.company_name} – ${period}: ${cell.progress}% (${cell.transaction_count} tx)`}
                      >
                        {cell.color !== 'gray' ? cell.progress : ''}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {companies.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Žádné aktivní firmy</p>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" /> Schváleno
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-400" /> 100% spárováno
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" /> Rozpracováno
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" /> Bez dat
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
