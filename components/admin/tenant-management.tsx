'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  Plus,
  Users,
  Briefcase,
  HardDrive,
  Search,
  ChevronDown,
  ChevronRight,
  Pencil,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  RefreshCw,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────

interface Firm {
  id: string
  name: string
  ico: string | null
  dic: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  logo_url: string | null
  plan_tier: string
  billing_email: string | null
  status: string
  settings: Record<string, unknown> | null
  created_at: string
  updated_at: string | null
  onboarded_at: string | null
  user_count: number
  company_count: number
  drive_connected: boolean
}

interface FirmDetail {
  firm: Firm
  users: { id: string; name: string; email: string; role: string; plan_tier: string; created_at: string }[]
  companies: { id: string; name: string; ico: string | null; status: string; assigned_accountant_id: string | null }[]
}

type StatusFilter = 'all' | 'active' | 'pending' | 'suspended'
type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise'

// ── Helpers ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active:    { label: 'Aktivní',     color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
  pending:   { label: 'Čeká',        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
  suspended: { label: 'Pozastaveno', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: Ban },
  cancelled: { label: 'Zrušeno',     color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
}

const PLAN_CONFIG: Record<string, { label: string; color: string }> = {
  free:         { label: 'Free',         color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  starter:      { label: 'Starter',      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  professional: { label: 'Professional', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  enterprise:   { label: 'Enterprise',   color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
}

const FILTER_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'Vše' },
  { value: 'active',    label: 'Aktivní' },
  { value: 'pending',   label: 'Čeká' },
  { value: 'suspended', label: 'Pozastaveno' },
]

// ── Component ──────────────────────────────────────────────────

export function TenantManagement() {
  const [firms, setFirms] = useState<Firm[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedFirmId, setExpandedFirmId] = useState<string | null>(null)
  const [firmDetail, setFirmDetail] = useState<FirmDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ── Fetch firms ──

  const fetchFirms = useCallback(async () => {
    try {
      const res = await fetch('/api/accountant/admin/tenants')
      if (res.ok) {
        const data = await res.json()
        setFirms(data.firms || [])
      } else {
        toast.error('Nepodařilo se načíst firmy')
      }
    } catch {
      toast.error('Chyba při načítání')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFirms() }, [fetchFirms])

  // ── Fetch detail ──

  const fetchDetail = async (firmId: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/accountant/admin/tenants/${firmId}`)
      if (res.ok) {
        const data = await res.json()
        setFirmDetail(data)
      }
    } catch {
      toast.error('Chyba při načítání detailu')
    } finally {
      setDetailLoading(false)
    }
  }

  const toggleExpand = (firmId: string) => {
    if (expandedFirmId === firmId) {
      setExpandedFirmId(null)
      setFirmDetail(null)
    } else {
      setExpandedFirmId(firmId)
      fetchDetail(firmId)
    }
  }

  // ── Update firm ──

  const updateFirm = async (firmId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/accountant/admin/tenants/${firmId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        toast.success('Uloženo')
        fetchFirms()
        if (expandedFirmId === firmId) fetchDetail(firmId)
      } else {
        toast.error('Nepodařilo se uložit')
      }
    } catch {
      toast.error('Chyba')
    }
  }

  // ── Filtered firms ──

  const filtered = firms.filter(f => {
    if (filter !== 'all' && f.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        f.name.toLowerCase().includes(q) ||
        (f.ico && f.ico.includes(q)) ||
        (f.email && f.email.toLowerCase().includes(q))
      )
    }
    return true
  })

  // ── Stats ──

  const stats = {
    total: firms.length,
    active: firms.filter(f => f.status === 'active').length,
    pending: firms.filter(f => f.status === 'pending').length,
    totalUsers: firms.reduce((s, f) => s + f.user_count, 0),
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Celkem firem" value={stats.total} icon={Building2} />
        <StatCard label="Aktivních" value={stats.active} icon={CheckCircle2} color="text-green-600" />
        <StatCard label="Čeká na aktivaci" value={stats.pending} icon={Clock} color="text-yellow-600" />
        <StatCard label="Uživatelů celkem" value={stats.totalUsers} icon={Users} color="text-blue-600" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  filter === tab.value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {tab.value !== 'all' && (
                  <span className="ml-1 text-[10px] opacity-60">
                    {firms.filter(f => f.status === tab.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Hledat firmu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 w-48 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchFirms}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Obnovit
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nová firma
          </Button>
        </div>
      </div>

      {/* Firms table */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Načítání...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {search || filter !== 'all' ? 'Žádné firmy odpovídající filtru' : 'Zatím žádné firmy'}
        </p>
      ) : (
        <div className="border rounded-lg divide-y dark:divide-gray-800">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_100px_90px_70px_60px_50px_40px] gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 text-xs font-medium text-muted-foreground">
            <span>Firma</span>
            <span>Kontakt</span>
            <span>Tarif</span>
            <span>Stav</span>
            <span className="text-center">Uživatelé</span>
            <span className="text-center">Firmy</span>
            <span className="text-center">Drive</span>
            <span></span>
          </div>

          {/* Rows */}
          {filtered.map(firm => (
            <div key={firm.id}>
              <div
                className="grid grid-cols-[1fr_1fr_100px_90px_70px_60px_50px_40px] gap-2 px-3 py-2.5 items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer transition-colors"
                onClick={() => toggleExpand(firm.id)}
              >
                {/* Firma */}
                <div className="min-w-0">
                  <div className="font-medium truncate">{firm.name}</div>
                  {firm.ico && <div className="text-xs text-muted-foreground">IČO: {firm.ico}</div>}
                </div>

                {/* Kontakt */}
                <div className="min-w-0 text-xs text-muted-foreground">
                  {firm.email && <div className="truncate">{firm.email}</div>}
                  {firm.phone && <div>{firm.phone}</div>}
                </div>

                {/* Tarif */}
                <div>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PLAN_CONFIG[firm.plan_tier]?.color || PLAN_CONFIG.free.color}`}>
                    {PLAN_CONFIG[firm.plan_tier]?.label || firm.plan_tier}
                  </Badge>
                </div>

                {/* Stav */}
                <div>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_CONFIG[firm.status]?.color || STATUS_CONFIG.active.color}`}>
                    {STATUS_CONFIG[firm.status]?.label || firm.status}
                  </Badge>
                </div>

                {/* Uživatelé */}
                <div className="text-center text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    {firm.user_count}
                  </span>
                </div>

                {/* Firmy */}
                <div className="text-center text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                    {firm.company_count}
                  </span>
                </div>

                {/* Drive */}
                <div className="text-center">
                  {firm.drive_connected ? (
                    <HardDrive className="h-3.5 w-3.5 mx-auto text-green-500" />
                  ) : (
                    <HardDrive className="h-3.5 w-3.5 mx-auto text-gray-300 dark:text-gray-600" />
                  )}
                </div>

                {/* Expand */}
                <div className="text-center">
                  {expandedFirmId === firm.id ? (
                    <ChevronDown className="h-4 w-4 mx-auto text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mx-auto text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {expandedFirmId === firm.id && (
                <FirmDetailPanel
                  firm={firm}
                  detail={firmDetail}
                  loading={detailLoading}
                  onUpdate={(updates) => updateFirm(firm.id, updates)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreateFirmModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { setShowCreateModal(false); fetchFirms() }}
      />
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: number
  icon: typeof Building2
  color?: string
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${color || 'text-muted-foreground'}`} />
      </div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  )
}

// ── Firm Detail Panel ──────────────────────────────────────────

function FirmDetailPanel({ firm, detail, loading, onUpdate }: {
  firm: Firm
  detail: FirmDetail | null
  loading: boolean
  onUpdate: (updates: Record<string, unknown>) => void
}) {
  return (
    <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-900/20 border-t dark:border-gray-800">
      {loading ? (
        <p className="text-sm text-muted-foreground py-2">Načítání detailu...</p>
      ) : (
        <div className="space-y-3">
          {/* Quick actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground mr-2">Stav:</span>
            {(['active', 'pending', 'suspended', 'cancelled'] as const).map(status => (
              <button
                key={status}
                onClick={() => onUpdate({ status })}
                disabled={firm.status === status}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  firm.status === status
                    ? STATUS_CONFIG[status].color + ' font-semibold'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {STATUS_CONFIG[status].label}
              </button>
            ))}

            <span className="text-xs font-medium text-muted-foreground ml-4 mr-2">Tarif:</span>
            {(['free', 'starter', 'professional', 'enterprise'] as PlanTier[]).map(tier => (
              <button
                key={tier}
                onClick={() => onUpdate({ plan_tier: tier })}
                disabled={firm.plan_tier === tier}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  firm.plan_tier === tier
                    ? PLAN_CONFIG[tier].color + ' font-semibold'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {PLAN_CONFIG[tier].label}
              </button>
            ))}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground mb-1">Informace</div>
              <div className="space-y-0.5">
                {firm.ico && <div><span className="text-muted-foreground">IČO:</span> {firm.ico}</div>}
                {firm.dic && <div><span className="text-muted-foreground">DIČ:</span> {firm.dic}</div>}
                {firm.email && <div><span className="text-muted-foreground">Email:</span> {firm.email}</div>}
                {firm.phone && <div><span className="text-muted-foreground">Telefon:</span> {firm.phone}</div>}
                {firm.website && <div><span className="text-muted-foreground">Web:</span> {firm.website}</div>}
                {firm.address && <div><span className="text-muted-foreground">Adresa:</span> {firm.address}</div>}
                <div><span className="text-muted-foreground">Vytvořeno:</span> {new Date(firm.created_at).toLocaleDateString('cs-CZ')}</div>
              </div>
            </div>

            {/* Users list */}
            <div>
              <div className="text-muted-foreground mb-1">Uživatelé ({detail?.users?.length || 0})</div>
              {detail?.users && detail.users.length > 0 ? (
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {detail.users.map(u => (
                    <div key={u.id} className="flex items-center justify-between">
                      <span>{u.name || u.email}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground italic">Žádní uživatelé</div>
              )}
            </div>
          </div>

          {/* Companies list */}
          {detail?.companies && detail.companies.length > 0 && (
            <div className="text-xs">
              <div className="text-muted-foreground mb-1">Klientské firmy ({detail.companies.length})</div>
              <div className="flex flex-wrap gap-1">
                {detail.companies.map(c => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px]"
                  >
                    {c.name}
                    {c.ico && <span className="text-muted-foreground">({c.ico})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Create Firm Modal ──────────────────────────────────────────

function CreateFirmModal({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    ico: '',
    dic: '',
    email: '',
    phone: '',
    plan_tier: 'free' as PlanTier,
  })

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Název firmy je povinný')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/accountant/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        toast.success('Firma vytvořena')
        setForm({ name: '', ico: '', dic: '', email: '', phone: '', plan_tier: 'free' })
        onCreated()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba při vytváření')
      }
    } catch {
      toast.error('Chyba')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Nová účetní firma
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Název firmy *</Label>
            <Input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Účetní firma s.r.o."
              className="mt-1 h-8 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">IČO</Label>
              <Input
                value={form.ico}
                onChange={e => setForm(p => ({ ...p, ico: e.target.value }))}
                placeholder="12345678"
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">DIČ</Label>
              <Input
                value={form.dic}
                onChange={e => setForm(p => ({ ...p, dic: e.target.value }))}
                placeholder="CZ12345678"
                className="mt-1 h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="info@firma.cz"
                type="email"
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Telefon</Label>
              <Input
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+420 ..."
                className="mt-1 h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Tarif</Label>
            <Select
              value={form.plan_tier}
              onValueChange={v => setForm(p => ({ ...p, plan_tier: v as PlanTier }))}
            >
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Zrušit
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Vytvářím...' : 'Vytvořit firmu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
