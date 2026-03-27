'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle,
  BarChart3,
  PiggyBank,
  CreditCard,
  ChevronRight,
  Download
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

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

interface BankStatementReport {
  total_transactions: number
  matched_transactions: number
  unmatched_transactions: number
  total_income: number
  total_expenses: number
  unmatched_income: number
  unmatched_expenses: number
}

interface CompanyReportsProps {
  companyId: string
  companyName: string
}

const COLORS = {
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
  gray: '#9ca3af',
  purple: '#a855f7'
}

export function CompanyReports({ companyId, companyName }: CompanyReportsProps) {
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [report, setReport] = useState<ReportData | null>(null)
  const [bankReport, setBankReport] = useState<BankStatementReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadReports()
  }, [period, companyId])

  const loadReports = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load main report
      const reportRes = await fetch(`/api/reports/${companyId}?period=${period}`)
      if (!reportRes.ok) {
        setReport(null)
      } else {
        const reportData = await reportRes.json()
        if (reportData.error || reportData._empty) {
          setReport(null)
        } else {
          setReport(reportData)
        }
      }

      // Load bank statement report
      const bankRes = await fetch(`/api/reports/${companyId}/bank-statements?period=${period}`)
      if (bankRes.ok) {
        const bankData = await bankRes.json()
        if (!bankData.error && !bankData._empty) {
          setBankReport(bankData)
        }
      }
    } catch (err) {
      console.error('Failed to load reports:', err)
      setError('Nepodařilo se načíst reporty. Zkontrolujte připojení.')
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

  const getMatchRate = (): number | null => {
    if (!report) return null
    if (report.expenses.total === 0) return null
    return Math.round((report.expenses.matched / report.expenses.total) * 100)
  }

  const getBankMatchRate = (): number | null => {
    if (!bankReport) return null
    if (bankReport.total_transactions === 0) return null
    return Math.round((bankReport.matched_transactions / bankReport.total_transactions) * 100)
  }

  // Chart data for expenses breakdown
  const expensesChartData = useMemo(() => {
    if (!report) return []
    return [
      { name: 'Spárované', value: report.expenses.matched, color: COLORS.green },
      { name: 'Nespárované', value: report.expenses.unmatched, color: COLORS.red },
      { name: 'Nedaňové', value: report.expenses.non_deductible, color: COLORS.yellow },
    ].filter(item => item.value > 0)
  }, [report])

  // Chart data for bank transactions
  const bankChartData = useMemo(() => {
    if (!bankReport) return []
    return [
      { name: 'Spárované', value: bankReport.matched_transactions, color: COLORS.green },
      { name: 'Nespárované', value: bankReport.unmatched_transactions, color: COLORS.red },
    ].filter(item => item.value > 0)
  }, [bankReport])

  // Income vs Expenses comparison
  const comparisonData = useMemo(() => {
    if (!report) return []
    return [
      { name: 'Příjmy', amount: report.income.total },
      { name: 'Výdaje', amount: report.expenses.total },
    ]
  }, [report])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadReports}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Zkusit znovu
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Reporty
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Finanční přehled a analýza dokladů za {companyName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Vyberte období" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => {
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

          <Button variant="outline" size="icon" title="Připravujeme" disabled className="opacity-50 cursor-not-allowed">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tax Impact Alert */}
      {report && report.tax_impact > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 dark:text-red-200">
                  Daňový dopad: {formatCurrency(report.tax_impact)}
                </h3>
                <p className="text-red-700 dark:text-red-300 mt-2 text-sm">
                  Bez dokladů nemůžeme uplatnit odpočet DPH ani odečíst výdaj z daňového základu.
                  Klient platí navíc:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-red-300 text-red-700 bg-red-100">
                    DPH: {formatCurrency(report.tax_impact_breakdown.vat_deduction_loss)}
                  </Badge>
                  <Badge variant="outline" className="border-red-300 text-red-700 bg-red-100">
                    Daň z příjmu: {formatCurrency(report.tax_impact_breakdown.income_tax_loss)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Celkové příjmy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold text-green-600">
              {report ? formatCurrency(report.income.total) : '-'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {report?.income.paid ? `${formatCurrency(report.income.paid)} zaplaceno` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              Celkové výdaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold text-red-600">
              {report ? formatCurrency(report.expenses.total) : '-'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {report ? `${formatCurrency(report.expenses.matched)} spárováno` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <FileText className="h-3 w-3 text-blue-500" />
              Míra párování
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold">
              {getMatchRate() !== null ? `${getMatchRate()}%` : '—'}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  (getMatchRate() ?? 0) >= 80 ? 'bg-green-500' :
                  (getMatchRate() ?? 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${getMatchRate() ?? 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <CreditCard className="h-3 w-3 text-purple-500" />
              Bankovní párování
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-xl font-bold">
              {getBankMatchRate() !== null ? `${getBankMatchRate()}%` : '—'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {bankReport ? `${bankReport.matched_transactions}/${bankReport.total_transactions} transakcí` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different report views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Přehled</TabsTrigger>
          <TabsTrigger value="expenses">Výdaje</TabsTrigger>
          <TabsTrigger value="bank">Banka</TabsTrigger>
          <TabsTrigger value="missing">Chybí</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Income vs Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Příjmy vs Výdaje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Bar dataKey="amount">
                        {comparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.green : COLORS.red} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rozdělení výdajů</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center">
                  {expensesChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {expensesChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-sm">Žádná data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <PiggyBank className="h-4 w-4" />
                Finanční souhrn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Hrubý zisk</p>
                  <p className="font-semibold text-lg">
                    {report ? formatCurrency(report.income.total - report.expenses.total) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Nespárované výdaje</p>
                  <p className="font-semibold text-lg text-red-600">
                    {report ? formatCurrency(report.expenses.unmatched) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Nedaňové výdaje</p>
                  <p className="font-semibold text-lg text-yellow-600">
                    {report ? formatCurrency(report.expenses.non_deductible) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Daňový dopad</p>
                  <p className="font-semibold text-lg text-red-600">
                    {report ? formatCurrency(report.tax_impact) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detail výdajů</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report && (
                  <>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">Spárované doklady</span>
                      <span className="font-semibold text-green-700">
                        {formatCurrency(report.expenses.matched)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm">Nespárované doklady</span>
                      <span className="font-semibold text-red-700">
                        {formatCurrency(report.expenses.unmatched)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm">Nedaňové výdaje</span>
                      <span className="font-semibold text-yellow-700">
                        {formatCurrency(report.expenses.non_deductible)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Ignorované</span>
                      <span className="font-semibold text-gray-700">
                        {formatCurrency(report.expenses.ignored)}
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-medium">Celkem výdaje</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(report.expenses.total)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Tab */}
        <TabsContent value="bank" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bankovní transakce</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center">
                  {bankChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bankChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {bankChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-sm">Žádná data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Souhrn bankovních transakcí</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bankReport && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Celkem transakcí</span>
                        <span className="font-semibold">{bankReport.total_transactions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Spárované</span>
                        <Badge className="bg-green-100 text-green-800">
                          {bankReport.matched_transactions}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Nespárované</span>
                        <Badge className="bg-red-100 text-red-800">
                          {bankReport.unmatched_transactions}
                        </Badge>
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Příjmy z banky</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(bankReport.total_income)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600">Výdaje z banky</span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(bankReport.total_expenses)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Missing Tab */}
        <TabsContent value="missing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Doklady k doplnění
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report && report.top_missing && report.top_missing.length > 0 ? (
                <div className="space-y-3">
                  {report.top_missing.slice(0, 10).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.description}</p>
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
                    <CheckIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    Všechny doklady jsou v pořádku! 🎉
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Zatím žádné doklady k doplnění pro toto období.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper icon for checkmark
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
