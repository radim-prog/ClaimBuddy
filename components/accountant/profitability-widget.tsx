'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Clock } from 'lucide-react'

// TODO: Ziskovost bude počítána z time-tracking dat v Supabase
// Potřebuje: propojení time-tracking entries s firmami přes API

export function ProfitabilityWidget({ limit = 20 }: { limit?: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          Ziskovost klientů
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Zatím žádná data</p>
          <p className="text-sm mt-1">Ziskovost se zobrazí po zaznamenání odpracovaného času u klientů.</p>
        </div>
      </CardContent>
    </Card>
  )
}
