'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, Trash2, Loader2, Star, Download } from 'lucide-react'
import { toast } from 'sonner'

interface InvoiceItem {
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
}

interface Partner {
  name: string
  ico?: string
  dic?: string
  address?: string
}

interface Favorite {
  id: string
  type: 'item' | 'partner'
  name: string
  data: any
  usage_count: number
}

interface ClientInvoiceFormProps {
  companyId: string
  onClose: () => void
  onCreated: () => void
}

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function ClientInvoiceForm({ companyId, onClose, onCreated }: ClientInvoiceFormProps) {
  const [partner, setPartner] = useState<Partner>({ name: '' })
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit: 'ks', unit_price: 0, vat_rate: 21 },
  ])
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(addDays(new Date(), 14))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [showFavorites, setShowFavorites] = useState(false)

  // Load favorites
  useEffect(() => {
    fetch(`/api/client/invoice-favorites?company_id=${companyId}`)
      .then(r => r.ok ? r.json() : { favorites: [] })
      .then(data => setFavorites(data.favorites || []))
      .catch(() => {})
  }, [companyId])

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, unit: 'ks', unit_price: 0, vat_rate: 21 }])
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const applyFavorite = (fav: Favorite) => {
    if (fav.type === 'partner') {
      setPartner(fav.data)
    } else if (fav.type === 'item') {
      setItems(prev => [...prev, fav.data])
    }
    setShowFavorites(false)
  }

  // Calculations
  const itemTotals = items.map(item => {
    const withoutVat = item.quantity * item.unit_price
    const vat = Math.round(withoutVat * (item.vat_rate / 100) * 100) / 100
    return { withoutVat, vat, withVat: withoutVat + vat }
  })

  const totalWithoutVat = itemTotals.reduce((s, t) => s + t.withoutVat, 0)
  const totalVat = itemTotals.reduce((s, t) => s + t.vat, 0)
  const totalWithVat = totalWithoutVat + totalVat

  const handleSubmit = async () => {
    if (!partner.name) {
      toast.error('Vyplňte jméno odběratele')
      return
    }
    if (items.some(i => !i.description || i.unit_price <= 0)) {
      toast.error('Vyplňte všechny položky')
      return
    }

    setSaving(true)
    try {
      const invoiceItems = items.map((item, i) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        total_without_vat: itemTotals[i].withoutVat,
        total_with_vat: itemTotals[i].withVat,
      }))

      const res = await fetch('/api/client/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          type: 'income',
          partner,
          items: invoiceItems,
          issue_date: issueDate,
          due_date: dueDate,
          total_without_vat: totalWithoutVat,
          total_vat: totalVat,
          total_with_vat: totalWithVat,
          notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Vytvoření faktury selhalo')
      }

      // Auto-save favorites
      saveFavorites()
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setSaving(false)
    }
  }

  const saveFavorites = async () => {
    try {
      // Save partner as favorite
      if (partner.name && !favorites.some(f => f.type === 'partner' && f.name === partner.name)) {
        await fetch('/api/client/invoice-favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            type: 'partner',
            name: partner.name,
            data: partner,
          }),
        })
      }

      // Save items as favorites
      for (const item of items) {
        if (item.description && !favorites.some(f => f.type === 'item' && f.name === item.description)) {
          await fetch('/api/client/invoice-favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company_id: companyId,
              type: 'item',
              name: item.description,
              data: item,
            }),
          })
        }
      }
    } catch {
      // Silent
    }
  }

  const partnerFavorites = favorites.filter(f => f.type === 'partner')
  const itemFavorites = favorites.filter(f => f.type === 'item')

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Nová faktura</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Favorites banner */}
        {favorites.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Star className="h-4 w-4 mr-1 text-amber-500" />
            Oblíbené ({favorites.length})
          </Button>
        )}

        {showFavorites && (
          <div className="border rounded-lg p-3 space-y-2 bg-amber-50/50 dark:bg-amber-950/20">
            {partnerFavorites.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Odběratelé</p>
                <div className="flex flex-wrap gap-1">
                  {partnerFavorites.map(f => (
                    <button
                      key={f.id}
                      onClick={() => applyFavorite(f)}
                      className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border rounded hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {itemFavorites.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Položky</p>
                <div className="flex flex-wrap gap-1">
                  {itemFavorites.map(f => (
                    <button
                      key={f.id}
                      onClick={() => applyFavorite(f)}
                      className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border rounded hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Partner */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Odběratel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Název *</Label>
              <Input value={partner.name} onChange={e => setPartner(p => ({ ...p, name: e.target.value }))} placeholder="Firma s.r.o." />
            </div>
            <div>
              <Label className="text-xs">IČO</Label>
              <Input value={partner.ico || ''} onChange={e => setPartner(p => ({ ...p, ico: e.target.value }))} placeholder="12345678" />
            </div>
            <div>
              <Label className="text-xs">DIČ</Label>
              <Input value={partner.dic || ''} onChange={e => setPartner(p => ({ ...p, dic: e.target.value }))} placeholder="CZ12345678" />
            </div>
            <div>
              <Label className="text-xs">Adresa</Label>
              <Input value={partner.address || ''} onChange={e => setPartner(p => ({ ...p, address: e.target.value }))} placeholder="Ulice, Město" />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Datum vystavení</Label>
            <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Datum splatnosti</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Položky</h3>
          {items.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Položka {idx + 1}</span>
                {items.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(idx)}>
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                )}
              </div>
              <Input
                placeholder="Popis položky"
                value={item.description}
                onChange={e => updateItem(idx, 'description', e.target.value)}
              />
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-[10px]">Počet</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                    min={1}
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Jednotka</Label>
                  <select
                    value={item.unit}
                    onChange={e => updateItem(idx, 'unit', e.target.value)}
                    className="w-full h-9 rounded-md border px-2 text-sm bg-background"
                  >
                    <option value="ks">ks</option>
                    <option value="hod">hod</option>
                    <option value="den">den</option>
                    <option value="m">m</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[10px]">Cena/ks</Label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div>
                  <Label className="text-[10px]">DPH %</Label>
                  <select
                    value={item.vat_rate}
                    onChange={e => updateItem(idx, 'vat_rate', Number(e.target.value))}
                    className="w-full h-9 rounded-md border px-2 text-sm bg-background"
                  >
                    <option value={0}>0%</option>
                    <option value={12}>12%</option>
                    <option value={21}>21%</option>
                  </select>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                = {itemTotals[idx]?.withVat.toLocaleString('cs-CZ')} Kč
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            Přidat položku
          </Button>
        </div>

        {/* Notes */}
        <div>
          <Label className="text-xs">Poznámka</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Text pod fakturou..."
            rows={2}
          />
        </div>

        {/* Summary */}
        <div className="border-t pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Základ</span>
            <span>{totalWithoutVat.toLocaleString('cs-CZ')} Kč</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">DPH</span>
            <span>{totalVat.toLocaleString('cs-CZ')} Kč</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Celkem</span>
            <span>{totalWithVat.toLocaleString('cs-CZ')} Kč</span>
          </div>
        </div>

        {/* Submit */}
        <Button className="w-full h-12 text-lg" onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Vytvářím...</>
          ) : (
            'Vytvořit fakturu'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
