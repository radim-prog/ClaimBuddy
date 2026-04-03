'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Plus, Pencil, Trash2, X, Check, Building2, Phone, Mail,
  Calendar, StickyNote, DollarSign, ChevronRight,
} from 'lucide-react'

type Stage = 'lead' | 'contacted' | 'onboarding' | 'planned' | 'active'

interface PipelineItem {
  id: string
  company_name: string
  ico: string | null
  contact_person: string | null
  contact_email: string | null
  contact_phone: string | null
  expected_monthly_fee: number
  stage: Stage
  note: string | null
  source: string | null
  planned_start: string | null
  company_id: string | null
  created_at: string
  updated_at: string
}

const STAGES: { value: Stage; label: string; color: string; bg: string }[] = [
  { value: 'lead', label: 'Lead', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' },
  { value: 'contacted', label: 'Kontaktovan', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' },
  { value: 'onboarding', label: 'Onboarding', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' },
  { value: 'planned', label: 'Planovaný', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700' },
  { value: 'active', label: 'Aktivní', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' },
]

const stageBadgeColor: Record<Stage, string> = {
  lead: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  onboarding: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  planned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}

const emptyForm = {
  company_name: '',
  ico: '',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  expected_monthly_fee: 0,
  stage: 'lead' as Stage,
  note: '',
  source: '',
  planned_start: '',
}

export default function PipelinePage() {
  const [items, setItems] = useState<PipelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/accountant/pipeline')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch {
      toast.error('Chyba pri nacitani pipeline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      toast.error('Nazev firmy je povinny')
      return
    }
    setSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? { id: editingId, ...form } : form
      const res = await fetch('/api/accountant/pipeline', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          expected_monthly_fee: Number(form.expected_monthly_fee) || 0,
          planned_start: form.planned_start || null,
        }),
      })
      if (res.ok) {
        toast.success(editingId ? 'Ulozeno' : 'Pridano do pipeline')
        setShowForm(false)
        setEditingId(null)
        setForm(emptyForm)
        fetchItems()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba')
      }
    } catch {
      toast.error('Chyba pri ukladani')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: PipelineItem) => {
    setForm({
      company_name: item.company_name,
      ico: item.ico || '',
      contact_person: item.contact_person || '',
      contact_email: item.contact_email || '',
      contact_phone: item.contact_phone || '',
      expected_monthly_fee: item.expected_monthly_fee || 0,
      stage: item.stage,
      note: item.note || '',
      source: item.source || '',
      planned_start: item.planned_start || '',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Smazat polozku z pipeline?')) return
    try {
      const res = await fetch(`/api/accountant/pipeline?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Smazano')
        fetchItems()
      }
    } catch {
      toast.error('Chyba')
    }
  }

  const handleStageChange = async (id: string, stage: Stage) => {
    try {
      const res = await fetch('/api/accountant/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stage }),
      })
      if (res.ok) {
        toast.success(`Stav zmenen na ${STAGES.find(s => s.value === stage)?.label}`)
        fetchItems()
      }
    } catch {
      toast.error('Chyba')
    }
  }

  // Group items by stage
  const grouped = STAGES.map(s => ({
    ...s,
    items: items.filter(i => i.stage === s.value),
    totalFee: items.filter(i => i.stage === s.value).reduce((sum, i) => sum + (i.expected_monthly_fee || 0), 0),
  }))

  const totalPipeline = items.reduce((sum, i) => sum + (i.expected_monthly_fee || 0), 0)
  const activeTotal = items.filter(i => i.stage === 'active').reduce((sum, i) => sum + (i.expected_monthly_fee || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display">Onboarding Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sledovani novych klientu od leadu po aktivniho klienta
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          Pridat do pipeline
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-xl">
          <CardContent className="pt-3 pb-3">
            <div className="text-xs text-muted-foreground">Celkem v pipeline</div>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-3 pb-3">
            <div className="text-xs text-muted-foreground">Pipeline hodnota</div>
            <div className="text-2xl font-bold">{totalPipeline.toLocaleString('cs-CZ')} Kc</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-3 pb-3">
            <div className="text-xs text-muted-foreground" title="Měsíční opakující se příjem">Aktivní měsíční příjem</div>
            <div className="text-2xl font-bold text-green-600">{activeTotal.toLocaleString('cs-CZ')} Kc</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-3 pb-3">
            <div className="text-xs text-muted-foreground">Konverzni pomr</div>
            <div className="text-2xl font-bold">
              {items.length > 0 ? Math.round(items.filter(i => i.stage === 'active').length / items.length * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form dialog */}
      {showForm && (
        <Card className="rounded-xl border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              {editingId ? 'Upravit polozku' : 'Novy lead'}
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null) }}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nazev firmy *</label>
                <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Firma s.r.o." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">ICO</label>
                <Input value={form.ico} onChange={e => setForm(f => ({ ...f, ico: e.target.value }))} placeholder="12345678" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Kontaktni osoba</label>
                <Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Jan Novak" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="jan@firma.cz" type="email" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Telefon</label>
                <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="+420..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Predpokladany pausl (Kc/mes)</label>
                <Input value={form.expected_monthly_fee} onChange={e => setForm(f => ({ ...f, expected_monthly_fee: Number(e.target.value) || 0 }))} type="number" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Stav</label>
                <select
                  value={form.stage}
                  onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {STAGES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Zdroj</label>
                <Input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="doporuceni, web, cold call..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Planovany start</label>
                <Input value={form.planned_start} onChange={e => setForm(f => ({ ...f, planned_start: e.target.value }))} type="date" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Poznamka</label>
              <textarea
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                className="w-full h-20 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                placeholder="Poznamky k leadu..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditingId(null) }}>Zrusit</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Check className="h-4 w-4 mr-1" />
                {saving ? 'Ukladam...' : editingId ? 'Ulozit' : 'Pridat'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban-style columns */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Nacitam...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {grouped.map(group => (
            <div key={group.value} className={`rounded-xl border p-3 ${group.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className={`text-sm font-semibold ${group.color}`}>{group.label}</h3>
                  <div className="text-xs text-muted-foreground">
                    {group.items.length} {group.items.length === 1 ? 'firma' : 'firem'}
                    {group.totalFee > 0 && ` · ${group.totalFee.toLocaleString('cs-CZ')} Kc`}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {group.items.map(item => (
                  <Card key={item.id} className="rounded-lg shadow-sm">
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <div className="font-medium text-sm leading-tight">{item.company_name}</div>
                        <div className="flex shrink-0">
                          <button onClick={() => handleEdit(item)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </button>
                        </div>
                      </div>

                      {item.expected_monthly_fee > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          {item.expected_monthly_fee.toLocaleString('cs-CZ')} Kc/mes
                        </div>
                      )}

                      {item.contact_person && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {item.contact_person}
                        </div>
                      )}

                      {item.note && (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground">
                          <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{item.note}</span>
                        </div>
                      )}

                      {item.planned_start && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.planned_start).toLocaleDateString('cs-CZ')}
                        </div>
                      )}

                      {item.source && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.source}</Badge>
                      )}

                      {/* Stage change select + quick activate */}
                      <div className="flex items-center gap-1 mt-1">
                        <select
                          value={item.stage}
                          onChange={e => handleStageChange(item.id, e.target.value as Stage)}
                          className="flex-1 h-7 px-2 rounded border border-input bg-background text-xs"
                        >
                          {STAGES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        {item.stage !== 'active' && (
                          <button
                            onClick={() => handleStageChange(item.id, 'active')}
                            className="shrink-0 h-7 px-2 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                            title="Presunout do Aktivni (plati)"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {group.items.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">Zadne polozky</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
