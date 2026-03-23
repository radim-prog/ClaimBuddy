'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClosureMatrix, type MatrixCompany } from '@/components/accountant/closures/closure-matrix'
import { Loader2, Bell, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react'

export default function AccountantClosuresPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [companies, setCompanies] = useState<MatrixCompany[]>([])
  const [totalCompanies, setTotalCompanies] = useState(0)
  const [loading, setLoading] = useState(true)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchResult, setBatchResult] = useState<{ sent: number; failed: number } | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/accountant/closures/matrix?year=${year}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setCompanies(d.companies || [])
          setTotalCompanies(d.total_companies || 0)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  // Compute summary stats from matrix data
  const stats = computeStats(companies, year)

  const handleBatchRemind = async () => {
    const currentMonth = new Date().getMonth() + 1
    const period = `${year}-${String(currentMonth).padStart(2, '0')}`
    setBatchLoading(true)
    setBatchResult(null)
    try {
      const res = await fetch('/api/accountant/closures/remind-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })
      if (res.ok) {
        const data = await res.json()
        setBatchResult({ sent: data.sent || 0, failed: data.failed || 0 })
      }
    } catch { /* ignore */ }
    setBatchLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Uzávěrky {year}</h1>
          <p className="text-sm text-muted-foreground">
            {totalCompanies} aktivních firem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>
            &larr; {year - 1}
          </Button>
          {year < currentYear && (
            <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>
              {year + 1} &rarr;
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchRemind}
            disabled={batchLoading}
          >
            {batchLoading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-1.5" />
            )}
            Hromadné připomenutí
          </Button>
        </div>
      </div>

      {batchResult && (
        <div className="text-sm text-muted-foreground">
          Odesláno: {batchResult.sent}, Selhalo: {batchResult.failed}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Building2 className="h-3.5 w-3.5" /> Firmy
            </div>
            <p className="text-lg font-bold">{totalCompanies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Schváleno
            </div>
            <p className="text-lg font-bold text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /> Rozpracováno
            </div>
            <p className="text-lg font-bold text-yellow-600">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className={stats.incomplete > 0 ? 'border-red-200 dark:border-red-800' : ''}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Nekompletní
            </div>
            <p className="text-lg font-bold text-red-600">{stats.incomplete}</p>
          </CardContent>
        </Card>
      </div>

      {/* Matrix */}
      <ClosureMatrix year={year} companies={companies} />
    </div>
  )
}

function computeStats(companies: MatrixCompany[], year: number) {
  let approved = 0
  let inProgress = 0
  let incomplete = 0

  const currentMonth = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12

  for (const company of companies) {
    for (let m = 1; m <= currentMonth; m++) {
      const period = `${year}-${String(m).padStart(2, '0')}`
      const cell = company.months[period]
      if (!cell) continue
      if (cell.color === 'green') approved++
      else if (cell.color === 'yellow' || cell.color === 'orange') inProgress++
      else if (cell.color === 'red') incomplete++
    }
  }

  return { approved, inProgress, incomplete }
}
