'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  FileText,
  MessageSquare,
  Shield,
  Paperclip,
  AlertCircle,
  Activity,
  Brain,
  Sparkles,
} from 'lucide-react'
import {
  insuranceStatusLabel,
  insuranceStatusColor,
  insuranceTypeLabel,
} from '@/lib/types/insurance'
import type { InsuranceCase, InsuranceCaseEvent } from '@/lib/types/insurance'

const EVENT_ICONS: Record<string, typeof Activity> = {
  created: Shield,
  status_change: Activity,
  document_added: FileText,
  note_added: MessageSquare,
  payment_added: CheckCircle2,
}

const FRIENDLY_STATUS: Record<string, string> = {
  new: 'Událost přijata',
  gathering_docs: 'Shromažďujeme podklady',
  submitted: 'Podáno pojišťovně',
  under_review: 'Pojišťovna posuzuje',
  additional_info: 'Čeká se na doplnění',
  in_analysis: 'Analyzujeme podklady',
  in_consultation: 'Konzultace s odborníkem',
  awaiting_poa: 'Čeká na plnou moc',
  poa_signed: 'Plná moc podepsána',
  representing: 'Zastupujeme vás',
  awaiting_response: 'Čekáme na odpověď pojišťovny',
  partially_approved: 'Částečně schváleno',
  approved: 'Plnění přiznáno',
  rejected: 'Pojišťovna zamítla',
  appealed: 'Odvolání podáno',
  resolved: 'Vyřešeno',
  closed: 'Uzavřeno',
  cancelled: 'Zrušeno',
}

export default function ClientCaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const router = useRouter()
  const [caseId, setCaseId] = useState<string | null>(null)
  const [caseData, setCaseData] = useState<InsuranceCase | null>(null)
  const [events, setEvents] = useState<InsuranceCaseEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => setCaseId(p.caseId))
  }, [params])

  useEffect(() => {
    if (!caseId) return

    async function load() {
      try {
        const [casesRes, eventsRes] = await Promise.all([
          fetch('/api/client/claims'),
          fetch(`/api/client/claims/${caseId}/timeline`),
        ])

        if (casesRes.ok) {
          const data = await casesRes.json()
          const found = (data.cases || []).find((c: InsuranceCase) => c.id === caseId)
          if (found) setCaseData(found)
        }

        if (eventsRes.ok) {
          const data = await eventsRes.json()
          setEvents(data.events || [])
        }
      } catch {
        // Non-fatal
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [caseId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/client/claims')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">
              {caseData?.case_number || 'Pojistná událost'}
            </h1>
            {caseData && (
              <>
                <Badge className={`text-xs ${insuranceStatusColor(caseData.status)}`}>
                  {insuranceStatusLabel(caseData.status)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {insuranceTypeLabel(caseData.insurance_type)}
                </Badge>
              </>
            )}
          </div>
          {caseData?.status && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {FRIENDLY_STATUS[caseData.status] || insuranceStatusLabel(caseData.status)}
            </p>
          )}
        </div>
      </div>

      {/* Status progress */}
      {caseData && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {FRIENDLY_STATUS[caseData.status] || insuranceStatusLabel(caseData.status)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Naposledy aktualizováno: {new Date(caseData.updated_at).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Report */}
      {caseData?.ai_report && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">AI Analýza</h2>
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
                {caseData.ai_processed_at && (
                  <p className="text-xs text-muted-foreground">
                    Vygenerováno: {new Date(caseData.ai_processed_at).toLocaleDateString('cs-CZ', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {caseData.ai_report}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Processing pending */}
      {caseData?.service_mode === 'ai_processing' && caseData?.payment_status === 'paid' && !caseData?.ai_report && (
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
              AI analýza se zpracovává...
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Zpráva bude dostupná během několika minut.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Průběh řešení</h2>
        {events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Zatím žádné aktualizace. Brzy se zde zobrazí průběh řešení vaší události.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-800" />

            <div className="space-y-4">
              {events.map((event) => {
                const Icon = EVENT_ICONS[event.event_type] || Activity
                return (
                  <div key={event.id} className="relative flex gap-4 pl-1">
                    <div className="relative z-10 flex items-center justify-center h-10 w-10 rounded-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {event.description}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(event.created_at).toLocaleDateString('cs-CZ', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {event.attachment_url && (
                          <a
                            href={event.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Paperclip className="h-3 w-3" />
                            Příloha
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Info notice */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium">Potřebujete pomoc?</p>
            <p className="mt-0.5 text-blue-700 dark:text-blue-400">
              Kontaktujte nás na podpora@zajcon.cz nebo prostřednictvím zpráv v portálu.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
