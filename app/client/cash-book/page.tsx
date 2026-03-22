'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { CashTransactionForm } from '@/components/client/cash-transaction-form'
import { CashBookView } from '@/components/client/cash-book-view'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { Loader2, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

export default function CashBookPage() {
  const { visibleCompanies, selectedCompanyId } = useClientUser()
  const companyId = selectedCompanyId || visibleCompanies[0]?.id || ''

  const currentDate = new Date()
  const [year, setYear] = useState(currentDate.getFullYear())
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const period = `${year}-${String(month).padStart(2, '0')}`

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<any>(null)

  const fetchData = useCallback(() => {
    if (!companyId) return
    setLoading(true)
    fetch(`/api/client/cash-book?company_id=${companyId}&period=${period}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId, period])

  useEffect(() => { fetchData() }, [fetchData])

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

  const handleExport = () => {
    const url = `/api/client/cash-transactions/export-pohoda?company_id=${companyId}&period=${period}`
    fetch(url).then(async res => {
      if (!res.ok) return
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `pohoda-cash-${companyId}-${period}.xml`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  const handleSave = () => {
    setShowForm(false)
    setEditEntry(null)
    fetchData()
  }

  const handleRowClick = (entry: any) => {
    setEditEntry(entry)
    setShowForm(true)
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pokladní kniha</h1>
          <div className="flex items-center gap-2 mt-1">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {monthNames[month - 1]} {year}
            </span>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button size="sm" onClick={() => { setEditEntry(null); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nový doklad
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <CashTransactionForm
          companyId={companyId}
          period={period}
          editData={editEntry}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditEntry(null) }}
        />
      )}

      {/* Cash book table */}
      {data && (
        <CashBookView
          data={data}
          onExport={handleExport}
          onRowClick={handleRowClick}
        />
      )}
    </div>
  )
}
