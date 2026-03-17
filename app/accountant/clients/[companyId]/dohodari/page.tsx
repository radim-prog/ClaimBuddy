'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Users,
  Plus,
  FileSignature,
  Calculator,
  Clock,
  Banknote,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingDown,
  AlertTriangle,
  Lock,
  Filter,
  Info,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { usePlanFeatures } from '@/lib/hooks/use-plan-features'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Dohoda, DohodaMesic, DohodaStatus } from '@/lib/types/dohodari'
import { DOHODA_TYPE_LABELS, DOHODA_STATUS_LABELS, PAYMENT_STATUS_LABELS, VYKAZ_STATUS_LABELS } from '@/lib/types/dohodari'

export default function DohodariPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const { isLocked } = usePlanFeatures()

  const [dohody, setDohody] = useState<Dohoda[]>([])
  const [vykazy, setVykazy] = useState<DohodaMesic[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<DohodaStatus | ''>('')
  const [filterTyp, setFilterTyp] = useState<'dpp' | 'dpc' | ''>('')
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Add dohodář dialog
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addForm, setAddForm] = useState({
    first_name: '',
    last_name: '',
    typ: 'dpp' as 'dpp' | 'dpc',
    sazba: '',
    platnost_od: new Date().toISOString().slice(0, 10),
  })

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterTyp) params.set('typ', filterTyp)

      const [dohodyRes, vykazyRes] = await Promise.all([
        fetch(`/api/accountant/companies/${companyId}/dohodari?${params}`),
        fetch(`/api/accountant/companies/${companyId}/dohodari/tax-impact?typ=dpp&gross=10000&prohlaseni=false`),
      ])

      if (dohodyRes.ok) {
        const data = await dohodyRes.json()
        setDohody(data.dohody || [])
      }
      if (vykazyRes.ok) {
        const data = await vykazyRes.json()
        setStats(data.impact)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [companyId, filterStatus, filterTyp])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleAddDohodar() {
    if (!addForm.first_name.trim() || !addForm.last_name.trim() || !addForm.sazba) return
    setAddSubmitting(true)
    try {
      // 1. Create employee
      const empRes = await fetch('/api/accountant/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          first_name: addForm.first_name.trim(),
          last_name: addForm.last_name.trim(),
          employment_start: addForm.platnost_od,
          contract_type: addForm.typ,
        }),
      })
      if (!empRes.ok) throw new Error('Failed to create employee')
      const { employee } = await empRes.json()

      // 2. Create dohoda
      const dohodaRes = await fetch(`/api/accountant/companies/${companyId}/dohodari`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employee.id,
          typ: addForm.typ,
          sazba: Number(addForm.sazba),
          platnost_od: addForm.platnost_od,
          status: 'draft',
        }),
      })
      if (!dohodaRes.ok) throw new Error('Failed to create dohoda')

      // Reset and refresh
      setShowAddDialog(false)
      setAddForm({ first_name: '', last_name: '', typ: 'dpp', sazba: '', platnost_od: new Date().toISOString().slice(0, 10) })
      fetchData()
    } catch (err) {
      console.error('Add dohodář error:', err)
    } finally {
      setAddSubmitting(false)
    }
  }

  // Plan gate
  if (isLocked('dohodari') && isLocked('agreements')) {
    return (
      <Card className="max-w-lg mx-auto mt-12">
        <CardContent className="py-12 text-center">
          <Lock className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold mb-2">Modul Dohodáři</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Evidence DPP/DPČ, výpočty odvodů a daní, generování smluv. Dostupné od tarifu Profi.
          </p>
          <Button onClick={() => window.location.href = '/accountant/admin/subscription'}>
            Zobrazit tarify
          </Button>
        </CardContent>
      </Card>
    )
  }

  const activeDPP = dohody.filter(d => d.typ === 'dpp' && (d.status === 'active' || d.status === 'draft')).length
  const activeDPC = dohody.filter(d => d.typ === 'dpc' && (d.status === 'active' || d.status === 'draft')).length

  const getStatusBadge = (status: DohodaStatus) => {
    const colors: Record<DohodaStatus, string> = {
      draft: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      terminated: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      expired: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status]}`}>{DOHODA_STATUS_LABELS[status]}</span>
  }

  const getTypBadge = (typ: 'dpp' | 'dpc') => {
    const color = typ === 'dpp'
      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{typ.toUpperCase()}</span>
  }

  const basePath = `/accountant/clients/${companyId}`

  return (
    <div className="space-y-6">
      {/* Sub-navigation: Daně / Dohodáři */}
      <div className="flex items-center gap-1 border-b border-border pb-2">
        <a
          href={`${basePath}/taxes`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Calculator className="h-3.5 w-3.5" />
          Daně
        </a>
        <span
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
        >
          <FileSignature className="h-3.5 w-3.5" />
          Dohodáři
        </span>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileSignature className="h-4 w-4 text-blue-500" />
              Aktivní DPP
            </div>
            <div className="text-2xl font-bold">{activeDPP}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileSignature className="h-4 w-4 text-purple-500" />
              Aktivní DPČ
            </div>
            <div className="text-2xl font-bold">{activeDPC}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4 text-gray-500" />
              Celkem dohod
            </div>
            <div className="text-2xl font-bold">{dohody.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4 text-green-500" />
              Úspora zaměstnavatele
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats ? `${stats.employer_saving_percent}%` : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agreements list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-indigo-600" />
              Seznam dohod
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                className="text-sm border rounded px-2 py-1 bg-background"
                value={filterTyp}
                onChange={e => setFilterTyp(e.target.value as any)}
              >
                <option value="">Všechny typy</option>
                <option value="dpp">DPP</option>
                <option value="dpc">DPČ</option>
              </select>
              <select
                className="text-sm border rounded px-2 py-1 bg-background"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
              >
                <option value="">Všechny stavy</option>
                <option value="draft">Koncept</option>
                <option value="active">Aktivní</option>
                <option value="terminated">Ukončená</option>
              </select>
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Přidat dohodáře
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Načítám...</div>
          ) : dohody.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSignature className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="mb-2">Žádné dohody</p>
              <p className="text-sm">Dohody se vytvářejí přes záložku Dohodáři u konkrétní firmy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dohody.map(d => (
                <div key={d.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                        {d.employee?.first_name?.[0]}{d.employee?.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-medium">
                          {d.employee ? `${d.employee.first_name} ${d.employee.last_name}` : '—'}
                        </div>
                        <div className="text-sm text-muted-foreground">{d.popis_prace || 'Bez popisu'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypBadge(d.typ)}
                      {getStatusBadge(d.status)}
                      <span className="text-sm font-medium">{formatCurrency(d.sazba)}/hod</span>
                      {expandedId === d.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {expandedId === d.id && (
                    <div className="border-t p-4 bg-muted/30 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Platnost od:</span>
                          <div className="font-medium">{formatDate(d.platnost_od)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Platnost do:</span>
                          <div className="font-medium">{d.platnost_do ? formatDate(d.platnost_do) : 'neurčito'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prohlášení:</span>
                          <div className="font-medium">{d.prohlaseni_podepsano ? 'Ano' : 'Ne'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max hodin:</span>
                          <div className="font-medium">{d.max_hodin_rok}/rok</div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/api/accountant/companies/${companyId}/dohodari/${d.id}/pdf?type=dohoda`, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Smlouva PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/api/accountant/companies/${companyId}/dohodari/${d.id}/pdf?type=potvrzeni_prijmu`, '_blank')}
                        >
                          <Calculator className="h-4 w-4 mr-1" />
                          Potvrzení příjmu
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add dohodář dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Přidat dohodáře</DialogTitle>
            <DialogDescription>Vytvořte novou dohodu o provedení práce (DPP) nebo pracovní činnosti (DPČ).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-first-name">Jméno</Label>
                <Input
                  id="add-first-name"
                  value={addForm.first_name}
                  onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))}
                  placeholder="Jan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-last-name">Příjmení</Label>
                <Input
                  id="add-last-name"
                  value={addForm.last_name}
                  onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))}
                  placeholder="Novák"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Typ dohody</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dohodaTyp"
                    checked={addForm.typ === 'dpp'}
                    onChange={() => setAddForm(f => ({ ...f, typ: 'dpp' }))}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">DPP</span>
                  <span className="text-xs text-muted-foreground">— max 300 hod/rok</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dohodaTyp"
                    checked={addForm.typ === 'dpc'}
                    onChange={() => setAddForm(f => ({ ...f, typ: 'dpc' }))}
                    className="h-4 w-4 text-purple-600"
                  />
                  <span className="text-sm font-medium">DPČ</span>
                  <span className="text-xs text-muted-foreground">— max 20 hod/týden</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-sazba">Odměna (Kč/hod)</Label>
                <Input
                  id="add-sazba"
                  type="number"
                  min="0"
                  value={addForm.sazba}
                  onChange={e => setAddForm(f => ({ ...f, sazba: e.target.value }))}
                  placeholder="200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-platnost">Platnost od</Label>
                <Input
                  id="add-platnost"
                  type="date"
                  value={addForm.platnost_od}
                  onChange={e => setAddForm(f => ({ ...f, platnost_od: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Zrušit</Button>
            <Button
              onClick={handleAddDohodar}
              disabled={addSubmitting || !addForm.first_name.trim() || !addForm.last_name.trim() || !addForm.sazba}
            >
              {addSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Ukládám...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Vytvořit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tax impact calculator */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              Daňový dopad (příklad DPP 10 000 Kč)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Jako HPP</h4>
                <div className="flex justify-between text-sm">
                  <span>Náklady zaměstnavatele:</span>
                  <span className="font-medium">{formatCurrency(stats.hpp_employer_cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Čistá mzda zaměstnance:</span>
                  <span className="font-medium">{formatCurrency(stats.hpp_employee_net)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Jako DPP (pod limitem)</h4>
                <div className="flex justify-between text-sm">
                  <span>Náklady zaměstnavatele:</span>
                  <span className="font-medium text-green-600">{formatCurrency(stats.dohoda_employer_cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Čistá mzda zaměstnance:</span>
                  <span className="font-medium">{formatCurrency(stats.dohoda_employee_net)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <TrendingDown className="h-4 w-4" />
                <span className="font-medium">
                  Úspora zaměstnavatele: {formatCurrency(stats.employer_saving)} ({stats.employer_saving_percent}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
