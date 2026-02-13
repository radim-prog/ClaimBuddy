'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react'

interface Invoice {
  id: string
  company_id: string
  invoice_number: string
  type: string
  partner_name: string
  amount: number
  currency: string
  issue_date: string
  due_date: string
  status: string
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

const statusLabels: Record<string, string> = {
  paid: 'Zaplaceno',
  unpaid: 'Nezaplaceno',
  overdue: 'Po splatnosti',
  draft: 'Koncept',
  sent: 'Odesláno',
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency }).format(amount)
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/client/invoices')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvoices() }, [])

  const filtered = filter === 'all'
    ? invoices
    : invoices.filter(i => filter === 'income' ? i.type === 'issued' : i.type === 'received')

  const totalIncome = invoices.filter(i => i.type === 'issued').reduce((s, i) => s + (i.amount || 0), 0)
  const totalExpense = invoices.filter(i => i.type === 'received').reduce((s, i) => s + (i.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Faktury</h1>
          <p className="text-muted-foreground">Přehled vydaných a přijatých faktur</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInvoices}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Obnovit
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" onClick={() => setFilter('all')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Celkem faktur</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground opacity-30" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-green-500 transition-all" onClick={() => setFilter('income')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Vydané (příjmy)</p>
                <p className="text-2xl font-bold text-green-600">{formatAmount(totalIncome, 'CZK')}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 hover:ring-red-500 transition-all" onClick={() => setFilter('expense')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Přijaté (náklady)</p>
                <p className="text-2xl font-bold text-red-600">{formatAmount(totalExpense, 'CZK')}</p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'all' ? 'Vše' : f === 'income' ? 'Vydané' : 'Přijaté'}
          </button>
        ))}
      </div>

      {loading && invoices.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {!loading && invoices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Zatím nemáte žádné faktury</p>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(inv => (
            <Card key={inv.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    inv.type === 'issued' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
                  }`}>
                    {inv.type === 'issued'
                      ? <ArrowUpRight className="h-5 w-5 text-green-600" />
                      : <ArrowDownLeft className="h-5 w-5 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {inv.invoice_number} — {inv.partner_name || 'Neuvedeno'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{inv.type === 'issued' ? 'Vydaná' : 'Přijatá'}</span>
                      <span>·</span>
                      <span>Vystaveno {new Date(inv.issue_date).toLocaleDateString('cs-CZ')}</span>
                      {inv.due_date && (
                        <>
                          <span>·</span>
                          <span>Splatnost {new Date(inv.due_date).toLocaleDateString('cs-CZ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-semibold ${
                      inv.type === 'issued' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatAmount(inv.amount || 0, inv.currency)}
                    </span>
                    <Badge className={statusColors[inv.status] || 'bg-gray-100 text-gray-800'}>
                      {statusLabels[inv.status] || inv.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
