'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  AlertTriangle,
  RefreshCw,
  Crown,
  Loader2,
  ExternalLink,
  TrendingUp,
  Info,
  CalendarDays,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import { usePlanFeatures } from '@/lib/hooks/use-plan-features'
import type { CrisisPlan, CrisisPlanRisk, CrisisIndustry, EmployeeRange } from '@/lib/types/crisis'
import {
  industryLabel,
  rpnColor,
  rpnLabel,
  rpnLevel,
  CRISIS_CHECKLIST_ITEMS,
} from '@/lib/types/crisis'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DraftFormData {
  industry: CrisisIndustry
  employee_count_range: EmployeeRange
  annual_revenue_range: string
  key_dependencies: string
  biggest_fear: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const INDUSTRIES: CrisisIndustry[] = [
  'manufacturing', 'services', 'it_saas', 'retail',
  'construction', 'logistics', 'healthcare', 'agriculture', 'other',
]

const EMPLOYEE_RANGES: EmployeeRange[] = ['1-5', '6-20', '21-50', '51-200', '200+']

const PLAN_STATUS_LABELS: Record<string, string> = {
  draft: 'Rozpracovaný',
  generated: 'Vygenerovaný',
  reviewed: 'Zkontrolovaný',
  archived: 'Archivovaný',
}

const PLAN_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  generated: 'default',
  reviewed: 'secondary',
  archived: 'outline',
}

// ─── Helper: RPN progress bar ─────────────────────────────────────────────────

function RpnBar({ rpn }: { rpn: number }) {
  const pct = Math.min(100, Math.round((rpn / 1000) * 100))
  const level = rpnLevel(rpn)
  const barColor: Record<string, string> = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor[level]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums min-w-[36px] text-right">
        {rpn}
      </span>
    </div>
  )
}

// ─── Helper: Score slider display ────────────────────────────────────────────

function ScoreDisplay({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground min-w-[90px]">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-sm ${
              i < value
                ? 'bg-blue-500 dark:bg-blue-400'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <span className="text-muted-foreground font-mono">{value}/{max}</span>
    </div>
  )
}

// ─── Risk Card ────────────────────────────────────────────────────────────────

