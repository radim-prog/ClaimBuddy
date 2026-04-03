'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2, Save, Plus, Trash2, Pencil, Check, X, Hash, ListOrdered
} from 'lucide-react'
import { toast } from 'sonner'
import type { NumberSeries, InvoiceItemTemplate } from '@/lib/types/invoice-settings'

export function InvoicingSettings() {
  // --- Number Series ---
  const [series, setSeries] = useState<NumberSeries[]>([])
  const [seriesLoading, setSeriesLoading] = useState(true)
  const [editingSeries, setEditingSeries] = useState<string | null>(null)
  const [seriesForm, setSeriesForm] = useState({ id: '', prefix: '', format: '{prefix}-{yyyy}-{nnnn}', next_number: 1, description: '' })
  const [addingSeries, setAddingSeries] = useState(false)

  // --- Item Templates ---
  const [templates, setTemplates] = useState<InvoiceItemTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', unit: 'ks', unit_price: 0, vat_rate: 21 })
  const [addingTemplate, setAddingTemplate] = useState(false)

  // --- Defaults ---
  const [defaults, setDefaults] = useState({ default_vat_rate: 21, default_invoice_maturity: 14, default_constant_symbol: '' })
  const [defaultsLoading, setDefaultsLoading] = useState(true)

  // Load all data
  useEffect(() => {
    fetch('/api/accountant/settings/number-series')
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.series) setSeries(json.series) })
      .catch(() => {})
      .finally(() => setSeriesLoading(false))

    fetch('/api/accountant/invoice-templates')
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.templates) setTemplates(json.templates) })
      .catch(() => {})
      .finally(() => setTemplatesLoading(false))

    fetch('/api/accountant/settings')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json?.settings) return
        setDefaults({
          default_vat_rate: json.settings.default_vat_rate ?? 21,
          default_invoice_maturity: json.settings.default_invoice_maturity ?? 14,
          default_constant_symbol: json.settings.default_constant_symbol ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setDefaultsLoading(false))
  }, [])

  // --- Series handlers ---
  const handleSaveSeries = async (s: NumberSeries) => {
    try {
      const res = await fetch('/api/accountant/settings/number-series', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const json = await res.json()
      setSeries(json.series)
      setEditingSeries(null)
      toast.success('Ciselna rada ulozena')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Chyba')
    }
  }

  const handleAddSeries = async () => {
    if (!seriesForm.id || !seriesForm.prefix) {
      toast.error('Vyplnte ID a prefix')
      return
    }
    try {
      const res = await fetch('/api/accountant/settings/number-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...seriesForm, active: true }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const json = await res.json()
      setSeries(json.series)
      setAddingSeries(false)
      setSeriesForm({ id: '', prefix: '', format: '{prefix}-{yyyy}-{nnnn}', next_number: 1, description: '' })
      toast.success('Ciselna rada pridana')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Chyba')
    }
  }

  // --- Template handlers ---
  const handleAddTemplate = async () => {
    if (!templateForm.name) { toast.error('Vyplnte nazev'); return }
    try {
      const res = await fetch('/api/accountant/invoice-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const json = await res.json()
      setTemplates(prev => [...prev, json.template])
      setAddingTemplate(false)
      setTemplateForm({ name: '', description: '', unit: 'ks', unit_price: 0, vat_rate: 21 })
      toast.success('Polozka pridana do ceniku')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Chyba')
    }
  }

  const handleUpdateTemplate = async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/accountant/invoice-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const json = await res.json()
      setTemplates(prev => prev.map(t => t.id === id ? json.template : t))
      setEditingTemplate(null)
      toast.success('Polozka aktualizovana')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Chyba')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Smazat tuto polozku z ceniku?')) return
    try {
      const res = await fetch(`/api/accountant/invoice-templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Polozka smazana')
    } catch {
      toast.error('Chyba pri mazani')
    }
  }

  // --- Defaults handler ---
  const handleSaveDefaults = async () => {
    try {
      const res = await fetch('/api/accountant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_vat_rate: Number(defaults.default_vat_rate),
          default_invoice_maturity: Number(defaults.default_invoice_maturity),
          default_constant_symbol: defaults.default_constant_symbol || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Vychozi nastaveni ulozeno')
    } catch {
      toast.error('Chyba pri ukladani')
    }
  }

  const isLoading = seriesLoading || templatesLoading || defaultsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Default settings */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Hash className="h-3.5 w-3.5" />
            Výchozí nastavení faktur
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-gray-500 whitespace-nowrap">DPH</Label>
              <Input type="number" value={defaults.default_vat_rate} onChange={e => setDefaults(d => ({ ...d, default_vat_rate: Number(e.target.value) }))} className="h-8 w-16 text-sm" />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-gray-500 whitespace-nowrap">Splatnost</Label>
              <Input type="number" value={defaults.default_invoice_maturity} onChange={e => setDefaults(d => ({ ...d, default_invoice_maturity: Number(e.target.value) }))} className="h-8 w-16 text-sm" />
              <span className="text-xs text-gray-400">dní</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-gray-500 whitespace-nowrap">KS</Label>
              <Input value={defaults.default_constant_symbol} onChange={e => setDefaults(d => ({ ...d, default_constant_symbol: e.target.value }))} placeholder="0308" className="h-8 w-20 text-sm" />
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs ml-auto" onClick={handleSaveDefaults}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Uložit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Number Series */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <ListOrdered className="h-3.5 w-3.5" />
              Číselné řady
            </CardTitle>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingSeries(true)} disabled={addingSeries}>
              <Plus className="h-3 w-3 mr-1" />
              Přidat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {series.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                {editingSeries === s.id ? (
                  <SeriesEditRow
                    series={s}
                    onSave={handleSaveSeries}
                    onCancel={() => setEditingSeries(null)}
                  />
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm">{s.prefix}</span>
                        <span className="text-xs text-gray-500">{s.format}</span>
                        {s.active ? (
                          <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">Aktivní</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 text-[10px]">Neaktivní</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {s.description || s.id} &middot; Další číslo: <strong>{s.next_number}</strong>
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditingSeries(s.id)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}

            {addingSeries && (
              <div className="p-3 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  <Input placeholder="ID (slug)" value={seriesForm.id} onChange={e => setSeriesForm(f => ({ ...f, id: e.target.value }))} />
                  <Input placeholder="Prefix (FV)" value={seriesForm.prefix} onChange={e => setSeriesForm(f => ({ ...f, prefix: e.target.value }))} />
                  <Input placeholder="Format" value={seriesForm.format} onChange={e => setSeriesForm(f => ({ ...f, format: e.target.value }))} />
                  <Input type="number" placeholder="Od čísla" value={seriesForm.next_number} onChange={e => setSeriesForm(f => ({ ...f, next_number: Number(e.target.value) }))} />
                  <Input placeholder="Popis" value={seriesForm.description} onChange={e => setSeriesForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setAddingSeries(false)}><X className="h-4 w-4" /></Button>
                  <Button size="sm" onClick={handleAddSeries}><Check className="h-4 w-4 mr-1" />Přidat</Button>
                </div>
              </div>
            )}

            {series.length === 0 && !addingSeries && (
              <p className="text-sm text-gray-500 text-center py-4">Žádné číselné řady. Klikněte na "Přidat řadu".</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Item Templates / Ceník */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-display">Ceník / Oblíbené položky</CardTitle>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingTemplate(true)} disabled={addingTemplate}>
              <Plus className="h-3 w-3 mr-1" />
              Přidat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-2 font-medium text-gray-500">Název</th>
                  <th className="py-2 px-2 font-medium text-gray-500">Popis</th>
                  <th className="py-2 px-2 font-medium text-gray-500 text-center">Jednotka</th>
                  <th className="py-2 px-2 font-medium text-gray-500 text-right">Cena/jed.</th>
                  <th className="py-2 px-2 font-medium text-gray-500 text-right">DPH %</th>
                  <th className="py-2 px-2 font-medium text-gray-500 text-center">Akce</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(t => (
                  <tr key={t.id} className="border-b border-border/50 dark:border-gray-800">
                    {editingTemplate === t.id ? (
                      <TemplateEditRow
                        template={t}
                        onSave={(updates) => handleUpdateTemplate(t.id, updates)}
                        onCancel={() => setEditingTemplate(null)}
                      />
                    ) : (
                      <>
                        <td className="py-2 px-2 font-medium">{t.name}</td>
                        <td className="py-2 px-2 text-gray-500">{t.description || '—'}</td>
                        <td className="py-2 px-2 text-center">{t.unit}</td>
                        <td className="py-2 px-2 text-right">{Number(t.unit_price).toLocaleString('cs-CZ')} Kč</td>
                        <td className="py-2 px-2 text-right">{t.vat_rate}%</td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(t.id)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(t.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {addingTemplate && (
                  <tr className="border-b-2 border-purple-300 dark:border-purple-700">
                    <td className="py-2 px-1">
                      <Input size={1} placeholder="Název" value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} />
                    </td>
                    <td className="py-2 px-1">
                      <Input size={1} placeholder="Popis" value={templateForm.description} onChange={e => setTemplateForm(f => ({ ...f, description: e.target.value }))} />
                    </td>
                    <td className="py-2 px-1">
                      <Input size={1} placeholder="ks" value={templateForm.unit} onChange={e => setTemplateForm(f => ({ ...f, unit: e.target.value }))} className="text-center" />
                    </td>
                    <td className="py-2 px-1">
                      <Input size={1} type="number" value={templateForm.unit_price} onChange={e => setTemplateForm(f => ({ ...f, unit_price: Number(e.target.value) }))} className="text-right" />
                    </td>
                    <td className="py-2 px-1">
                      <Input size={1} type="number" value={templateForm.vat_rate} onChange={e => setTemplateForm(f => ({ ...f, vat_rate: Number(e.target.value) }))} className="text-right" />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setAddingTemplate(false)}><X className="h-4 w-4" /></Button>
                        <Button size="sm" onClick={handleAddTemplate}><Check className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {templates.length === 0 && !addingTemplate && (
              <p className="text-sm text-gray-500 text-center py-6">
                Zatím žádné šablony. Přidejte oblíbené položky pro rychlé vkládání na faktury.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Inline edit components ---

function SeriesEditRow({ series, onSave, onCancel }: {
  series: NumberSeries
  onSave: (s: NumberSeries) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(series)

  return (
    <div className="flex-1 space-y-2">
      <div className="grid grid-cols-5 gap-2">
        <Input value={form.prefix} onChange={e => setForm(f => ({ ...f, prefix: e.target.value }))} placeholder="Prefix" />
        <Input value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} placeholder="Format" />
        <Input type="number" value={form.next_number} onChange={e => setForm(f => ({ ...f, next_number: Number(e.target.value) }))} placeholder="Dalsi cislo" />
        <Input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Popis" />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
            Aktivní
          </label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-4 w-4" /></Button>
        <Button size="sm" onClick={() => onSave(form)}><Check className="h-4 w-4 mr-1" />Uložit</Button>
      </div>
    </div>
  )
}

function TemplateEditRow({ template, onSave, onCancel }: {
  template: InvoiceItemTemplate
  onSave: (updates: Record<string, unknown>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: template.name,
    description: template.description,
    unit: template.unit,
    unit_price: template.unit_price,
    vat_rate: template.vat_rate,
  })

  return (
    <>
      <td className="py-2 px-1"><Input size={1} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></td>
      <td className="py-2 px-1"><Input size={1} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></td>
      <td className="py-2 px-1"><Input size={1} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="text-center" /></td>
      <td className="py-2 px-1"><Input size={1} type="number" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: Number(e.target.value) }))} className="text-right" /></td>
      <td className="py-2 px-1"><Input size={1} type="number" value={form.vat_rate} onChange={e => setForm(f => ({ ...f, vat_rate: Number(e.target.value) }))} className="text-right" /></td>
      <td className="py-2 px-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => onSave(form)}><Check className="h-4 w-4" /></Button>
        </div>
      </td>
    </>
  )
}
