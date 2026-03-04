'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Download, Loader2, Calendar, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { CustomerSelector, type CustomerData } from '@/components/invoice/customer-selector'
import { InvoiceItemsEditor, calculateItemTotals, type InvoiceItemRow } from '@/components/invoice/invoice-items-editor'
import { TemplatePickerDialog } from '@/components/invoice/template-picker-dialog'
import type { NumberSeries } from '@/lib/types/invoice-settings'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function addDaysStr(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export default function NewInvoicePage() {
  const router = useRouter()

  // Data loading
  const [companies, setCompanies] = useState<{ id: string; name: string; ico?: string; dic?: string; address?: any }[]>([])
  const [series, setSeries] = useState<NumberSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [defaults, setDefaults] = useState({ vat: 21, maturity: 14, constantSymbol: '' })

  // Form state
  const [customer, setCustomer] = useState<CustomerData>({ name: '', ico: '', dic: '', address: '', city: '', zip: '' })
  const [items, setItems] = useState<InvoiceItemRow[]>([])
  const [selectedSeries, setSelectedSeries] = useState<string>('default')
  const [issueDate, setIssueDate] = useState(todayStr())
  const [dueDate, setDueDate] = useState(addDaysStr(14))
  const [taxDate, setTaxDate] = useState(todayStr())
  const [constantSymbol, setConstantSymbol] = useState('')
  const [specificSymbol, setSpecificSymbol] = useState('')
  const [notes, setNotes] = useState('')
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/accountant/companies').then(r => r.ok ? r.json() : { companies: [] }),
      fetch('/api/accountant/settings/number-series').then(r => r.ok ? r.json() : { series: [] }),
      fetch('/api/accountant/settings').then(r => r.ok ? r.json() : { settings: {} }),
    ]).then(([compData, serData, setData]) => {
      setCompanies(compData.companies || [])
      const loadedSeries = serData.series || []
      setSeries(loadedSeries)
      if (loadedSeries.length > 0) {
        const active = loadedSeries.find((s: NumberSeries) => s.active)
        if (active) setSelectedSeries(active.id)
      }
      const s = setData.settings || {}
      const maturity = Number(s.default_invoice_maturity) || 14
      const vat = Number(s.default_vat_rate) || 21
      setDefaults({ vat, maturity, constantSymbol: s.default_constant_symbol || '' })
      setDueDate(addDaysStr(maturity))
      setConstantSymbol(s.default_constant_symbol || '')
    }).finally(() => setLoading(false))
  }, [])

  const activeSeries = series.filter(s => s.active)

  const handleAddFromTemplate = (item: InvoiceItemRow) => {
    setItems(prev => [...prev, item])
  }

  const handleSave = async (downloadPdf: boolean = false) => {
    if (!customer.name) {
      toast.error('Vyberte nebo zadejte odberatele')
      return
    }
    if (items.length === 0) {
      toast.error('Pridejte alespon jednu polozku')
      return
    }

    setSaving(true)
    try {
      const totals = calculateItemTotals(items)
      const invoiceItems = items.map((item, i) => ({
        id: `item-${i}`,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        total_without_vat: Math.round(item.quantity * item.unit_price * 100) / 100,
        total_with_vat: Math.round(item.quantity * item.unit_price * (1 + item.vat_rate / 100) * 100) / 100,
      }))

      const body: Record<string, unknown> = {
        company_id: customer.company_id || null,
        company_name: customer.name,
        partner: {
          name: customer.name,
          ico: customer.ico || undefined,
          dic: customer.dic || undefined,
          address: [customer.address, customer.city, customer.zip].filter(Boolean).join(', '),
        },
        items: invoiceItems,
        total_without_vat: Math.round(totals.base * 100) / 100,
        total_vat: Math.round(totals.vat * 100) / 100,
        total_with_vat: Math.round(totals.total * 100) / 100,
        issue_date: issueDate,
        due_date: dueDate,
        tax_date: taxDate,
        number_series_id: selectedSeries || undefined,
        constant_symbol: constantSymbol || undefined,
        specific_symbol: specificSymbol || undefined,
        notes: notes || undefined,
      }

      const res = await fetch('/api/accountant/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }

      const { invoice } = await res.json()
      toast.success(`Faktura ${invoice.invoice_number} vytvorena`)

      if (downloadPdf) {
        window.open(`/api/accountant/invoices/${invoice.id}/pdf`, '_blank')
      }

      router.push(`/accountant/invoices/${invoice.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba pri ukladani')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/accountant/invoices">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zpet na seznam
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova faktura</h1>
      </div>

      {/* Customer */}
      <CustomerSelector
        companies={companies}
        value={customer}
        onChange={setCustomer}
      />

      {/* Invoice details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Udaje faktury
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Datum vystaveni</Label>
              <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Datum splatnosti</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">DUZP</Label>
              <Input type="date" value={taxDate} onChange={e => setTaxDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ciselna rada</Label>
              {activeSeries.length > 1 ? (
                <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSeries.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.prefix} – {s.description || s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={activeSeries[0]?.prefix || 'FV'} disabled className="h-9" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
              <Label className="text-xs">Konstantni symbol</Label>
              <Input value={constantSymbol} onChange={e => setConstantSymbol(e.target.value)} placeholder="0308" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Specificky symbol</Label>
              <Input value={specificSymbol} onChange={e => setSpecificSymbol(e.target.value)} placeholder="" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <InvoiceItemsEditor
        items={items}
        onChange={setItems}
        defaultVatRate={defaults.vat}
        onOpenTemplates={() => setTemplatePickerOpen(true)}
      />

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Poznamky
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Interni poznamky k fakture..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href="/accountant/invoices">
          <Button variant="outline">Zrusit</Button>
        </Link>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <Download className="h-4 w-4 mr-2" />
            Ulozit a stahnout PDF
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Ukladam...' : 'Ulozit koncept'}
          </Button>
        </div>
      </div>

      {/* Template picker */}
      <TemplatePickerDialog
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onSelect={handleAddFromTemplate}
      />
    </div>
  )
}
