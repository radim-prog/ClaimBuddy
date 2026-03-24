'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type DocType = 'PPD' | 'VPD'

interface CashTransactionFormProps {
  companyId: string
  period?: string
  editData?: {
    id: string
    doc_type: DocType
    doc_number: string
    transaction_date: string
    amount: number
    description?: string | null
    counterparty_name?: string | null
    category?: string | null
  }
  onSave?: (tx: any) => void
  onCancel?: () => void
  className?: string
}

interface AresResult {
  ico: string
  name: string
  address: string
}

export function CashTransactionForm({
  companyId,
  period,
  editData,
  onSave,
  onCancel,
  className,
}: CashTransactionFormProps) {
  const isEdit = !!editData

  const [docType, setDocType] = useState<DocType>(editData?.doc_type || 'VPD')
  const [docNumber, setDocNumber] = useState(editData?.doc_number || '')
  const [date, setDate] = useState(editData?.transaction_date || new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState(editData ? Math.abs(editData.amount).toString() : '')
  const [description, setDescription] = useState(editData?.description || '')
  const [counterparty, setCounterparty] = useState(editData?.counterparty_name || '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  // ARES lookup
  const [aresQuery, setAresQuery] = useState('')
  const [aresResults, setAresResults] = useState<AresResult[]>([])
  const [aresLoading, setAresLoading] = useState(false)
  const [showAres, setShowAres] = useState(false)

  // Auto-fetch next doc number for new transactions
  useEffect(() => {
    if (isEdit || docNumber) return
    const year = new Date(date).getFullYear()
    fetch(`/api/client/cash-transactions/next-number?company_id=${companyId}&doc_type=${docType}&year=${year}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.doc_number) setDocNumber(d.doc_number) })
      .catch(() => {})
  }, [companyId, docType, date, isEdit, docNumber])

  const handleAresSearch = async () => {
    if (!aresQuery || aresQuery.length < 2) return
    setAresLoading(true)
    try {
      const isIco = /^\d{7,8}$/.test(aresQuery.trim())
      const url = isIco
        ? `/api/ares/lookup?ico=${aresQuery.trim()}`
        : `/api/ares/search?query=${encodeURIComponent(aresQuery)}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (isIco && data.name) {
          setAresResults([{ ico: data.ico, name: data.name, address: `${data.address?.street || ''}, ${data.address?.city || ''}` }])
        } else if (Array.isArray(data)) {
          setAresResults(data)
        } else if (data.results) {
          setAresResults(data.results)
        }
      }
    } catch { /* ignore */ }
    setAresLoading(false)
  }

  const selectAres = (result: AresResult) => {
    setCounterparty(result.name)
    setShowAres(false)
    setAresResults([])
  }

  const handleSubmit = async () => {
    setErrors([])
    setWarnings([])
    setSaving(true)

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setErrors(['Částka musí být kladná'])
      setSaving(false)
      return
    }

    if (!date) {
      setErrors(['Datum je povinné'])
      setSaving(false)
      return
    }

    try {
      const derivedPeriod = period || date.substring(0, 7)

      if (isEdit) {
        const res = await fetch(`/api/client/cash-transactions/${editData!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doc_type: docType,
            transaction_date: date,
            amount: parsedAmount,
            description: description || null,
            counterparty_name: counterparty || null,
            period: derivedPeriod,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          if (data.details) setErrors(data.details.map((d: any) => d.message))
          else setErrors([data.error || 'Chyba při ukládání'])
          setSaving(false)
          return
        }
        if (data.warnings?.length) setWarnings(data.warnings.map((w: any) => w.message))
        onSave?.(data.transaction)
      } else {
        const res = await fetch('/api/client/cash-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            doc_type: docType,
            transaction_date: date,
            amount: parsedAmount,
            description: description || null,
            counterparty_name: counterparty || null,
            period: derivedPeriod,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          if (data.details) setErrors(data.details.map((d: any) => d.message))
          else setErrors([data.error || 'Chyba při ukládání'])
          setSaving(false)
          return
        }
        if (data.warnings?.length) setWarnings(data.warnings.map((w: any) => w.message))
        onSave?.(data.transaction)
      }
    } catch {
      setErrors(['Síťová chyba'])
    }

    setSaving(false)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{isEdit ? 'Upravit doklad' : 'Nový hotovostní doklad'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Doc type toggle */}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={docType === 'PPD' ? 'default' : 'outline'}
            className={docType === 'PPD' ? 'bg-green-600 hover:bg-green-700' : ''}
            onClick={() => { setDocType('PPD'); if (!isEdit) setDocNumber('') }}
          >
            PPD (příjem)
          </Button>
          <Button
            type="button"
            size="sm"
            variant={docType === 'VPD' ? 'default' : 'outline'}
            className={docType === 'VPD' ? 'bg-red-600 hover:bg-red-700' : ''}
            onClick={() => { setDocType('VPD'); if (!isEdit) setDocNumber('') }}
          >
            VPD (výdej)
          </Button>
          {docNumber && (
            <Badge variant="secondary" className="ml-auto text-xs">{docNumber}</Badge>
          )}
        </div>

        {/* Date + Amount */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cash-date" className="text-xs">Datum</Label>
            <Input id="cash-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cash-amount" className="text-xs">Částka (Kč)</Label>
            <Input
              id="cash-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Counterparty with ARES */}
        <div>
          <Label htmlFor="cash-partner" className="text-xs">Partner</Label>
          <div className="flex gap-2">
            <Input
              id="cash-partner"
              value={counterparty}
              onChange={e => setCounterparty(e.target.value)}
              placeholder="Název partnera"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAresQuery(counterparty)
                setShowAres(true)
                if (counterparty.length >= 2) handleAresSearch()
              }}
              title="Hledat v ARES"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {showAres && (
            <div className="mt-2 border rounded-md p-2 space-y-2 bg-muted/50">
              <div className="flex gap-2">
                <Input
                  value={aresQuery}
                  onChange={e => setAresQuery(e.target.value)}
                  placeholder="IČO nebo název firmy"
                  className="flex-1 text-xs"
                  onKeyDown={e => e.key === 'Enter' && handleAresSearch()}
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAresSearch} disabled={aresLoading}>
                  {aresLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Hledat'}
                </Button>
              </div>
              {aresResults.map(r => (
                <button
                  key={r.ico}
                  className="w-full text-left text-xs p-1.5 rounded hover:bg-muted transition-colors"
                  onClick={() => selectAres(r)}
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground ml-2">IČO {r.ico}</span>
                  {r.address && <span className="text-muted-foreground block">{r.address}</span>}
                </button>
              ))}
              {aresResults.length === 0 && !aresLoading && aresQuery.length >= 2 && (
                <p className="text-xs text-muted-foreground">Žádné výsledky</p>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="cash-desc" className="text-xs">Popis</Label>
          <Input
            id="cash-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Účel platby"
          />
        </div>

        {/* Errors & Warnings */}
        {errors.length > 0 && (
          <div className="text-sm text-red-600 space-y-1">
            {errors.map((e, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {e}
              </div>
            ))}
          </div>
        )}
        {warnings.length > 0 && (
          <div className="text-sm text-yellow-600 space-y-1">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {w}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-0">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Zrušit</Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          {isEdit ? 'Uložit' : 'Vytvořit'}
        </Button>
      </CardFooter>
    </Card>
  )
}
