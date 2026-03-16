'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Landmark, Loader2, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'

type TaxSummary = {
  total_revenue: number
  total_expenses: number
  profit: number
  vat_balance: number
}

type TaxPeriod = {
  period: string
  revenue: number
  expenses: number
  vat_output: number
  vat_input: number
}

export default function ClientTaxesPage() {
  const { selectedCompanyId } = useClientUser()
  const [year, setYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<TaxSummary | null>(null)
  const [periods, setPeriods] = useState<TaxPeriod[]>([])
  const [vatPayer, setVatPayer] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedCompanyId) return
    setLoading(true)
    fetch(`/api/client/taxes?company_id=${selectedCompanyId}`)
      .then(r => r.json())
      .then(data => {
        setSummary(data.summary || null)
        setPeriods(data.periods || [])
        setVatPayer(data.vat_payer || false)
        setYear(data.year || new Date().getFullYear())
      })
      .catch(() => { setSummary(null); setPeriods([]) })
      .finally(() => setLoading(false))
  }, [selectedCompanyId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    )
  }

  const monthNames = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
          <Landmark className="h-6 w-6 text-purple-600" />
          Daňový přehled {year}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Přehled příjmů, výdajů a daňových povinností</p>
      </div>

      {summary ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="rounded-xl">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Příjmy
                </div>
                <div className="text-xl font-bold text-green-600">{summary.total_revenue.toLocaleString('cs')} Kč</div>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  Výdaje
                </div>
                <div className="text-xl font-bold text-red-600">{summary.total_expenses.toLocaleString('cs')} Kč</div>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-muted-foreground">Zisk/Ztráta</div>
                <div className={`text-xl font-bold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.profit.toLocaleString('cs')} Kč
                </div>
              </CardContent>
            </Card>
            {vatPayer && (
              <Card className="rounded-xl">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowRightLeft className="h-3 w-3 text-blue-500" />
                    DPH bilance
                  </div>
                  <div className={`text-xl font-bold ${summary.vat_balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {summary.vat_balance.toLocaleString('cs')} Kč
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {summary.vat_balance >= 0 ? 'K úhradě' : 'Nadměrný odpočet'}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {periods.length > 0 && (
            <Card className="rounded-xl">
              <CardContent className="pt-4">
                <h3 className="text-sm font-semibold mb-3">Měsíční přehled</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4">Měsíc</th>
                        <th className="pb-2 pr-4 text-right">Příjmy</th>
                        <th className="pb-2 pr-4 text-right">Výdaje</th>
                        <th className="pb-2 text-right">Výsledek</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map(p => {
                        const monthIdx = parseInt(p.period.split('-')[1]) - 1
                        const profit = (p.revenue || 0) - (p.expenses || 0)
                        return (
                          <tr key={p.period} className="border-b border-border/50 last:border-0">
                            <td className="py-2 pr-4 font-medium">{monthNames[monthIdx]}</td>
                            <td className="py-2 pr-4 text-right text-green-600">{(p.revenue || 0).toLocaleString('cs')}</td>
                            <td className="py-2 pr-4 text-right text-red-600">{(p.expenses || 0).toLocaleString('cs')}</td>
                            <td className={`py-2 text-right font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profit.toLocaleString('cs')}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            Žádná daňová data k zobrazení
          </CardContent>
        </Card>
      )}
    </div>
  )
}
