'use client'

import { useState, useEffect, useCallback } from 'react'
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
  ScrollText,
  PenTool,
  Check,
  Square,
  CheckSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
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

export default function ClientCaseDetailPage({ params }: { params: { caseId: string } }) {
  const router = useRouter()
  // Next 14: params je plain object v client component, NE Promise (BUG-1).
  const [caseId, setCaseId] = useState<string | null>(params?.caseId ?? null)
  const [caseData, setCaseData] = useState<InsuranceCase | null>(null)
  const [events, setEvents] = useState<InsuranceCaseEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [contracts, setContracts] = useState<any[]>([])
  const [signingJob, setSigningJob] = useState<string | null>(null)
  const [consent, setConsent] = useState<Record<string, boolean>>({})
  const [expandedContract, setExpandedContract] = useState<string | null>(null)

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

  const fetchContracts = useCallback(async () => {
    if (!caseId) return
    try {
      const res = await fetch(`/api/client/claims/${caseId}/contracts`)
      if (res.ok) {
        const data = await res.json()
        setContracts(data.contracts || [])
      }
    } catch { /* silent */ }
  }, [caseId])

  useEffect(() => {
    if (caseId) fetchContracts()
  }, [caseId, fetchContracts])

  const handleSign = async (jobId: string) => {
    if (!caseId || !consent[jobId]) return
    setSigningJob(jobId)
    try {
      const res = await fetch(`/api/client/claims/${caseId}/contracts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, consent: true }),
      })
      if (!res.ok) throw new Error('Podpis selhal')
      toast.success('Dokument podepsán')
      fetchContracts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setSigningJob(null)
    }
  }

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

      {/* Contracts to sign */}
      {contracts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Dokumenty k podpisu</h2>
          <div className="space-y-3">
            {contracts.map((job: any) => {
              const isSigned = job.status === 'signed'
              const isDraft = job.status === 'draft'
              const isPending = job.status === 'pending' || isDraft
              return (
                <Card key={job.id} className={isSigned ? 'border-green-200 dark:border-green-800' : isPending ? 'border-amber-200 dark:border-amber-800' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {job.document_type === 'power_of_attorney' ? (
                          <PenTool className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ScrollText className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">{job.document_name}</span>
                      </div>
                      <Badge className={
                        isSigned ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      }>
                        {isSigned ? 'Podepsáno' : 'Čeká na podpis'}
                      </Badge>
                    </div>

                    {/* Expandable document text */}
                    {job.note && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedContract(expandedContract === job.id ? null : job.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          {expandedContract === job.id ? 'Skrýt text smlouvy' : 'Zobrazit text smlouvy'}
                        </button>
                        {expandedContract === job.id && (
                          <pre className="mt-2 p-3 bg-muted rounded text-xs whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                            {job.note}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* Consent + Sign button */}
                    {!isSigned && (
                      <div className="mt-4 space-y-3 border-t pt-3">
                        <label className="flex items-start gap-2 cursor-pointer select-none">
                          <button
                            onClick={() => setConsent(prev => ({ ...prev, [job.id]: !prev[job.id] }))}
                            className="mt-0.5"
                          >
                            {consent[job.id] ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <span className="text-xs text-muted-foreground">
                            Souhlasím s obsahem tohoto dokumentu a potvrzuji, že jsem oprávněn/a jednat
                            za výše uvedenou společnost. Beru na vědomí zpracování osobních údajů dle GDPR.
                          </span>
                        </label>
                        <Button
                          size="sm"
                          onClick={() => handleSign(job.id)}
                          disabled={!consent[job.id] || signingJob === job.id}
                        >
                          {signingJob === job.id ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="mr-2 h-3.5 w-3.5" />
                          )}
                          Podepsat
                        </Button>
                      </div>
                    )}

                    {isSigned && (
                      <p className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Podepsáno {job.signed_at ? new Date(job.signed_at).toLocaleDateString('cs-CZ') : ''}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
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
