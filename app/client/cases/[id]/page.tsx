'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CaseTimeline } from '@/components/case/case-timeline'
import { CaseDocuments } from '@/components/case/case-documents'
import { CaseBudgetCard } from '@/components/case/case-budget-card'
import { ArrowLeft, Briefcase, Calendar, FileText, Clock, Target } from 'lucide-react'

type CaseDetail = {
  id: string
  title: string
  description?: string
  status: string
  case_number?: string
  case_type_name?: string
  case_opened_at?: string
  case_closed_at?: string
  case_opposing_party?: string
  client_visible_tabs?: string[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planning: { label: 'Plánování', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Aktivní', color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'Pozastaveno', color: 'bg-yellow-100 text-yellow-700' },
  review: { label: 'K přezkoumání', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Dokončeno', color: 'bg-gray-100 text-gray-600' },
}

const TAB_CONFIG: Record<string, { label: string; icon: typeof Clock }> = {
  timeline: { label: 'Časová osa', icon: Clock },
  documents: { label: 'Dokumenty', icon: FileText },
  budget: { label: 'Rozpočet', icon: Target },
}

export default function ClientCaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/client/cases/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setCaseData(data.case)
      })
      .catch(() => setError('Nepodařilo se načíst spis'))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="text-center py-12">
        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">{error || 'Spis nenalezen'}</p>
        <Button onClick={() => router.push('/client/cases')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Zpět na spisy
        </Button>
      </div>
    )
  }

  const statusCfg = STATUS_LABELS[caseData.status] || STATUS_LABELS.active
  const visibleTabs = caseData.client_visible_tabs || ['timeline', 'documents']
  const defaultTab = visibleTabs[0] || 'timeline'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.push('/client/cases')}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Zpět na spisy
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            {caseData.case_number && (
              <Badge variant="outline">{caseData.case_number}</Badge>
            )}
            <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
          </div>
          <h1 className="text-xl font-bold mb-1">{caseData.title}</h1>
          {caseData.case_type_name && (
            <p className="text-sm text-muted-foreground">{caseData.case_type_name}</p>
          )}
          {caseData.description && (
            <p className="text-sm text-muted-foreground mt-2">{caseData.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {caseData.case_opened_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Otevřeno {new Date(caseData.case_opened_at).toLocaleDateString('cs-CZ')}
              </span>
            )}
            {caseData.case_opposing_party && (
              <span>Protistrana: {caseData.case_opposing_party}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      {visibleTabs.length > 0 && (
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            {visibleTabs.map(tab => {
              const cfg = TAB_CONFIG[tab]
              if (!cfg) return null
              const Icon = cfg.icon
              return (
                <TabsTrigger key={tab} value={tab}>
                  <Icon className="h-4 w-4 mr-1" /> {cfg.label}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {visibleTabs.includes('timeline') && (
            <TabsContent value="timeline">
              <CaseTimeline projectId={params.id} readOnly apiBasePath="/api/client/cases" />
            </TabsContent>
          )}
          {visibleTabs.includes('documents') && (
            <TabsContent value="documents">
              <CaseDocuments projectId={params.id} readOnly apiBasePath="/api/client/cases" />
            </TabsContent>
          )}
          {visibleTabs.includes('budget') && (
            <TabsContent value="budget">
              <CaseBudgetCard projectId={params.id} />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  )
}
