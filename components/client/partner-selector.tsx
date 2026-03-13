'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Search, Loader2, Plus, Users, ChevronDown, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { InvoicePartner } from '@/lib/types/invoice-partners'

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

interface PartnerSelectorProps {
  companyId: string
  value: PartnerData
  onChange: (data: PartnerData) => void
  hasError?: boolean
}

const FREQUENT_THRESHOLD = 3

const errorClass = 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700'

export function PartnerSelector({ companyId, value, onChange, hasError }: PartnerSelectorProps) {
  const [partners, setPartners] = useState<InvoicePartner[]>([])
  const [loading, setLoading] = useState(false)
  const [aresLoading, setAresLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [mode, setMode] = useState<'select' | 'onetime' | 'addressbook'>('select')

  // Load partners
  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    fetch(`/api/client/partners?company_id=${companyId}`)
      .then(r => r.ok ? r.json() : { partners: [] })
      .then(data => setPartners(data.partners || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  const filtered = useMemo(() => {
    if (!searchText) return partners
    const q = searchText.toLowerCase()
    return partners.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.ico?.includes(q) ||
      p.city?.toLowerCase().includes(q)
    )
  }, [partners, searchText])

  // Split into frequent and all
  const { frequent, all } = useMemo(() => {
    const freq = filtered.filter(p => (p.usage_count || 0) >= FREQUENT_THRESHOLD)
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'cs'))
    return { frequent: freq, all: sorted }
  }, [filtered])

  const selectPartner = (p: InvoicePartner) => {
    onChange({
      name: p.name,
      ico: p.ico || undefined,
      dic: p.dic || undefined,
      address: p.address || undefined,
      city: p.city || undefined,
      postal_code: p.postal_code || undefined,
      email: p.email || undefined,
      phone: p.phone || undefined,
      partner_id: p.id,
    })
    setShowDropdown(false)
    setSearchText('')

    // Increment usage count
    fetch(`/api/client/partners?company_id=${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: p.id }),
    }).catch(() => {})
  }

  const handleAresLookup = async () => {
    const ico = value.ico?.replace(/\s/g, '')
    if (!ico || ico.length !== 8) {
      toast.error('Zadejte 8místné IČO')
      return
    }
    setAresLoading(true)
    try {
      const res = await fetch(`/api/ares?ico=${ico}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Firma nenalezena')
        return
      }
      const c = data.company
      onChange({
        ...value,
        name: c.name || value.name,
        dic: c.dic || value.dic,
        address: c.address?.street || value.address,
        city: c.address?.city || value.city,
        postal_code: c.address?.zip || value.postal_code,
      })
      toast.success('Data načtena z ARES')
    } catch {
      toast.error('Nepodařilo se spojit s ARES')
    } finally {
      setAresLoading(false)
    }
  }

  const saveAsPartner = async () => {
    if (!value.name) return
    try {
      const res = await fetch('/api/client/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          name: value.name,
          ico: value.ico,
          dic: value.dic,
          address: value.address,
          city: value.city,
          postal_code: value.postal_code,
          email: value.email,
          phone: value.phone,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPartners(prev => [data.partner, ...prev])
        onChange({ ...value, partner_id: data.partner.id })
        toast.success('Partner uložen do adresáře')
      }
    } catch {
      toast.error('Uložení selhalo')
    }
  }

  const update = (key: keyof PartnerData, val: string) => {
    onChange({ ...value, [key]: val })
  }

  const clearManualData = () => {
    onChange({ name: '', ico: '', dic: '', address: '', city: '', postal_code: '', email: '', phone: '' })
  }

  const clearPartnerSelection = () => {
    onChange({ name: '', ico: '', dic: '', address: '', city: '', postal_code: '', email: '', phone: '' })
  }

  const renderPartnerRow = (p: InvoicePartner) => (
    <button
      key={p.id}
      type="button"
      onClick={() => selectPartner(p)}
      className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{p.name}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {[p.ico && `IČO: ${p.ico}`, p.city].filter(Boolean).join(' · ')}
      </div>
    </button>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Odběratel</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => { setMode('select'); clearManualData() }}
            className={`text-xs px-2 py-1 rounded ${mode === 'select' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Users className="h-3 w-3 inline mr-1" />
            Adresář
          </button>
          <button
            type="button"
            onClick={() => { setMode('onetime'); clearPartnerSelection() }}
            className={`text-xs px-2 py-1 rounded ${mode === 'onetime' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <FileText className="h-3 w-3 inline mr-1" />
            Jednorázový
          </button>
        </div>
      </div>

      {/* Partner dropdown */}
      {mode === 'select' && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className={`w-full flex items-center justify-between h-9 rounded-md border px-3 text-sm bg-background hover:bg-muted/50 ${hasError ? errorClass : ''}`}
          >
            <span className={value.partner_id ? 'text-foreground' : 'text-muted-foreground'}>
              {value.partner_id ? `${value.name}${value.ico ? ` (${value.ico})` : ''}` : 'Vyberte partnera...'}
            </span>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-80 overflow-hidden">
              <div className="p-2 border-b">
                <Input
                  placeholder="Hledat partnera..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="h-8"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto max-h-56">
                {all.length === 0 ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    {partners.length === 0 ? 'Zatím nemáte žádné partnery' : 'Nic nenalezeno'}
                  </div>
                ) : (
                  <>
                    {/* Frequent partners section */}
                    {frequent.length > 0 && (
                      <>
                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                          Často používaní
                        </div>
                        {frequent.map(p => renderPartnerRow(p))}
                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 border-t">
                          Všichni
                        </div>
                      </>
                    )}
                    {/* All partners alphabetically */}
                    {all.map(p => renderPartnerRow(p))}
                  </>
                )}
              </div>
              <div className="p-2 border-t">
                <button
                  type="button"
                  onClick={() => { setMode('addressbook'); setShowDropdown(false) }}
                  className="w-full text-center text-xs text-blue-600 hover:text-blue-700 py-1"
                >
                  + Přidat do adresáře
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form fields for onetime/addressbook modes, or when partner selected */}
      {(mode === 'onetime' || mode === 'addressbook' || value.name) && (
        <div className="space-y-3">
          {/* Helper text */}
          {mode === 'onetime' && (
            <p className="text-xs text-muted-foreground">Údaje se uloží jen k této faktuře</p>
          )}
          {mode === 'addressbook' && (
            <p className="text-xs text-muted-foreground">Partner se uloží do adresáře pro příští použití</p>
          )}

          {/* Form grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Název *</Label>
              <Input value={value.name} onChange={e => update('name', e.target.value)} placeholder="Firma s.r.o." className={hasError ? errorClass : ''} />
            </div>
            <div>
              <Label className="text-xs">IČO</Label>
              <div className="flex gap-1">
                <Input
                  value={value.ico || ''}
                  onChange={e => update('ico', e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="12345678"
                  className="font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAresLookup}
                  disabled={aresLoading || (value.ico?.replace(/\s/g, '').length || 0) !== 8}
                  className="shrink-0"
                  title="Vyhledat v ARES"
                >
                  {aresLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">DIČ</Label>
              <Input value={value.dic || ''} onChange={e => update('dic', e.target.value)} placeholder="CZ12345678" />
            </div>
            <div>
              <Label className="text-xs">Adresa</Label>
              <Input value={value.address || ''} onChange={e => update('address', e.target.value)} placeholder="Ulice 123" />
            </div>
            <div>
              <Label className="text-xs">Město</Label>
              <Input value={value.city || ''} onChange={e => update('city', e.target.value)} placeholder="Praha" />
            </div>
            <div>
              <Label className="text-xs">PSČ</Label>
              <Input value={value.postal_code || ''} onChange={e => update('postal_code', e.target.value)} placeholder="110 00" />
            </div>
          </div>
        </div>
      )}

      {/* Save to address book button - only in addressbook mode */}
      {mode === 'addressbook' && value.name && !value.partner_id && (
        <Button type="button" variant="outline" size="sm" onClick={saveAsPartner} className="w-full">
          <Plus className="h-3 w-3 mr-1" />
          Uložit do adresáře
        </Button>
      )}
    </div>
  )
}
