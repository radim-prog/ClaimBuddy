'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  CreditCard,
  Users,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Plus,
  Play,
  Pause,
  XCircle,
  Pencil,
  RefreshCw,
  Loader2,
  Banknote,
  Clock,
  ArrowRight,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

// ── Types ────────────────────────────────────────────────────────────────

interface BillingDashboard {
  totalClients: number
  totalMRR: number
  currentPeriod: string
  paidThisMonth: number
  paidCount: number
  overdueCount: number
  overdueAmount: number
  latestPayout: PayoutRecord | null
  platformFeePct: number
}

interface BillingConfig {
  id: string
  company_id: string
  company_name: string
  monthly_fee: number
  status: 'draft' | 'active' | 'paused' | 'cancelled' | 'suspended'
  stripe_subscription_id: string | null
  platform_fee_pct: number
  activated_at: string | null
  cancelled_at: string | null
  notes: string | null
}

interface PayoutRecord {
  id: string
  period: string
  total_collected: number
  total_fee: number
  total_payout: number
  status: 'pending' | 'processing' | 'paid'
  paid_at: string | null
  payment_reference: string | null
}

interface Company {
  id: string
  name: string
}

// ── Helpers ──────────────────────────────────────────────────────────────

const fmtCZK = (amount: number) =>
  `${new Intl.NumberFormat('cs-CZ').format(amount)} Kc`

