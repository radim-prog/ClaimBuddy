'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, FolderOpen, ArrowRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import type { InsuranceCase } from '@/lib/types/insurance'
import { insuranceStatusLabel, insuranceStatusColor, insuranceTypeLabel } from '@/lib/types/insurance'

export default function ClaimsDocumentsPage() {
  const [search, setSearch] = useState('')

  const { data, loading } = useCachedFetch<{ cases: InsuranceCase[] }>(
    'client-claims-docs',
    () => fetch('/api/client/claims').then(r => r.json()),
    { ttl: 60_000 }
  )

  const cases = data?.cases ?? []

  const filtered = cases.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.case_number?.toLowerCase().includes(q) ||
      c.event_description?.toLowerCase().includes(q) ||
      insuranceTypeLabel(c.insurance_type).toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
          Soubory k pojistným událostem
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Dokumenty a přílohy ke všem vašim případům
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Hledat podle čísla případu nebo popisu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {cases.length === 0 ? 'Žádné pojistné události' : 'Žádné výsledky'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {cases.length === 0
                ? 'Zatím nemáte žádné pojistné události s dokumenty.'
                : 'Zkuste upravit vyhledávání.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
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
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {c.case_number || 'Případ'}
                        </span>
                        <Badge variant="outline" className={statusColors}>
                          {insuranceStatusLabel(c.status)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {insuranceTypeLabel(c.insurance_type)}
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
