'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users, Loader2, Plus, Search, Edit3, Trash2, X, Building2, Phone, Mail, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { toast } from 'sonner'
import type { InvoicePartner } from '@/lib/types/invoice-partners'

export default function PartnersPage() {
  const { companies, loading: companiesLoading, selectedCompanyId } = useClientUser()
  const companyId = selectedCompanyId || companies[0]?.id || ''

  const [partners, setPartners] = useState<InvoicePartner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editPartner, setEditPartner] = useState<InvoicePartner | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aresLoading, setAresLoading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '', ico: '', dic: '', address: '', city: '', postal_code: '',
    email: '', phone: '', bank_account: '', iban: '', note: '',
  })

  const fetchPartners = () => {
    if (!companyId) return
    setLoading(true)
    fetch(`/api/client/partners?company_id=${companyId}`)
      .then(r => r.ok ? r.json() : { partners: [] })
      .then(data => setPartners(data.partners || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPartners() }, [companyId])

  const resetForm = () => {
    setForm({ name: '', ico: '', dic: '', address: '', city: '', postal_code: '', email: '', phone: '', bank_account: '', iban: '', note: '' })
    setEditPartner(null)
    setShowForm(false)
  }

  const openEdit = (p: InvoicePartner) => {
    setForm({
      name: p.name || '', ico: p.ico || '', dic: p.dic || '',
      address: p.address || '', city: p.city || '', postal_code: p.postal_code || '',
      email: p.email || '', phone: p.phone || '', bank_account: p.bank_account || '',
      iban: p.iban || '', note: p.note || '',
    })
    setEditPartner(p)
    setShowForm(true)
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const handleAresLookup = async () => {
    const ico = form.ico.replace(/\s/g, '')
    if (!ico || ico.length !== 8) {
      toast.error('Zadejte 8místné IČO')
      return
    }
    setAresLoading(true)
    try {
      const res = await fetch(`/api/ares?ico=${ico}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Firma nenalezena'); return }
      const c = data.company
      setForm(prev => ({
        ...prev,
        name: c.name || prev.name,
        dic: c.dic || prev.dic,
        address: c.address?.street || prev.address,
        city: c.address?.city || prev.city,
        postal_code: c.address?.zip || prev.postal_code,
      }))
      toast.success('Data z ARES')
    } catch {
      toast.error('ARES nedostupný')
    } finally {
      setAresLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Vyplňte název'); return }
    setSaving(true)
    try {
      if (editPartner) {
        const res = await fetch('/api/client/partners', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partner_id: editPartner.id, ...form }),
        })
        if (!res.ok) throw new Error()
        toast.success('Partner uložen')
      } else {
        const res = await fetch('/api/client/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_id: companyId, ...form }),
        })
        if (!res.ok) throw new Error()
        toast.success('Partner vytvořen')
      }
      resetForm()
      fetchPartners()
    } catch {
      toast.error('Uložení selhalo')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: InvoicePartner) => {
    if (!confirm(`Smazat partnera "${p.name}"?`)) return
    try {
      const res = await fetch(`/api/client/partners?id=${p.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Partner smazán')
        fetchPartners()
      } else {
        toast.error('Smazání selhalo')
      }
    } catch {
      toast.error('Smazani selhalo')
    }
  }

  const filtered = partners.filter(p => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) ||
      p.ico?.includes(q) ||
      p.dic?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
  })

  if (companiesLoading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Adresář</h1>
        <p className="text-muted-foreground">Spravujte své obchodní partnery</p>
      </div>

      {/* Add partner button */}
      <div>
        <button
          onClick={openNew}
          className="h-14 w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-base shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98]"
        >
          <Plus className="h-5 w-5 flex-shrink-0" />
          Přidat partnera
        </button>
      </div>

      {/* Form overlay */}
      {showForm && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{editPartner ? 'Upravit partnera' : 'Nový partner'}</h3>
              <button onClick={resetForm} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Název *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Firma s.r.o." />
              </div>
              <div>
                <Label className="text-xs">IČO</Label>
                <div className="flex gap-1">
                  <Input
                    value={form.ico}
                    onChange={e => setForm(f => ({ ...f, ico: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                    placeholder="12345678" className="font-mono"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleAresLookup}
                    disabled={aresLoading || form.ico.replace(/\s/g, '').length !== 8} className="shrink-0" title="ARES">
                    {aresLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">DIČ</Label>
                <Input value={form.dic} onChange={e => setForm(f => ({ ...f, dic: e.target.value }))} placeholder="CZ12345678" />
              </div>
              <div>
                <Label className="text-xs">Adresa</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Ulice 123" />
              </div>
              <div>
                <Label className="text-xs">Město</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Praha" />
              </div>
              <div>
                <Label className="text-xs">PSČ</Label>
                <Input value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} placeholder="110 00" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="info@firma.cz" type="email" />
              </div>
              <div>
                <Label className="text-xs">Telefon</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+420 ..." />
              </div>
              <div>
                <Label className="text-xs">Číslo účtu</Label>
                <Input value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} placeholder="123456789/0100" className="font-mono" />
              </div>
              <div>
                <Label className="text-xs">IBAN</Label>
                <Input value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="CZ..." className="font-mono" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Poznámka</Label>
                <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Interní poznámka..." />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                {editPartner ? 'Uložit změny' : 'Vytvořit partnera'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Zrušit</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {partners.length > 0 && (
        <Input
          placeholder="Hledat partnera (název, IČO, město, email)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="h-10"
        />
      )}

      {/* Stats */}
      {partners.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {filtered.length} z {partners.length} partnerů
        </div>
      )}

      {/* Partner list */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : partners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Zatím nemáte žádné partnery</p>
            <p className="text-sm text-muted-foreground mt-1">Přidejte partnera nebo vystavte fakturu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 shrink-0 mt-0.5">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      {(p.usage_count || 0) >= 3 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                          {p.usage_count}x
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      {p.ico && <span>IČO: {p.ico}</span>}
                      {p.dic && <span>DIČ: {p.dic}</span>}
                      {p.city && <span>{[p.address, p.city, p.postal_code].filter(Boolean).join(', ')}</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                      {p.email && (
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>
                      )}
                      {p.phone && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>
                      )}
                      {p.bank_account && (
                        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{p.bank_account}</span>
                      )}
                    </div>
                    {p.note && <p className="text-xs text-muted-foreground mt-1 italic">{p.note}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-muted rounded-md" title="Upravit">
                      <Edit3 className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md" title="Smazat">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 && partners.length > 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Žádný partner neodpovídá hledání
        </div>
      )}
    </div>
  )
}
