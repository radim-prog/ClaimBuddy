'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Receipt, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

type PaymentRow = {
  company_name: string
  period: string
  amount: number
  paid: boolean
  paid_at: string | null
}

export default function FirmBillingPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentPeriod = new Date().toISOString().slice(0, 7)
    fetch(`/api/accountant/payments?period=${currentPeriod}`)
      .then(r => r.ok ? r.json() : { payments: [] })
      .then(data => setPayments(data.payments || []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const paid = payments.filter(p => p.paid)
  const unpaid = payments.filter(p => !p.paid)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <Receipt className="h-4 w-4 text-blue-500" />
          Celkem: <b>{payments.length}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-green-500" />
          Zaplaceno: <b>{paid.length}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Neuhrazeno: <b>{unpaid.length}</b>
        </span>
      </div>

      {/* Payments List */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Platby tento měsíc</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {payments.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">Žádné platby</p>
            ) : (
              payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.company_name}</p>
                    <p className="text-xs text-gray-500">{p.period}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{(p.amount || 0).toLocaleString('cs-CZ')} Kč</span>
                    <Badge variant={p.paid ? 'default' : 'destructive'} className="text-xs">
                      {p.paid ? 'Zaplaceno' : 'Nezaplaceno'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
