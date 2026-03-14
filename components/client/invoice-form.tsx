'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus, Trash2, Loader2, Download, ChevronDown, ChevronRight, FileText, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { PartnerSelector } from '@/components/client/partner-selector'
import { useClientUser } from '@/lib/contexts/client-user-context'

interface InvoiceItem {
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
}

interface PartnerData {
  name: string
  ico?: string
  dic?: string
  address?: string
  city?: string
  postal_code?: string
  email?: string
  phone?: string
  partner_id?: string
}

interface Favorite {
  id: string
  type: 'item' | 'partner'
  name: string
  data: any
  usage_count: number
}

type DocumentType = 'invoice' | 'proforma' | 'credit_note'

interface ExistingInvoice {
  id: string
  document_type?: string
  invoice_number?: string
  variable_symbol?: string
  partner?: { name: string; ico?: string; dic?: string; address?: string }
  items?: InvoiceItem[]
  issue_date?: string
  due_date?: string
  notes?: string
  payment_method?: string
  constant_symbol?: string
  specific_symbol?: string
  issued_by?: string
  issued_by_phone?: string
  issued_by_email?: string
}

interface ClientInvoiceFormProps {
  companyId: string
  onClose: () => void
  onCreated: () => void
  editInvoice?: ExistingInvoice
  duplicateFrom?: ExistingInvoice
}

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const docTypeLabels: Record<DocumentType, string> = {
  invoice: 'Faktura',
  proforma: 'Zálohová faktura',
  credit_note: 'Dobropis',
}

