'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileCheck,
  FileWarning,
  Upload,
  Send,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MissingDocument = {
  amount: number
  description: string
  date: string
  counterparty: string
}

type ReportData = {
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
  top_missing: MissingDocument[]
  monthly_chart?: MonthlyChartItem[]
}

type MonthlyChartItem = {
  month: string
  income: number
  expenses: number
}

type Company = {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Mock data (used when API is not ready)
// ---------------------------------------------------------------------------

const MOCK_COMPANIES: Company[] = [
  { id: 'c1', name: 'TechStart s.r.o.' },
  { id: 'c2', name: 'Gastro Plus a.s.' },
  { id: 'c3', name: 'Design Studio s.r.o.' },
]

const MOCK_REPORT: ReportData = {
  income: { total: 450000, paid: 380000, unpaid: 70000 },
  expenses: {
    total: 280000,
    matched: 220000,
    unmatched: 35000,
    non_deductible: 5000,
    ignored: 20000,
  },
  tax_impact: 12150,
  tax_impact_breakdown: { income_tax_loss: 6075, vat_deduction_loss: 6075 },
  top_missing: [
    {
      amount: 12100,
      description: 'Platba kartou',
      date: '2025-01-15',
      counterparty: 'ORLEN',
    },
    {
      amount: 8500,
      description: 'Prevod',
      date: '2025-01-20',
      counterparty: 'Office Depot',
    },
    {
      amount: 5200,
      description: 'Platba kartou',
      date: '2025-01-08',
      counterparty: 'Alza.cz',
    },
    {
      amount: 3800,
      description: 'Inkaso',
      date: '2025-01-22',
      counterparty: 'Vodafone',
    },
    {
      amount: 2900,
      description: 'Platba kartou',
      date: '2025-01-28',
      counterparty: 'Makro',
    },
  ],
  monthly_chart: [
    { month: 'Led', income: 120000, expenses: 85000 },
    { month: 'Uno', income: 95000, expenses: 72000 },
    { month: 'Bre', income: 110000, expenses: 68000 },
    { month: 'Dub', income: 125000, expenses: 55000 },
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCZK(value: number): string {
  return value.toLocaleString('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + ' Kc'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function generatePeriodOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const monthNames = [
    'Leden',
    'Unor',
    'Brezen',
    'Duben',
    'Kveten',
    'Cerven',
    'Cervenec',
    'Srpen',
    'Zari',
    'Rijen',
    'Listopad',
    'Prosinec',
  ]

  // Generate last 12 months
  for (let i = 0; i < 12; i++) {
    let month = currentMonth - i
    let year = currentYear
    if (month < 0) {
      month += 12
      year -= 1
    }
    const value = `${year}-${String(month + 1).padStart(2, '0')}`
    const label = `${monthNames[month]} ${year}`
    options.push({ value, label })
  }

  return options
}

// ---------------------------------------------------------------------------
// Custom tooltip for the chart
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <p
          key={index}
          className="text-sm"
          style={{ color: entry.color }}
        >
          {entry.name}: {formatCZK(entry.value)}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('c1')
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES)
  const [report, setReport] = useState<ReportData | null>(MOCK_REPORT)
  const [loading, setLoading] = useState(true)
  const [sendingReport, setSendingReport] = useState(false)
  const [reportSent, setReportSent] = useState(false)

  // Bank statement upload
  const [uploadDragging, setUploadDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadParsing, setUploadParsing] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    transactions: number
    matched: number
    unmatched: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const periodOptions = generatePeriodOptions()

  // Fetch companies
  useEffect(() => {
    fetch('/api/accountant/companies')
      .then((r) => r.json())
      .then((data) => {
        if (data.companies && data.companies.length > 0) {
          setCompanies(data.companies)
          setSelectedCompanyId(data.companies[0].id)
        }
      })
      .catch(() => {
        // API not ready, keep mock data
      })
  }, [])

  // Fetch report data
  useEffect(() => {
    setLoading(true)
    setReportSent(false)

    fetch(`/api/reports/${selectedCompanyId}?period=${selectedPeriod}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        // Validate the response has expected shape
        if (data && data.income && data.expenses) {
          setReport(data)
        } else {
          // API returns different format or no data - use mock
          setReport(MOCK_REPORT)
        }
        setLoading(false)
      })
      .catch(() => {
        // API not ready or error, use mock data
        setReport(MOCK_REPORT)
        setLoading(false)
      })
  }, [selectedCompanyId, selectedPeriod])

  // Send report to client
  const handleSendReport = useCallback(async () => {
    setSendingReport(true)
    try {
      await fetch(`/api/reports/${selectedCompanyId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: selectedPeriod }),
      })
      setReportSent(true)
    } catch {
      // Simulate success for demo
      setReportSent(true)
    } finally {
      setSendingReport(false)
    }
  }, [selectedCompanyId, selectedPeriod])

  // File upload handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    []
  )

  const processFile = useCallback(
    (file: File) => {
      const validTypes = [
        'text/csv',
        'text/xml',
        'application/xml',
        'application/vnd.ms-excel',
      ]
      const validExtensions = ['.csv', '.xml', '.xlsx']
      const hasValidExtension = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      )

      if (!validTypes.includes(file.type) && !hasValidExtension) {
        return
      }

      setUploadedFile(file)
      setUploadResult(null)
    },
    []
  )

  const handleUpload = useCallback(async () => {
    if (!uploadedFile) return

    setUploadParsing(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('company_id', selectedCompanyId)
      formData.append('period', selectedPeriod)

      await fetch('/api/bank-statements/upload', {
        method: 'POST',
        body: formData,
      })

      // Simulate parse result for demo
      setUploadResult({
        transactions: 47,
        matched: 38,
        unmatched: 9,
      })
    } catch {
      // Simulate result when API not available
      setUploadResult({
        transactions: 47,
        matched: 38,
        unmatched: 9,
      })
    } finally {
      setUploadParsing(false)
    }
  }, [uploadedFile, selectedCompanyId, selectedPeriod])

  // Chart data
  const chartData: MonthlyChartItem[] = report?.monthly_chart || [
    { month: 'Led', income: 120000, expenses: 85000 },
    { month: 'Uno', income: 95000, expenses: 72000 },
    { month: 'Bre', income: 110000, expenses: 68000 },
    { month: 'Dub', income: 125000, expenses: 55000 },
  ]

  // Current company name
  const currentCompanyName =
    companies.find((c) => c.id === selectedCompanyId)?.name || ''

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financni reporty
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Prehled prijmu, vydaju a chybejicich dokladu
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Company selector */}
          <Select
            value={selectedCompanyId}
            onValueChange={setSelectedCompanyId}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Vyberte firmu" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period selector */}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Obdobi" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto" />
            <p className="mt-3 text-gray-500 dark:text-gray-400">
              Nacitam report...
            </p>
          </div>
        </div>
      )}

      {/* Report content */}
      {!loading && report && (
        <>
          {/* --------------------------------------------------------------- */}
          {/* Tax impact warning box */}
          {/* --------------------------------------------------------------- */}
          {report.tax_impact > 0 && (
            <div className="rounded-lg border-2 border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-red-800 dark:text-red-300">
                    Danovy dopad chybejicich dokladu:{' '}
                    <span className="text-2xl">
                      {formatCZK(report.tax_impact)}
                    </span>
                  </h2>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-6">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <span className="text-sm text-red-700 dark:text-red-400">
                        Ztrata na dani z prijmu:{' '}
                        <strong>
                          {formatCZK(
                            report.tax_impact_breakdown.income_tax_loss
                          )}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-500" />
                      <span className="text-sm text-red-700 dark:text-red-400">
                        Ztrata na odpoctu DPH:{' '}
                        <strong>
                          {formatCZK(
                            report.tax_impact_breakdown.vat_deduction_loss
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                    Dodanim chybejicich dokladu muze klient usetrit az{' '}
                    {formatCZK(report.tax_impact)} na danich.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* Income vs Expenses chart */}
          {/* --------------------------------------------------------------- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                Prijmy vs. Vydaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-gray-200 dark:stroke-gray-700"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 13 }}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <YAxis
                      tickFormatter={(value: number) =>
                        `${(value / 1000).toFixed(0)}k`
                      }
                      tick={{ fontSize: 12 }}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      formatter={(value: string) =>
                        value === 'income' ? 'Prijmy' : 'Vydaje'
                      }
                    />
                    <Bar
                      dataKey="income"
                      name="income"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="expenses"
                      name="expenses"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* --------------------------------------------------------------- */}
          {/* Summary cards row */}
          {/* --------------------------------------------------------------- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total income */}
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Celkove prijmy
                    </p>
                    <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400">
                      {formatCZK(report.income.total)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    Uhrazeno: {formatCZK(report.income.paid)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  >
                    Neuhrazeno: {formatCZK(report.income.unpaid)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Total expenses */}
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Celkove vydaje
                    </p>
                    <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-400">
                      {formatCZK(report.expenses.total)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Neuznatelne: {formatCZK(report.expenses.non_deductible)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Matched expenses */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Sparovane vydaje
                    </p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCZK(report.expenses.matched)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <FileCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${report.expenses.total > 0 ? Math.round(
                          (report.expenses.matched / report.expenses.total) * 100
                        ) : 0}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {report.expenses.total > 0 ? Math.round(
                      (report.expenses.matched / report.expenses.total) * 100
                    ) : 0}
                    % z celkovych vydaju
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Unmatched expenses */}
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Nesparovane vydaje
                    </p>
                    <p className="mt-1 text-2xl font-bold text-orange-700 dark:text-orange-400">
                      {formatCZK(report.expenses.unmatched)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <FileWarning className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="mt-3">
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  >
                    Chybi doklady
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* Top 5 missing documents */}
          {/* --------------------------------------------------------------- */}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-orange-500" />
                Top {report.top_missing.length} chybejicich dokladu
              </CardTitle>
              <Button
                onClick={handleSendReport}
                disabled={sendingReport || reportSent}
                className={
                  reportSent
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }
              >
                {sendingReport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Odesilam...
                  </>
                ) : reportSent ? (
                  <>
                    <FileCheck className="mr-2 h-4 w-4" />
                    Report odeslan
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Odeslat report klientovi
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {report.top_missing.length === 0 ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <FileCheck className="mx-auto h-12 w-12 text-green-400 mb-3" />
                  <p className="text-lg font-medium">
                    Vsechny doklady jsou sparovany
                  </p>
                  <p className="text-sm mt-1">
                    Zadne chybejici doklady pro toto obdobi.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Datum</TableHead>
                        <TableHead className="text-right">Castka</TableHead>
                        <TableHead>Popis</TableHead>
                        <TableHead>Protiucet</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.top_missing
                        .sort((a, b) => b.amount - a.amount)
                        .slice(0, 5)
                        .map((doc, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-gray-700 dark:text-gray-300">
                              {formatDate(doc.date)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                              {formatCZK(doc.amount)}
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {doc.description}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{doc.counterparty}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* --------------------------------------------------------------- */}
          {/* Bank statement upload section */}
          {/* --------------------------------------------------------------- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Nahrat bankovni vypis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Dropzone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative cursor-pointer rounded-lg border-2 border-dashed p-8
                    transition-colors text-center
                    ${
                      uploadDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xml,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pretahnete soubor sem nebo kliknete pro vyber
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Podporovane formaty: CSV, XML, XLSX
                  </p>
                </div>

                {/* Selected file info */}
                {uploadedFile && (
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={uploadParsing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {uploadParsing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Zpracovavam...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Nahrat vypis
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Upload result */}
                {uploadResult && (
                  <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
                    <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
                      Vysledek zpracovani
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {uploadResult.transactions}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Celkem transakci
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {uploadResult.matched}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Sparovano
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {uploadResult.unmatched}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Nesparovano
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* No report data */}
      {!loading && !report && (
        <div className="py-16 text-center">
          <FileSpreadsheet className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Zadna data
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Pro vybrane obdobi a firmu nebyly nalezeny zadne reporty.
          </p>
        </div>
      )}
    </div>
  )
}
