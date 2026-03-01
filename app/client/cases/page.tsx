'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, ArrowLeft, Calendar, ChevronRight } from 'lucide-react'

type ClientCase = {
  id: string
  title: string
  status: string
  case_number?: string
  case_type_name?: string
  case_opened_at?: string
  case_closed_at?: string
  updated_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planning: { label: 'Plánování', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Aktivní', color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'Pozastaveno', color: 'bg-yellow-100 text-yellow-700' },
  review: { label: 'K přezkoumání', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Dokončeno', color: 'bg-gray-100 text-gray-600' },
}

export default function ClientCasesPage() {
  const [cases, setCases] = useState<ClientCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/client/cases')
      .then(r => r.json())
      .then(data => setCases(data.cases || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/client/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          Vaše spisy
        </h1>
      </div>

      {cases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Zatím nemáte žádné viditelné spisy.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map(c => {
            const statusCfg = STATUS_LABELS[c.status] || STATUS_LABELS.active
            return (
              <Link key={c.id} href={`/client/cases/${c.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {c.case_number && (
                            <Badge variant="outline" className="text-xs">{c.case_number}</Badge>
                          )}
                          <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                        </div>
                        <h3 className="font-semibold text-sm truncate">{c.title}</h3>
                        {c.case_type_name && (
                          <p className="text-xs text-muted-foreground mt-1">{c.case_type_name}</p>
                        )}
                        {c.case_opened_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Calendar className="h-3 w-3" />
                            Otevřeno {new Date(c.case_opened_at).toLocaleDateString('cs-CZ')}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                    </div>
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