// Date badge helper
function getDateBadge(dateStr: string, type: 'issue' | 'due'): { text: string; colorClass: string } | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (type === 'issue') {
    if (diffDays === 0) return null
    if (diffDays < 0) return { text: `${diffDays} dní`, colorClass: 'text-red-600 bg-red-50 dark:bg-red-950/30' }
    return { text: `+${diffDays} dní`, colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' }
  }

  // due date
  if (diffDays < 0) return { text: 'po splatnosti', colorClass: 'text-red-600 bg-red-50 dark:bg-red-950/30' }
  if (diffDays <= 14) return { text: `za ${diffDays} dní`, colorClass: 'text-green-600 bg-green-50 dark:bg-green-950/30' }
  return { text: `za ${diffDays} dní`, colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' }
}

const paymentMethodOptions = [
  { value: 'bank_transfer', label: 'Převodem' },
  { value: 'cash', label: 'Hotově' },
  { value: 'card', label: 'Kartou' },
]

const unitOptions = ['ks', 'hod', 'den', 'měsíc', 'km', 'm', 'm²', 'komplet']

// Autocomplete dropdown for item description
const validationErrorClass = 'bg-red-100 dark:bg-red-950/40 border-red-400 dark:border-red-600 ring-1 ring-red-300 dark:ring-red-700'

function ItemDescriptionInput({
  value,
  onChange,
  onSelectFavorite,
  favorites,
  hasError,
}: {
  value: string
  onChange: (val: string) => void
  onSelectFavorite: (fav: Favorite) => void
  favorites: Favorite[]
  hasError?: boolean
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = value.length >= 2
    ? favorites.filter(f => f.name.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
    : []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative flex-1">
      <Input
        placeholder="Popis položky"
        value={value}
        onChange={e => {
          onChange(e.target.value)
          setShowSuggestions(true)
        }}
        onFocus={() => { setFocused(true); setShowSuggestions(true) }}
        onBlur={() => setFocused(false)}
        className={hasError ? validationErrorClass : ''}
        {...(hasError ? { 'data-validation-error': true } : {})}
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filtered.map(f => (
            <button
              key={f.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                onSelectFavorite(f)
                setShowSuggestions(false)
              }}
              className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm border-b last:border-0"
            >
              <span className="font-medium">{f.name}</span>
              {f.data?.unit_price != null && (
                <span className="text-muted-foreground ml-2">
                  {f.data.unit_price.toLocaleString('cs-CZ')} Kč/{f.data.unit || 'ks'}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ClientInvoiceForm({ companyId, onClose, onCreated, editInvoice, duplicateFrom }: ClientInvoiceFormProps) {
  const source = editInvoice || duplicateFrom
  const isEdit = !!editInvoice

  const { userName } = useClientUser()

  const [documentType, setDocumentType] = useState<DocumentType>(
    (source?.document_type as DocumentType) || 'invoice'
  )
  const [partner, setPartner] = useState<PartnerData>(() => {
    if (source?.partner) {
      return {
        name: source.partner.name || '',
        ico: source.partner.ico,
        dic: source.partner.dic,
        address: source.partner.address,
      }
    }
    return { name: '' }
  })
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (source?.items?.length) {
      return source.items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unit: i.unit || 'ks',
        unit_price: i.unit_price,
        vat_rate: i.vat_rate ?? 21,
      }))
    }
    return [{ description: '', quantity: 1, unit: 'ks', unit_price: 0, vat_rate: 21 }]
  })
  const [issueDate, setIssueDate] = useState(
    duplicateFrom ? new Date().toISOString().split('T')[0] : (source?.issue_date || new Date().toISOString().split('T')[0])
  )
  const [dueDate, setDueDate] = useState(
    duplicateFrom ? addDays(new Date(), 14) : (source?.due_date || addDays(new Date(), 14))
  )
  const [notes, setNotes] = useState(source?.notes || '')
  const [paymentMethod, setPaymentMethod] = useState(source?.payment_method || 'bank_transfer')
  const [constantSymbol, setConstantSymbol] = useState(source?.constant_symbol || '0308')
  const [specificSymbol, setSpecificSymbol] = useState(source?.specific_symbol || '')
  const [issuedBy, setIssuedBy] = useState(source?.issued_by || userName || '')
  const [issuedByPhone, setIssuedByPhone] = useState(source?.issued_by_phone || '')
  const [issuedByEmail, setIssuedByEmail] = useState(source?.issued_by_email || '')
  const [saving, setSaving] = useState(false)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [showExtra, setShowExtra] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())
  const formRef = useRef<HTMLDivElement>(null)

  const fieldError = (key: string) => validationErrors.has(key) ? validationErrorClass : ''

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
    setValidationErrors(prev => {
      const next = new Set(prev)
      next.delete(`item_${index}_description`)
      next.delete(`item_${index}_price`)
      return next
    })
  }

  const applyItemFavorite = (index: number, fav: Favorite) => {
    if (fav.type === 'item' && fav.data) {
      setItems(prev => prev.map((item, i) => i === index ? {
        description: fav.data.description || fav.name,
        quantity: fav.data.quantity || 1,
        unit: fav.data.unit || 'ks',
        unit_price: fav.data.unit_price || 0,
        vat_rate: fav.data.vat_rate ?? 21,
      } : item))
    }
  }

  const addFromFavorite = (fav: Favorite) => {
    if (fav.type === 'item' && fav.data) {
      setItems(prev => [...prev, {
        description: fav.data.description || fav.name,
        quantity: fav.data.quantity || 1,
        unit: fav.data.unit || 'ks',
        unit_price: fav.data.unit_price || 0,
        vat_rate: fav.data.vat_rate ?? 21,
      }])
    }
  }

  // Calculations
  const multiplier = documentType === 'credit_note' ? -1 : 1
  const itemTotals = items.map(item => {
    const withoutVat = item.quantity * item.unit_price * multiplier
    const vat = Math.round(withoutVat * (item.vat_rate / 100) * 100) / 100
    return { withoutVat, vat, withVat: withoutVat + vat }
  })

  const totalWithoutVat = itemTotals.reduce((s, t) => s + t.withoutVat, 0)
  const totalVat = itemTotals.reduce((s, t) => s + t.vat, 0)
  const totalWithVat = totalWithoutVat + totalVat

  const handleSubmit = async () => {
    const errors = new Set<string>()
    if (!partner.name) errors.add('partner_name')
    items.forEach((item, idx) => {
      if (!item.description) errors.add(`item_${idx}_description`)
      if (item.unit_price <= 0) errors.add(`item_${idx}_price`)
    })
    if (errors.size > 0) {
      setValidationErrors(errors)
      toast.error('Vyplňte červeně zvýrazněná pole')
      // Scroll to first error field
      setTimeout(() => {
        const el = formRef.current?.querySelector('[data-validation-error]')
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }
    setValidationErrors(new Set())

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

      const payload: any = {
        company_id: companyId,
        type: 'income',
        document_type: documentType,
        partner: {
          name: partner.name,
          ico: partner.ico,
          dic: partner.dic,
          address: partner.address,
        },
        partner_id: partner.partner_id || null,
        items: invoiceItems,
        issue_date: issueDate,
        due_date: dueDate,
        total_without_vat: totalWithoutVat,
        total_vat: totalVat,
        total_with_vat: totalWithVat,
        notes,
        payment_method: paymentMethod,
        constant_symbol: constantSymbol || null,
        specific_symbol: specificSymbol || null,
        issued_by: issuedBy || null,
        issued_by_phone: issuedByPhone || null,
        issued_by_email: issuedByEmail || null,
      }

      const url = isEdit ? `/api/client/invoices/${editInvoice!.id}` : '/api/client/invoices'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `${isEdit ? 'Úprava' : 'Vytvoření'} faktury selhalo`)
      }

      // Auto-save favorites (only for new invoices)
      if (!isEdit) saveFavorites()
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setSaving(false)
    }
  }

  const saveFavorites = async () => {
    try {
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

  const itemFavorites = favorites.filter(f => f.type === 'item')
  const topItemFavorites = itemFavorites
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, 5)

  const issueDateBadge = getDateBadge(issueDate, 'issue')
  const dueDateBadge = getDateBadge(dueDate, 'due')

  const formTitle = isEdit
    ? `Upravit ${docTypeLabels[documentType].toLowerCase()}`
    : duplicateFrom
      ? `Duplikovat ${docTypeLabels[documentType].toLowerCase()}`
      : `${docTypeLabels[documentType]}`

  return (
    <Card ref={formRef}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{formTitle}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Document type selector — only invoice & proforma in creation */}
        {!isEdit && (
          <div>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {(['invoice', 'proforma'] as DocumentType[]).map(dt => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setDocumentType(dt)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    documentType === dt
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {docTypeLabels[dt]}
                </button>
              ))}
            </div>
            {/* Document number / VS info */}
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Číslo dokladu a variabilní symbol budou přiřazeny automaticky
            </p>
          </div>
        )}

        {/* Edit mode: show invoice number and VS */}
        {isEdit && (editInvoice?.invoice_number || editInvoice?.variable_symbol) && (
          <div className="flex gap-4 text-sm">
            {editInvoice?.invoice_number && (
              <div>
                <span className="text-muted-foreground">Číslo: </span>
                <span className="font-mono font-medium">{editInvoice.invoice_number}</span>
              </div>
            )}
            {editInvoice?.variable_symbol && (
              <div>
                <span className="text-muted-foreground">VS: </span>
                <span className="font-mono font-medium">{editInvoice.variable_symbol}</span>
              </div>
            )}
          </div>
        )}

        {/* Partner selector */}
        <PartnerSelector
          companyId={companyId}
          value={partner}
          onChange={(data) => {
            setPartner(data)
            setValidationErrors(prev => { const next = new Set(prev); next.delete('partner_name'); return next })
          }}
          hasError={validationErrors.has('partner_name')}
        />

        {/* Dates with badges */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label className="text-xs">Datum vystavení</Label>
              {issueDateBadge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${issueDateBadge.colorClass}`}>
                  {issueDateBadge.text}
                </span>
              )}
            </div>
            <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label className="text-xs">Datum splatnosti</Label>
              {dueDateBadge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${dueDateBadge.colorClass}`}>
                  {dueDateBadge.text}
                </span>
              )}
            </div>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        {/* Payment method (native select, always visible) + collapsible extra */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Způsob platby</Label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full h-9 rounded-md border px-2 text-sm bg-background"
            >
              {paymentMethodOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Collapsible "Další údaje" */}
          <button
            type="button"
            onClick={() => setShowExtra(!showExtra)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showExtra ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Další údaje
          </button>

          {showExtra && (
            <div className="space-y-3 pl-1 border-l-2 border-muted ml-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Konstantní symbol</Label>
                  <Input
                    value={constantSymbol}
                    onChange={e => setConstantSymbol(e.target.value)}
                    placeholder="0308"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Specifický symbol</Label>
                  <Input
                    value={specificSymbol}
                    onChange={e => setSpecificSymbol(e.target.value)}
                    placeholder="volitelný"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Vystavil</Label>
                  <Input value={issuedBy} onChange={e => setIssuedBy(e.target.value)} placeholder="Jan Novák" />
                </div>
                <div>
                  <Label className="text-xs">Telefon</Label>
                  <Input value={issuedByPhone} onChange={e => setIssuedByPhone(e.target.value)} placeholder="+420..." />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input value={issuedByEmail} onChange={e => setIssuedByEmail(e.target.value)} placeholder="email@..." />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Položky</h3>

          {/* Quick-add chips from favorites */}
          {topItemFavorites.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground">Časté:</span>
              {topItemFavorites.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => addFromFavorite(f)}
                  className="text-[11px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {items.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-3 space-y-2">
              {/* Row 1: Description + delete */}
              <div className="flex items-start gap-2">
                <ItemDescriptionInput
                  value={item.description}
                  onChange={val => updateItem(idx, 'description', val)}
                  onSelectFavorite={fav => applyItemFavorite(idx, fav)}
                  favorites={itemFavorites}
                  hasError={validationErrors.has(`item_${idx}_description`)}
                />
                {items.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeItem(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                )}
              </div>
              {/* Row 2: Quantity, Unit, Price, VAT */}
              <div className="flex gap-2 items-end">
                <div className="w-16 shrink-0">
                  <Label className="text-[10px]">Počet</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                    min={1}
                    className="text-center"
                  />
                </div>
                <div className="w-20 shrink-0">
                  <Label className="text-[10px]">Jednotka</Label>
                  <select
                    value={item.unit}
                    onChange={e => updateItem(idx, 'unit', e.target.value)}
                    className="w-full h-9 rounded-md border px-1.5 text-sm bg-background"
                  >
                    {unitOptions.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <Label className="text-[10px]">Cena/ks</Label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                    min={0}
                    className={fieldError(`item_${idx}_price`)}
                    {...(validationErrors.has(`item_${idx}_price`) ? { 'data-validation-error': true } : {})}
                  />
                </div>
                <div className="w-20 shrink-0">
                  <Label className="text-[10px]">DPH</Label>
                  <select
                    value={item.vat_rate}
                    onChange={e => updateItem(idx, 'vat_rate', Number(e.target.value))}
                    className="w-full h-9 rounded-md border px-1.5 text-sm bg-background"
                  >
                    <option value={0}>0%</option>
                    <option value={12}>12%</option>
                    <option value={21}>21%</option>
                  </select>
                </div>
              </div>
              {/* Row 3: Item total */}
              <div className="text-right text-sm font-medium text-muted-foreground">
                = {itemTotals[idx]?.withVat.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kč
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
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{isEdit ? 'Ukládám...' : 'Vytvářím...'}</>
          ) : (
            isEdit ? 'Uložit změny' : `Vytvořit ${docTypeLabels[documentType].toLowerCase()}`
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
