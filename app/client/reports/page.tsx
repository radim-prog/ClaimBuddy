'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, TrendingUp, TrendingDown, FileText, AlertCircle, ChevronRight } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'
import Link from 'next/link'

// Types
interface ReportData {
  income: {
    total: number
    paid: number
    unpaid: number
  }
  expenses: {
    total: number
    matched: number
    unmatched: number
    non_deductible: number
    ignored: number
  }
  tax_impact: number
  tax_impact_breakdown: {
    income_tax_loss: number
    vat_deduction_loss: number
  }
  top_missing: Array<{
    amount: number
    description: string
    date: string
    days_outstanding: number
  }>
}

export default function ClientReportsPage() {
  const { companies, loading: contextLoading } = useClientUser()
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const companyId = companies[0]?.id

  useEffect(() => {
    if (!companyId) return
    loadReport()
  }, [period, companyId])

  const loadReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/${companyId}?period=${period}`)
      const data = await res.json()
      if (data.success && data.report) {
        setReport(data.report)
      }
    } catch (err) {
      console.error('Failed to load report:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 0,
    })
  }

  const getMatchRate = () => {
    if (!report) return 0
    if (report.expenses.total === 0) return 100
    return Math.round((report.expenses.matched / report.expenses.total) * 100)
  }

  const getMissingCount = () => {
    return report?.top_missing?.length || 0
  }

  if (contextLoading || loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!companyId) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Zatím nemáte přiřazenou žádnou firmu
          </h2>
          <p className="text-gray-600">
            Kontaktujte prosím svého účetního pro přiřazení firmy.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Můj finanční přehled</h1>
          <p className="text-gray-600 mt-1">
            Přehled příjmů, výdajů a daňového dopadu za vybrané období
          </p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Vyberte měsíc" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date()
              d.setMonth(d.getMonth() - i)
              const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
              const label = d.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })
              return (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Tax Impact Alert */}
      {report && report.tax_impact > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-red-900 dark:text-red-200">
                  Možný daňový dopad: {formatCurrency(report.tax_impact)}
                </h2>
                <p className="text-red-700 dark:text-red-300 mt-2 text-sm md:text-base">
                  Bez dokladů nemůžeme uplatnit odpočet DPH ani odečíst výdaj z daňového základu.
                  Doplňte chybějící doklady pro snížení vaší daňové povinnosti.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/client/upload">
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                      Nahrát doklady
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              Celkové příjmy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {report ? formatCurrency(report.income.total) : '-'}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>vstupní faktury</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              Celkové výdaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-red-600">
              {report ? formatCurrency(report.expenses.total) : '-'}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <TrendingDown className="w-3 h-3 text-red-500" />
              <span>výstupní faktury</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              Míra párování
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">
              {report ? `${getMatchRate()}%` : '-'}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  getMatchRate() >= 80 ? 'bg-green-500' :
                  getMatchRate() >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${getMatchRate()}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              Chybějící doklady
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-orange-600">
              {getMissingCount()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              k doplnění
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Missing Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Chybějící doklady
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getMissingCount() > 0 ? (
              <div className="space-y-3">
                {report?.top_missing.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        {item.date} • {item.days_outstanding} dní bez dokladu
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-3 flex-shrink-0">
                      {formatCurrency(item.amount)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-600 font-medium">
                  Všechny doklady jsou v pořádku! 🎉
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Nemáte žádné chybějící doklady pro toto období.
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <Link href="/client/upload">
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Nahrát chybějící doklady
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Match Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Přehled dokladů</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Spárované doklady</span>
                <Badge className="bg-green-100 text-green-800">
                  {getMatchRate()}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Bez dokladu</span>
                <Badge className="bg-red-100 text-red-800">
                  {report ? Math.round(((report.expenses.unmatched || 0) / Math.max(report.expenses.total, 1)) * 100) : 0}%
                </Badge>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-sm mb-2">Detaily výdajů:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Spárované</span>
                    <span className="font-medium text-green-600">
                      {report ? formatCurrency(report.expenses.matched) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nespárované</span>
                    <span className="font-medium text-red-600">
                      {report ? formatCurrency(report.expenses.unmatched) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nedaňové</span>
                    <span className="font-medium text-gray-600">
                      {report ? formatCurrency(report.expenses.non_deductible) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <Link href="/client/documents">
                <Button variant="outline" className="w-full mt-2">
                  Zobrazit všechny doklady
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