const statusConfig: Record<BillingConfig['status'], { label: string; color: string }> = {
  draft: { label: 'Koncept', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  active: { label: 'Aktivni', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  paused: { label: 'Pozastaveno', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  cancelled: { label: 'Zruseno', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  suspended: { label: 'Suspendovano', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse' },
}

const payoutStatusConfig: Record<PayoutRecord['status'], { label: string; color: string }> = {
  pending: { label: 'Ceka', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  processing: { label: 'Zpracovava se', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  paid: { label: 'Vyplaceno', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

// ── Skeleton ─────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-4 w-24 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-muted rounded mb-1" />
            <div className="h-3 w-20 bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-5 w-20 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded" />
          <div className="ml-auto h-8 w-24 bg-muted rounded" />
        </div>
      ))}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────

export default function BillingPage() {
  const { userRole, loading: authLoading } = useAccountantUser()
  const [dashboard, setDashboard] = useState<BillingDashboard | null>(null)
  const [configs, setConfigs] = useState<BillingConfig[]>([])
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [payoutsLoading, setPayoutsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<BillingConfig | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Add form state
  const [addCompanyId, setAddCompanyId] = useState('')
  const [addMonthlyFee, setAddMonthlyFee] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)

  // Edit form state
  const [editFee, setEditFee] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // ── Data fetching ──────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [billingRes, companiesRes] = await Promise.all([
        fetch('/api/accountant/billing'),
        fetch('/api/accountant/companies'),
      ])

      if (!billingRes.ok) throw new Error('Nepodařilo se načíst data fakturace')

      const billingData = await billingRes.json()
      setDashboard(billingData.dashboard)
      setConfigs(billingData.configs || [])

      if (companiesRes.ok) {
        const compData = await companiesRes.json()
        setCompanies(compData.companies || compData || [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPayouts = useCallback(async () => {
    setPayoutsLoading(true)
    try {
      const res = await fetch('/api/accountant/billing/payouts')
      if (!res.ok) throw new Error('Nepodařilo se načíst výplaty')
      const data = await res.json()
      setPayouts(data.payouts || [])
    } catch {
      toast.error('Chyba při načítání výplat')
    } finally {
      setPayoutsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // ── Actions ────────────────────────────────────────────────────────────

  const handleAction = async (configId: string, action: string) => {
    setActionLoading(configId)
    try {
      const res = await fetch(`/api/accountant/billing/${configId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Akce se nezdařila')
      }
      toast.success(
        action === 'activate' ? 'Fakturace aktivována' :
        action === 'pause' ? 'Fakturace pozastavena' :
        action === 'cancel' ? 'Fakturace zrušena' :
        'Akce provedena'
      )
      fetchDashboard()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddSubmit = async () => {
    if (!addCompanyId || !addMonthlyFee) {
      toast.error('Vyplňte klienta a měsíční poplatek')
      return
    }
    setAddSubmitting(true)
    try {
      const res = await fetch('/api/accountant/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: addCompanyId,
          monthly_fee: Number(addMonthlyFee),
          notes: addNotes || undefined,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Nepodařilo se vytvořit')
      }
      toast.success('Fakturace klienta přidána')
      setAddDialogOpen(false)
      setAddCompanyId('')
      setAddMonthlyFee('')
      setAddNotes('')
      fetchDashboard()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setAddSubmitting(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!editingConfig || !editFee) return
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/accountant/billing/${editingConfig.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          monthly_fee: Number(editFee),
          notes: editNotes || undefined,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Nepodařilo se upravit')
      }
      toast.success('Měsíční poplatek upraven')
      setEditDialogOpen(false)
      setEditingConfig(null)
      fetchDashboard()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setEditSubmitting(false)
    }
  }

  const openEditDialog = (config: BillingConfig) => {
    setEditingConfig(config)
    setEditFee(String(config.monthly_fee))
    setEditNotes(config.notes || '')
    setEditDialogOpen(true)
  }

  // Companies available for adding (not yet having a billing config)
  const configuredCompanyIds = new Set(configs.map(c => c.company_id))
  const availableCompanies = companies.filter(c => !configuredCompanyIds.has(c.id))

  // ── Auth guard ─────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nedostatecna opravneni</h2>
        <p className="text-gray-500 dark:text-gray-400">Tato sekce je dostupna pouze pro administratory.</p>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-lg font-medium text-foreground">{error}</p>
        <Button onClick={fetchDashboard} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Zkusit znovu
        </Button>
      </div>
    )
  }

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <KpiSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">
              Sprava fakturace klientu
            </h1>
            <p className="text-sm text-muted-foreground">
              Nastavte mesicni platby a sledujte inkaso
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktivni klienti
              </CardTitle>
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalClients}</div>
              <p className="text-xs text-muted-foreground mt-1">s aktivni fakturaci</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmtCZK(dashboard.totalMRR)}</div>
              <p className="text-xs text-muted-foreground mt-1">mesicni opakovany prijem</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Zaplaceno tento mesic
              </CardTitle>
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmtCZK(dashboard.paidThisMonth)}</div>
              <p className="text-xs text-muted-foreground mt-1">{dashboard.paidCount} plateb</p>
            </CardContent>
          </Card>

          <Card className={dashboard.overdueCount > 0 ? 'border-red-200 dark:border-red-900/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Po splatnosti</CardTitle>
              <div className={`p-1.5 rounded-lg ${dashboard.overdueCount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <AlertTriangle className={`h-4 w-4 ${dashboard.overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${dashboard.overdueCount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                {dashboard.overdueCount > 0 ? fmtCZK(dashboard.overdueAmount) : '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboard.overdueCount > 0 ? `${dashboard.overdueCount} neuhrazenych` : 'Zadne nedoplatky'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="clients" onValueChange={(v) => { if (v === 'payouts') fetchPayouts() }}>
        <TabsList>
          <TabsTrigger value="clients">Klienti</TabsTrigger>
          <TabsTrigger value="payouts">Vyplaty</TabsTrigger>
        </TabsList>

        {/* ── Tab: Clients ──────────────────────────────────────────────── */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {configs.length} klientu s nastavenou fakturaci
            </p>
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Pridat klienta
            </Button>
          </div>

          {configs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-medium text-foreground mb-1">Zatim zadni klienti</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Pridejte prvniho klienta a nastavte mu mesicni fakturaci.
                </p>
                <Button onClick={() => setAddDialogOpen(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Pridat klienta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_100px_180px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Klient</span>
                <span>Poplatek</span>
                <span>Stav</span>
                <span>Platf. %</span>
                <span className="text-right">Akce</span>
              </div>

              {configs.map(config => {
                const st = statusConfig[config.status]
                const isLoading = actionLoading === config.id

                return (
                  <Card key={config.id} className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_100px_100px_180px] gap-3 md:gap-4 items-center p-4">
                      <div>
                        <p className="font-medium text-foreground">{config.company_name}</p>
                        {config.activated_at && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            od {new Date(config.activated_at).toLocaleDateString('cs-CZ')}
                          </p>
                        )}
                        {config.cancelled_at && (
                          <p className="text-xs text-red-500 mt-0.5">
                            zruseno {new Date(config.cancelled_at).toLocaleDateString('cs-CZ')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold md:hidden text-muted-foreground">Poplatek: </span>
                        <span className="text-sm font-semibold">{fmtCZK(config.monthly_fee)}</span>
                        <span className="text-xs text-muted-foreground">/mes</span>
                      </div>

                      <div>
                        <Badge className={`${st.color} border-0`}>{st.label}</Badge>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <span className="md:hidden font-medium text-foreground">Platforma: </span>
                        {config.platform_fee_pct}%
                      </div>

                      <div className="flex items-center gap-1.5 md:justify-end flex-wrap">
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            {config.status === 'draft' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                onClick={() => handleAction(config.id, 'activate')}
                              >
                                <Play className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Aktivovat</span>
                              </Button>
                            )}
                            {config.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                onClick={() => handleAction(config.id, 'pause')}
                              >
                                <Pause className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Pozastavit</span>
                              </Button>
                            )}
                            {config.status === 'paused' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                onClick={() => handleAction(config.id, 'activate')}
                              >
                                <Play className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Obnovit</span>
                              </Button>
                            )}
                            {(config.status === 'active' || config.status === 'paused' || config.status === 'draft') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => {
                                  if (confirm(`Opravdu chcete zrusit fakturaci pro ${config.company_name}?`)) {
                                    handleAction(config.id, 'cancel')
                                  }
                                }}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Zrusit</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => openEditDialog(config)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Upravit</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {config.notes && (
                      <div className="px-4 pb-3 -mt-1">
                        <p className="text-xs text-muted-foreground italic">{config.notes}</p>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Payouts ──────────────────────────────────────────────── */}
        <TabsContent value="payouts" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Prehled vyplat po jednotlivych obdobich
            </p>
            <Button onClick={fetchPayouts} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Obnovit
            </Button>
          </div>

          {payoutsLoading ? (
            <TableSkeleton />
          ) : payouts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Banknote className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-medium text-foreground mb-1">Zatim zadne vyplaty</p>
                <p className="text-sm text-muted-foreground">
                  Vyplaty se vytvori automaticky po inkasu plateb od klientu.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="hidden md:grid md:grid-cols-[140px_1fr_1fr_1fr_120px_140px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Obdobi</span>
                <span>Inkasovano</span>
                <span>Poplatek platformy</span>
                <span>K vyplate</span>
                <span>Stav</span>
                <span>Reference</span>
              </div>

              {payouts.map(payout => {
                const ps = payoutStatusConfig[payout.status]
                return (
                  <Card key={payout.id}>
                    <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_1fr_1fr_120px_140px] gap-3 md:gap-4 items-center p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground md:hidden" />
                        <span className="text-sm font-semibold">{payout.period}</span>
                      </div>

                      <div>
                        <span className="text-sm md:hidden text-muted-foreground">Inkasovano: </span>
                        <span className="text-sm font-medium">{fmtCZK(payout.total_collected)}</span>
                      </div>

                      <div>
                        <span className="text-sm md:hidden text-muted-foreground">Poplatek: </span>
                        <span className="text-sm text-muted-foreground">-{fmtCZK(payout.total_fee)}</span>
                      </div>

                      <div>
                        <span className="text-sm md:hidden text-muted-foreground">K vyplate: </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {fmtCZK(payout.total_payout)}
                        </span>
                      </div>

                      <div>
                        <Badge className={`${ps.color} border-0`}>{ps.label}</Badge>
                      </div>

                      <div className="text-sm text-muted-foreground truncate">
                        {payout.payment_reference || <span className="text-xs italic">-</span>}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Client Dialog ─────────────────────────────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pridat klienta do fakturace</DialogTitle>
            <DialogDescription>
              Nastavte mesicni poplatek pro klienta. Fakturace bude ve stavu &quot;Koncept&quot; dokud ji neaktivujete.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-company">Klient</Label>
              <Select value={addCompanyId} onValueChange={setAddCompanyId}>
                <SelectTrigger id="add-company">
                  <SelectValue placeholder="Vyberte klienta" />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      Vsichni klienti jsou pridani
                    </SelectItem>
                  ) : (
                    availableCompanies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-fee">Mesicni poplatek (Kc)</Label>
              <Input
                id="add-fee"
                type="number"
                min={0}
                step={100}
                placeholder="napr. 5000"
                value={addMonthlyFee}
                onChange={e => setAddMonthlyFee(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-notes">Poznamky (volitelne)</Label>
              <Textarea
                id="add-notes"
                placeholder="Interni poznamky k fakturaci..."
                value={addNotes}
                onChange={e => setAddNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Zrusit</Button>
            <Button
              onClick={handleAddSubmit}
              disabled={addSubmitting || !addCompanyId || !addMonthlyFee}
              className="gap-2"
            >
              {addSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Pridat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Fee Dialog ───────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upravit poplatek</DialogTitle>
            <DialogDescription>
              {editingConfig?.company_name} &mdash; aktualni poplatek {editingConfig ? fmtCZK(editingConfig.monthly_fee) : ''}/mes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-fee">Novy mesicni poplatek (Kc)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  {editingConfig ? fmtCZK(editingConfig.monthly_fee) : ''}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-fee"
                  type="number"
                  min={0}
                  step={100}
                  value={editFee}
                  onChange={e => setEditFee(e.target.value)}
                  className="max-w-[160px]"
                />
                <span className="text-sm text-muted-foreground">Kc</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Poznamky</Label>
              <Textarea
                id="edit-notes"
                placeholder="Duvod zmeny, poznamky..."
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Zrusit</Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editSubmitting || !editFee}
              className="gap-2"
            >
              {editSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Ulozit zmeny
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
