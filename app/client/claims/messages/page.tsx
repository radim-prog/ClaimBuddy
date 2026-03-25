'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, ArrowRight, Shield, Send } from 'lucide-react'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import type { InsuranceCase } from '@/lib/types/insurance'
import { insuranceStatusLabel, insuranceStatusColor } from '@/lib/types/insurance'

export default function ClaimsMessagesPage() {
  const { data, loading } = useCachedFetch<{ cases: InsuranceCase[] }>(
    'client-claims-msgs',
    () => fetch('/api/client/claims').then(r => r.json()),
    { ttl: 60_000 }
  )

  const cases = data?.cases ?? []
  const activeCases = cases.filter(c => !['closed', 'cancelled', 'rejected'].includes(c.status))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
          Zprávy k pojistným událostem
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Komunikace s likvidátory k vašim případům
        </p>
      </div>

      {/* Quick link to general messages */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
        <CardContent className="py-4 px-5">
          <Link
            href="/client/messages"
            className="flex items-center gap-3 group"
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
              <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-blue-900 dark:text-blue-100 group-hover:underline">
                Obecné zprávy
              </span>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Napište nám zprávu ohledně pojistných událostí
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : activeCases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              Žádné aktivní případy
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Zprávy se zobrazí u aktivních pojistných událostí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Aktivní případy ({activeCases.length})
          </h3>
          {activeCases.map(c => {
            const statusColors = insuranceStatusColor(c.status)
            return (
              <Link
                key={c.id}
                href={`/client/claims/${c.id}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4 px-5 flex items-center gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {c.case_number || 'Případ'}
                        </span>
                        <Badge variant="outline" className={statusColors}>
                          {insuranceStatusLabel(c.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {c.event_description || 'Bez popisu'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
