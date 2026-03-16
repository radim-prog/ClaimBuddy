'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Send, CheckCircle2, Building2, MapPin, Users, MessageSquare, Search, Loader2, X } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { toast } from 'sonner'

const BUDGET_OPTIONS = [
  { value: 'do_2000', label: 'Do 2 000 Kč/měs' },
  { value: '2000_5000', label: '2 000 – 5 000 Kč/měs' },
  { value: '5000_10000', label: '5 000 – 10 000 Kč/měs' },
  { value: 'nad_10000', label: 'Nad 10 000 Kč/měs' },
  { value: 'neznam', label: 'Nevím / záleží na nabídce' },
]

const BUSINESS_TYPES = [
  'OSVČ – služby',
  'OSVČ – řemeslo',
  'OSVČ – e-shop',
  's.r.o. – služby',
  's.r.o. – obchod',
  's.r.o. – výroba',
  'Jiné',
]

interface Provider {
  id: string
  name: string
  city: string | null
  description: string | null
  specializations: string[]
  capacity_status: string
  min_price: number | null
  max_price: number | null
  services: string[]
}

const CAPACITY_LABELS: Record<string, { label: string; cls: string }> = {
  accepting: { label: 'Přijímá klienty', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  limited: { label: 'Omezená kapacita', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  full: { label: 'Plná kapacita', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export default function FindAccountantPage() {
  const { userName, selectedCompany, selectedCompanyId } = useClientUser()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [search, setSearch] = useState('')

  // Contact dialog state
  const [contactProvider, setContactProvider] = useState<Provider | null>(null)
  const [message, setMessage] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [budget, setBudget] = useState('')
  const [sending, setSending] = useState(false)

  // Generic form fallback
  const [showGenericForm, setShowGenericForm] = useState(false)
  const [genericLocation, setGenericLocation] = useState('')
  const [genericNote, setGenericNote] = useState('')
  const [genericSent, setGenericSent] = useState(false)

  useEffect(() => {
    fetch('/api/marketplace/providers')
      .then(r => r.ok ? r.json() : { providers: [] })
      .then(data => setProviders(data.providers || []))
      .catch(() => {})
      .finally(() => setLoadingProviders(false))
  }, [])

  const filtered = search
    ? providers.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.city || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase())
      )
    : providers

  const handleContactSubmit = async () => {
    if (!contactProvider) return
    setSending(true)
    try {
      const res = await fetch('/api/client/marketplace-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: contactProvider.id,
          company_id: selectedCompanyId || null,
          message: message || null,
          business_type: businessType || null,
          budget_range: budget || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Nepodařilo se odeslat')
        return
      }
      toast.success(`Žádost odeslána firmě ${contactProvider.name}!`)
      setContactProvider(null)
      setMessage('')
      setBusinessType('')
      setBudget('')
    } catch {
      toast.error('Chyba při odesílání')
    } finally {
      setSending(false)
    }
  }

  const handleGenericSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!genericLocation && !businessType && !genericNote) {
      toast.error('Vyplňte alespoň jedno pole')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/client/find-accountant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: selectedCompanyId || null,
          preferred_location: genericLocation,
          business_type: businessType,
          budget_range: budget,
          note: genericNote,
          source: 'find_accountant_form',
        }),
      })
      if (res.status === 429) {
        toast.info('Už jste nedávno odeslali poptávku.')
        setGenericSent(true)
        return
      }
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Nepodařilo se odeslat')
        return
      }
      setGenericSent(true)
      toast.success('Poptávka odeslána!')
    } catch {
      toast.error('Chyba při odesílání')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          Najít účetního
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vyberte si z ověřených účetních nebo nám pošlete poptávku
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Hledat podle jména, města..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Provider catalog */}
      {loadingProviders ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map(provider => {
            const cap = CAPACITY_LABELS[provider.capacity_status] || CAPACITY_LABELS.accepting
            return (
              <Card key={provider.id} className="rounded-xl">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base truncate">{provider.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${cap.cls}`}>
                          {cap.label}
                        </span>
                      </div>
                      {provider.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="h-3.5 w-3.5" />
                          {provider.city}
                        </p>
                      )}
                      {provider.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {provider.description}
                        </p>
                      )}
                      {provider.specializations?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {provider.specializations.slice(0, 4).map(s => (
                            <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {(provider.min_price || provider.max_price) && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {provider.min_price && provider.max_price
                            ? `${provider.min_price.toLocaleString('cs-CZ')} – ${provider.max_price.toLocaleString('cs-CZ')} Kč/měs`
                            : provider.min_price
                            ? `od ${provider.min_price.toLocaleString('cs-CZ')} Kč/měs`
                            : `do ${provider.max_price!.toLocaleString('cs-CZ')} Kč/měs`}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={provider.capacity_status === 'full'}
                      onClick={() => {
                        setContactProvider(provider)
                        setMessage('')
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Kontaktovat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {search ? 'Žádní účetní neodpovídají vašemu hledání' : 'Zatím žádní registrovaní účetní'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generic form link */}
      {!showGenericForm && !genericSent && (
        <div className="text-center pt-2">
          <Button variant="ghost" onClick={() => setShowGenericForm(true)}>
            <Send className="h-4 w-4 mr-2" />
            Nebo pošlete obecnou poptávku
          </Button>
        </div>
      )}

      {/* Generic form */}
      {showGenericForm && !genericSent && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-display">Obecná poptávka</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenericSubmit} className="space-y-5">
              <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">{userName}</span>
                  {selectedCompany && (
                    <span className="text-muted-foreground">
                      {' '} — {selectedCompany.name}
                      {selectedCompany.ico && ` (IČO: ${selectedCompany.ico})`}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferovaná lokalita</Label>
                <Input placeholder="např. Praha, Brno, online..." value={genericLocation} onChange={e => setGenericLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Typ podnikání</Label>
                <select className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={businessType} onChange={e => setBusinessType(e.target.value)}>
                  <option value="">Vyberte...</option>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Rozpočet</Label>
                <select className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={budget} onChange={e => setBudget(e.target.value)}>
                  <option value="">Vyberte...</option>
                  {BUDGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Poznámka</Label>
                <textarea rows={3} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Co potřebujete..." value={genericNote} onChange={e => setGenericNote(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? 'Odesílám...' : <><Send className="h-4 w-4 mr-2" />Odeslat poptávku</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {genericSent && (
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold">Děkujeme za zájem!</p>
          <p className="text-sm text-muted-foreground">Ozveme se vám co nejdříve.</p>
        </div>
      )}

      {/* Contact provider modal */}
      {contactProvider && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setContactProvider(null)}>
          <div className="bg-background rounded-xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Kontaktovat {contactProvider.name}</h3>
              <button onClick={() => setContactProvider(null)} className="p-1 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3 text-sm">
              <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <span className="font-medium">{userName}</span>
                {selectedCompany && (
                  <span className="text-muted-foreground"> — {selectedCompany.name}</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Typ podnikání</Label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1" value={businessType} onChange={e => setBusinessType(e.target.value)}>
                  <option value="">Vyberte...</option>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm">Rozpočet</Label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1" value={budget} onChange={e => setBudget(e.target.value)}>
                  <option value="">Vyberte...</option>
                  {BUDGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm">Zpráva pro účetního</Label>
                <textarea rows={3} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none mt-1" placeholder="Popište co potřebujete..." value={message} onChange={e => setMessage(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setContactProvider(null)}>Zrušit</Button>
              <Button className="flex-1" onClick={handleContactSubmit} disabled={sending}>
                {sending ? 'Odesílám...' : <><Send className="h-4 w-4 mr-2" />Odeslat žádost</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
