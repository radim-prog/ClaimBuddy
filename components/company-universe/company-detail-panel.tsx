'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Building2, CreditCard, MessageSquare, Heart, MapPin, Hash, FileText, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface CompanyDetail {
  id: string
  name: string
  ico: string
  dic: string | null
  vat_payer: boolean
  vat_period: string | null
  legal_form: string | null
  status: string
  managing_director: string | null
  address: { street?: string; city?: string; zip?: string } | null
  billing_settings: { monthly_fee?: number } | null
  reliability_score: number
  health_score?: number | null
  health_grade?: string | null
}

interface CompanyNote {
  id: string
  author_name: string
  content: string
  created_at: string
}

interface CompanyDetailPanelProps {
  companyId: string | null
  onClose: () => void
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  B: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  C: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  D: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function CompanyDetailPanel({ companyId, onClose }: CompanyDetailPanelProps) {
  const [company, setCompany] = useState<CompanyDetail | null>(null)
  const [notes, setNotes] = useState<CompanyNote[]>([])
  const [loading, setLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<{ paid: number; total: number } | null>(null)

  const fetchCompany = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const [companyRes, notesRes, paymentsRes] = await Promise.all([
        fetch(`/api/accountant/companies/${id}`),
        fetch(`/api/accountant/companies/${id}/notes`).catch(() => null),
        fetch(`/api/accountant/companies/${id}/payments?year=${new Date().getFullYear()}`).catch(() => null),
      ])

      if (companyRes.ok) {
        const data = await companyRes.json()
        setCompany(data.company)
      }

      if (notesRes?.ok) {
        const data = await notesRes.json()
        setNotes(data.notes || [])
      }

      if (paymentsRes?.ok) {
        const data = await paymentsRes.json()
        const payments = data.payments || []
        const paid = payments.filter((p: { paid: boolean }) => p.paid).length
        setPaymentStatus({ paid, total: payments.length || 12 })
      }
    } catch (err) {
      console.error('[CompanyDetail] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (companyId) {
      fetchCompany(companyId)
    } else {
      setCompany(null)
      setNotes([])
      setPaymentStatus(null)
    }
  }, [companyId, fetchCompany])

  const handleAddNote = async () => {
    if (!noteText.trim() || !companyId) return
    setSavingNote(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteText.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotes(prev => [data.note, ...prev])
        setNoteText('')
      }
    } catch (err) {
      console.error('[CompanyDetail] Note save error:', err)
    } finally {
      setSavingNote(false)
    }
  }

  if (!companyId) return null

  const monthlyFee = company?.billing_settings?.monthly_fee || 0

  return (
    <div
      className={cn(
        'fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-background border-l border-border shadow-xl z-50',
        'animate-in slide-in-from-right duration-300',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold font-display truncate">{company?.name || 'Nacitani...'}</h2>
            {company?.ico && (
              <p className="text-xs text-muted-foreground font-mono">{company.ico}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : company ? (
        <Tabs defaultValue="overview" className="flex flex-col h-[calc(100%-57px)]">
          <TabsList className="mx-4 mt-3 w-auto">
            <TabsTrigger value="overview" className="text-xs">Prehled</TabsTrigger>
            <TabsTrigger value="finance" className="text-xs">Finance</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Poznamky</TabsTrigger>
          </TabsList>

          {/* === OVERVIEW === */}
          <TabsContent value="overview" className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-4 mt-2">
              {/* Health Score */}
              {company.health_grade && (
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Health Score</span>
                  <Badge className={cn('ml-auto', GRADE_COLORS[company.health_grade] || '')}>
                    {company.health_grade} {company.health_score !== null && company.health_score !== undefined ? `(${company.health_score})` : ''}
                  </Badge>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={company.status === 'active' ? 'default' : 'secondary'} className="ml-auto">
                  {company.status === 'active' ? 'Aktivni' : company.status === 'inactive' ? 'Neaktivni' : company.status}
                </Badge>
              </div>

              {/* Legal form */}
              {company.legal_form && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Pravni forma</span>
                  <span className="ml-auto text-sm font-medium">{company.legal_form}</span>
                </div>
              )}

              {/* DIC */}
              {company.dic && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">DIC</span>
                  <span className="ml-auto text-sm font-mono">{company.dic}</span>
                </div>
              )}

              {/* VAT */}
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">DPH</span>
                <Badge variant={company.vat_payer ? 'default' : 'secondary'} className="ml-auto">
                  {company.vat_payer ? `Platce${company.vat_period ? ` (${company.vat_period})` : ''}` : 'Neplatce'}
                </Badge>
              </div>

              {/* Managing director */}
              {company.managing_director && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Jednatel</span>
                  <span className="ml-auto text-sm font-medium">{company.managing_director}</span>
                </div>
              )}

              {/* Address */}
              {company.address && (company.address.street || company.address.city) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm text-muted-foreground">Adresa</span>
                  <span className="ml-auto text-sm text-right">
                    {[company.address.street, company.address.city, company.address.zip].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* === FINANCE === */}
          <TabsContent value="finance" className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-4 mt-2">
              {/* MRR */}
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground mb-1">Mesicni poplatek (MRR)</div>
                <div className="text-2xl font-bold font-display">
                  {monthlyFee > 0 ? `${monthlyFee.toLocaleString('cs-CZ')} Kc` : 'Nenastaveno'}
                </div>
                {monthlyFee > 0 && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {(monthlyFee * 12).toLocaleString('cs-CZ')} Kc/rok
                  </div>
                )}
              </div>

              {/* Payment status */}
              {paymentStatus && (
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground mb-2">Platby {new Date().getFullYear()}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${(paymentStatus.paid / paymentStatus.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {paymentStatus.paid}/{paymentStatus.total}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {paymentStatus.paid === paymentStatus.total
                      ? 'Vse zaplaceno'
                      : `Zbyva ${paymentStatus.total - paymentStatus.paid} plateb`}
                  </div>
                </div>
              )}

              {/* Reliability */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Spolehlivost</span>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-2 h-4 rounded-sm',
                        i < company.reliability_score ? 'bg-blue-500' : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono text-muted-foreground w-6 text-right">
                  {company.reliability_score}
                </span>
              </div>
            </div>
          </TabsContent>

          {/* === NOTES === */}
          <TabsContent value="notes" className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
            {/* New note input */}
            <div className="flex gap-2 mt-2 mb-3">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Pridat poznamku..."
                className="flex-1 min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleAddNote()
                  }
                }}
              />
              <Button
                size="icon"
                className="h-[60px] w-10 flex-shrink-0"
                onClick={handleAddNote}
                disabled={!noteText.trim() || savingNote}
              >
                {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Zadne poznamky</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-xs">{note.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          Firma nenalezena
        </div>
      )}
    </div>
  )
}
