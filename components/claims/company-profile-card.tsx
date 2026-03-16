'use client'

import { useEffect, useState } from 'react'
import { Building2, FileText, FolderOpen, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyProfile {
  company: {
    id: string
    name: string
    ico: string
    dic: string | null
    legal_form: string
    address: { street?: string; city?: string; zip?: string } | null
    email: string | null
    phone: string | null
    status: string
    created_at: string
  }
  claims_summary: {
    total_cases: number
    total_claimed: number
    total_approved: number
    total_paid: number
    by_status: Record<string, number>
  }
  accounting_summary: {
    latest_closure_period: string | null
    latest_closure_status: string | null
    document_count: number
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCzk(amount: number): string {
  return amount.toLocaleString('cs-CZ') + ' Kč'
}

function closureStatusBadge(status: string | null) {
  if (!status) return null
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    open: { label: 'Otevřená', variant: 'secondary' },
    closed: { label: 'Uzavřená', variant: 'default' },
    pending: { label: 'Čeká', variant: 'outline' },
  }
  const cfg = map[status] ?? { label: status, variant: 'outline' as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CompanyProfileCardProps {
  companyId: string
}

export function CompanyProfileCard({ companyId }: CompanyProfileCardProps) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) return

    setLoading(true)
    setError(null)

    fetch(`/api/claims/company-profile?company_id=${encodeURIComponent(companyId)}`)
      .then(async res => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? `HTTP ${res.status}`)
        }
        return res.json()
      })
      .then(json => setProfile(json.profile))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [companyId])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !profile) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error ?? 'Profil firmy se nepodařilo načíst'}
        </CardContent>
      </Card>
    )
  }

  const { company, claims_summary, accounting_summary } = profile

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {company.name}
          {company.status !== 'active' && (
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              {company.status}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Company details */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">IČO</span>
          <span className="font-mono">{company.ico}</span>

          {company.dic && (
            <>
              <span className="text-muted-foreground">DIČ</span>
              <span className="font-mono">{company.dic}</span>
            </>
          )}

          <span className="text-muted-foreground">Forma</span>
          <span>{company.legal_form}</span>

          {company.email && (
            <>
              <span className="text-muted-foreground">E-mail</span>
              <span className="truncate">{company.email}</span>
            </>
          )}

          {company.phone && (
            <>
              <span className="text-muted-foreground">Telefon</span>
              <span>{company.phone}</span>
            </>
          )}
        </div>

        <hr className="border-border" />

        {/* Claims summary */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Pojistné spisy
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">Celkem spisů</span>
            <span className="font-medium">{claims_summary.total_cases}</span>

            <span className="text-muted-foreground">Uplatněno</span>
            <span>{formatCzk(claims_summary.total_claimed)}</span>

            <span className="text-muted-foreground">Schváleno</span>
            <span>{formatCzk(claims_summary.total_approved)}</span>

            <span className="text-muted-foreground">Vyplaceno</span>
            <span className="font-medium text-green-700 dark:text-green-400">
              {formatCzk(claims_summary.total_paid)}
            </span>
          </div>

          {Object.keys(claims_summary.by_status).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(claims_summary.by_status).map(([status, count]) => (
                <Badge key={status} variant="secondary" className="text-xs font-normal">
                  {status}: {count}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <hr className="border-border" />

        {/* Accounting summary */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Účetnictví
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">Uzávěrka</span>
            <span className="flex items-center gap-1.5">
              {accounting_summary.latest_closure_period ?? '—'}
              {closureStatusBadge(accounting_summary.latest_closure_status)}
            </span>

            <span className="text-muted-foreground">Dokumenty</span>
            <span className="flex items-center gap-1">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
              {accounting_summary.document_count}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