function RiskCard({ risk }: { risk: CrisisPlanRisk }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {risk.name}
            </span>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
              {risk.category}
            </Badge>
            <Badge className={`text-[10px] h-5 px-1.5 font-semibold ${rpnColor(risk.rpn)}`}>
              RPN {risk.rpn} · {rpnLabel(risk.rpn)}
            </Badge>
          </div>
          <RpnBar rpn={risk.rpn} />
        </div>
        <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
          {/* Description */}
          {risk.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{risk.description}</p>
          )}

          {/* Score visualization */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Hodnocení rizika
            </p>
            <ScoreDisplay label="Závažnost" value={risk.severity} />
            <ScoreDisplay label="Pravděpodobnost" value={risk.occurrence} />
            <ScoreDisplay label="Detekovatelnost" value={risk.detection} />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {risk.action_immediate && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Okamžitá opatření
                </p>
                <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                  {risk.action_immediate}
                </p>
              </div>
            )}
            {risk.action_preventive && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Preventivní opatření
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  {risk.action_preventive}
                </p>
              </div>
            )}
          </div>

          {/* Early warning */}
          {risk.early_warning && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Varovné signály
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                {risk.early_warning}
              </p>
            </div>
          )}

          {/* Alert levels */}
          {(risk.level_yellow || risk.level_red) && (
            <div className="space-y-2">
              {risk.level_yellow && (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-3">
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                    Žlutý alert
                  </p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
                    {risk.level_yellow}
                  </p>
                </div>
              )}
              {risk.level_red && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                    Červený alert
                  </p>
                  <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                    {risk.level_red}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Checklist ────────────────────────────────────────────────────────────────

function InsuranceChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-orange-500" />
          Co dělat hned po pojistné události
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Postupujte krok za krokem — čím dřív začnete, tím lépe.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {CRISIS_CHECKLIST_ITEMS.map((item, idx) => {
            const isChecked = checked.has(item.id)
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors ${
                  isChecked
                    ? 'bg-green-50 dark:bg-green-950/30'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isChecked ? (
                    <CheckSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground min-w-[18px]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className={`text-sm font-medium transition-colors ${
                      isChecked ? 'line-through text-muted-foreground' : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.title}
                    </p>
                  </div>
                  <p className={`text-xs mt-0.5 ml-6 leading-relaxed transition-colors ${
                    isChecked ? 'text-muted-foreground/60' : 'text-muted-foreground'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-4 pt-4 border-t">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/claims/new">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Nahlásit pojistnou událost
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Upgrade gate ─────────────────────────────────────────────────────────────

function UpgradeGate() {
  return (
    <Card className="rounded-2xl border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardContent className="py-8 px-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full">
            <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
          Krizový plán vyžaduje tarif Professional
        </h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
          Tato funkce je dostupná od tarifu Professional. Upgradujte svůj tarif a získejte
          přístup ke krizovému plánu s AI analýzou rizik.
        </p>
        <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
          <Link href="/client/subscription">
            <Crown className="mr-1.5 h-4 w-4" />
            Upgradovat tarif
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientCrisisPage() {
  const { planTier, loading: planLoading } = usePlanFeatures()
  const [localStatus, setLocalStatus] = useState<'intro' | 'draft' | 'generated' | null>(null)
  const [generating, setGenerating] = useState(false)
  const [markingReviewed, setMarkingReviewed] = useState(false)

  // Form state for draft
  const [form, setForm] = useState<DraftFormData>({
    industry: 'services',
    employee_count_range: '1-5',
    annual_revenue_range: '',
    key_dependencies: '',
    biggest_fear: '',
  })

  // Fetch existing plan
  const { data: planData, loading: planDataLoading, refresh: refreshPlan } = useCachedFetch<{
    plan: CrisisPlan | null
  }>(
    'crisis-plan',
    () => fetch('/api/client/crisis-plan').then(r => r.json())
  )

  const plan = planData?.plan ?? null

  // Derive effective status
  const effectiveStatus = (() => {
    if (localStatus) return localStatus
    if (!plan) return 'intro'
    return plan.status
  })()

  const isProfessional = planTier === 'professional' || planTier === 'enterprise'

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleStartDraft = async () => {
    try {
      const res = await fetch('/api/client/crisis-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      })
      if (res.ok) {
        refreshPlan()
        setLocalStatus('draft')
      }
    } catch {
      // silent — user can still see the form
      setLocalStatus('draft')
    }
  }

  const handleGenerate = async () => {
    if (!isProfessional) return
    setGenerating(true)
    try {
      const body: Record<string, string> = {
        industry: form.industry,
        employee_count_range: form.employee_count_range,
      }
      if (form.annual_revenue_range.trim()) body.annual_revenue_range = form.annual_revenue_range.trim()
      if (form.key_dependencies.trim()) body.key_dependencies = form.key_dependencies.trim()
      if (form.biggest_fear.trim()) body.biggest_fear = form.biggest_fear.trim()

      const res = await fetch('/api/client/crisis-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        await refreshPlan()
        setLocalStatus('generated')
      }
    } catch {
      // keep draft state on error
    } finally {
      setGenerating(false)
    }
  }

  const handleMarkReviewed = async () => {
    if (!plan) return
    setMarkingReviewed(true)
    try {
      await fetch(`/api/client/crisis-plan/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'reviewed' }),
      })
      await refreshPlan()
    } catch {
      // silent
    } finally {
      setMarkingReviewed(false)
    }
  }

  const handleRegenerate = () => {
    setLocalStatus('draft')
    if (plan) {
      setForm({
        industry: plan.industry ?? 'services',
        employee_count_range: plan.employee_count_range ?? '1-5',
        annual_revenue_range: plan.annual_revenue_range ?? '',
        key_dependencies: plan.key_dependencies ?? '',
        biggest_fear: plan.biggest_fear ?? '',
      })
    }
  }

  const updateForm = useCallback((patch: Partial<DraftFormData>) => {
    setForm(prev => ({ ...prev, ...patch }))
  }, [])

  // ─── Loading state ───────────────────────────────────────────────────────────

  if (planLoading || planDataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // ─── Compute risk stats ──────────────────────────────────────────────────────

  const risks: CrisisPlanRisk[] = plan?.risks ?? []
  const criticalCount = risks.filter(r => r.rpn >= 200).length
  const highCount = risks.filter(r => r.rpn >= 100 && r.rpn < 200).length
  const mediumCount = risks.filter(r => r.rpn >= 50 && r.rpn < 100).length

  const sortedRisks = [...risks].sort((a, b) => b.rpn - a.rpn)

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="h-7 w-7 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          Krizový plán
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Připravenost na nečekané situace — analýza rizik vaší firmy
        </p>
      </div>

      {/* ──────────── SCENARIO A: Intro ──────────── */}
      {effectiveStatus === 'intro' && (
        <Card className="rounded-2xl">
          <CardContent className="py-10 px-6 text-center">
            <div className="flex items-center justify-center mb-5">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl">
                <ShieldAlert className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white mb-2">
              Krizový plán vaší firmy
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              Připravte se na nečekané situace. Na základě údajů o vaší firmě vám AI navrhne
              krizový plán s konkrétními kroky a hodnocením rizik (FMEA metodika).
            </p>

            {!isProfessional ? (
              <div className="space-y-4">
                <UpgradeGate />
              </div>
            ) : (
              <Button
                onClick={handleStartDraft}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                size="lg"
              >
                Začít
              </Button>
            )}

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground">
                Zatím nemáte krizový plán?{' '}
                <button
                  className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:no-underline"
                  onClick={() => {
                    document.getElementById('insurance-checklist')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Co dělat po pojistné události?
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ──────────── SCENARIO B: Draft form ──────────── */}
      {(effectiveStatus === 'draft') && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Doplňte informace o vaší firmě
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Čím více toho vyplníte, tím přesnější krizový plán AI vytvoří.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">Obor podnikání *</Label>
              <Select
                value={form.industry}
                onValueChange={v => updateForm({ industry: v as CrisisIndustry })}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Vyberte obor..." />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(ind => (
                    <SelectItem key={ind} value={ind}>
                      {industryLabel(ind)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee count */}
            <div className="space-y-2">
              <Label htmlFor="employee-range">Počet zaměstnanců *</Label>
              <Select
                value={form.employee_count_range}
                onValueChange={v => updateForm({ employee_count_range: v as EmployeeRange })}
              >
                <SelectTrigger id="employee-range">
                  <SelectValue placeholder="Vyberte rozsah..." />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_RANGES.map(r => (
                    <SelectItem key={r} value={r}>
                      {r} zaměstnanců
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Annual revenue */}
            <div className="space-y-2">
              <Label htmlFor="annual-revenue">
                Přibližný roční obrat{' '}
                <span className="text-xs font-normal text-muted-foreground">(volitelné)</span>
              </Label>
              <Input
                id="annual-revenue"
                value={form.annual_revenue_range}
                onChange={e => updateForm({ annual_revenue_range: e.target.value })}
                placeholder="např. 5 mil. Kč"
              />
            </div>

            {/* Key dependencies */}
            <div className="space-y-2">
              <Label htmlFor="key-dependencies">
                Na čem firma nejvíc závisí{' '}
                <span className="text-xs font-normal text-muted-foreground">(volitelné)</span>
              </Label>
              <Textarea
                id="key-dependencies"
                value={form.key_dependencies}
                onChange={e => updateForm({ key_dependencies: e.target.value })}
                placeholder="např. dodávky od jednoho klíčového dodavatele, e-shop, hlavní zákazník..."
                rows={3}
              />
            </div>

            {/* Biggest fear */}
            <div className="space-y-2">
              <Label htmlFor="biggest-fear">
                Čeho se nejvíc obáváte{' '}
                <span className="text-xs font-normal text-muted-foreground">(volitelné)</span>
              </Label>
              <Textarea
                id="biggest-fear"
                value={form.biggest_fear}
                onChange={e => updateForm({ biggest_fear: e.target.value })}
                placeholder="např. výpadek IT systémů, odchod klíčového zaměstnance..."
                rows={3}
              />
            </div>

            {/* Generate button or upgrade CTA */}
            {isProfessional ? (
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI analyzuje vaši firmu a připravuje krizový plán...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Nechat AI navrhnout plán
                  </>
                )}
              </Button>
            ) : (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
                <Crown className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 text-xs">
                      Professional
                    </Badge>
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      Tato funkce vyžaduje tarif Professional
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    AI generace krizového plánu je dostupná od tarifu Professional nebo vyššího.
                  </p>
                  <Link
                    href="/client/subscription"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Upgrade tarifu →
                  </Link>
                </div>
              </div>
            )}

            {generating && (
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    AI analyzuje vaši firmu...
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Příprava krizového plánu obvykle trvá 10–15 sekund.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ──────────── SCENARIO C: Generated plan ──────────── */}
      {(effectiveStatus === 'generated' || effectiveStatus === 'reviewed') && plan && (
        <div className="space-y-5">
          {/* Plan header */}
          <Card className="rounded-2xl">
            <CardContent className="py-4 px-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Krizový plán — {industryLabel(plan.industry)}
                    </h2>
                    <Badge variant={PLAN_STATUS_VARIANT[plan.status] ?? 'outline'}>
                      {PLAN_STATUS_LABELS[plan.status] ?? plan.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {plan.plan_generated_at && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        Vygenerováno {new Date(plan.plan_generated_at).toLocaleDateString('cs-CZ', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                    )}
                    {plan.employee_count_range && (
                      <span>{plan.employee_count_range} zaměstnanců</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={markingReviewed}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Regenerovat
                  </Button>
                  {plan.status !== 'reviewed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkReviewed}
                      disabled={markingReviewed}
                    >
                      {markingReviewed ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Označit jako zkontrolovaný
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk summary */}
          {risks.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="rounded-xl">
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">Celkem rizik</p>
                  <p className="text-2xl font-bold font-display text-gray-900 dark:text-white">
                    {risks.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-red-200 dark:border-red-800">
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">Kritická (200+)</p>
                  <p className="text-2xl font-bold font-display text-red-600 dark:text-red-400">
                    {criticalCount}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-orange-200 dark:border-orange-800">
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">Vysoká (100–199)</p>
                  <p className="text-2xl font-bold font-display text-orange-600 dark:text-orange-400">
                    {highCount}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-yellow-200 dark:border-yellow-800">
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">Střední (50–99)</p>
                  <p className="text-2xl font-bold font-display text-yellow-600 dark:text-yellow-400">
                    {mediumCount}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Risk cards */}
          {sortedRisks.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Identifikovaná rizika
                <span className="text-muted-foreground font-normal">
                  — seřazena dle RPN (od největšího)
                </span>
              </h3>
              {sortedRisks.map(risk => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Plán byl vygenerován, ale rizika zatím nejsou k dispozici. Zkuste regenerovat plán.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleRegenerate}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Regenerovat plán
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ──────────── Checklist — always visible ──────────── */}
      <div id="insurance-checklist">
        <InsuranceChecklist />
      </div>
    </div>
  )
}
