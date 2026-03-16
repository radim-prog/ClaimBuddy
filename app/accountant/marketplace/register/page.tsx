'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Store, Search, CheckCircle2, Clock, XCircle, Building2,
  MapPin, Mail, Phone, Globe, Tag, Users, Banknote, Loader2,
} from 'lucide-react'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

const SPECIALIZATIONS = [
  'Účetnictví', 'Daňové evidence', 'Mzdy a personalistika',
  'DPH', 'Daňové poradenství', 'Audit', 'OSVČ',
  's.r.o.', 'a.s.', 'Neziskové organizace', 'E-shopy',
  'IT firmy', 'Gastronomie', 'Stavebnictví', 'Zdravotnictví',
]

const SERVICES = [
  'Vedení účetnictví', 'Daňová evidence', 'Zpracování mezd',
  'Daňové přiznání', 'DPH přiznání', 'Kontrolní hlášení',
  'Účetní závěrka', 'Poradenství', 'Zastupování na FÚ',
  'Datové schránky', 'Intrastat', 'Souhrnné hlášení',
]

const CAPACITY_OPTIONS = [
  { value: 'accepting', label: 'Přijímáme klienty', color: 'bg-green-100 text-green-800' },
  { value: 'limited', label: 'Omezená kapacita', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'full', label: 'Plná kapacita', color: 'bg-red-100 text-red-800' },
]

interface FormData {
  name: string
  ico: string
  dic: string
  legal_form: string
  email: string
  phone: string
  website: string
  street: string
  city: string
  zip: string
  region: string
  description: string
  specializations: string[]
  capacity_status: string
  min_price: string
  max_price: string
  services: string[]
}

const initialForm: FormData = {
  name: '', ico: '', dic: '', legal_form: '',
  email: '', phone: '', website: '',
  street: '', city: '', zip: '', region: '',
  description: '',
  specializations: [], capacity_status: 'accepting',
  min_price: '', max_price: '',
  services: [],
}

type RegistrationStatus = 'none' | 'pending' | 'verified' | 'rejected'

export default function MarketplaceRegisterPage() {
  const router = useRouter()
  const { userRole, loading: userLoading } = useAccountantUser()
  const [form, setForm] = useState<FormData>(initialForm)
  const [aresLoading, setAresLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<RegistrationStatus>('none')
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Admin bypass: redirect to marketplace management instead of showing registration form
  useEffect(() => {
    if (!userLoading && userRole === 'admin') {
      router.replace('/accountant/marketplace-requests')
    }
  }, [userLoading, userRole, router])

  // Check existing registration
  useEffect(() => {
    fetch('/api/accountant/marketplace/register')
      .then(r => r.json())
      .then(data => {
        if (data.provider) {
          setStatus(data.provider.status as RegistrationStatus)
          setRejectionReason(data.provider.rejection_reason)
          // Pre-fill form with existing data
          setForm({
            name: data.provider.name || '',
            ico: data.provider.ico || '',
            dic: data.provider.dic || '',
            legal_form: data.provider.legal_form || '',
            email: data.provider.email || '',
            phone: data.provider.phone || '',
            website: data.provider.website || '',
            street: data.provider.street || '',
            city: data.provider.city || '',
            zip: data.provider.zip || '',
            region: data.provider.region || '',
            description: data.provider.description || '',
            specializations: data.provider.specializations || [],
            capacity_status: data.provider.capacity_status || 'accepting',
            min_price: data.provider.min_price?.toString() || '',
            max_price: data.provider.max_price?.toString() || '',
            services: data.provider.services || [],
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleAresLookup = async () => {
    if (!form.ico || form.ico.length !== 8) {
      toast.error('Zadejte 8-místné IČO')
      return
    }

    setAresLoading(true)
    try {
      const res = await fetch(`/api/ares?ico=${form.ico}`)
      if (res.ok) {
        const data = await res.json()
        if (data.name) {
          setForm(prev => ({
            ...prev,
            name: data.name || prev.name,
            dic: data.dic || prev.dic,
            legal_form: data.legal_form || prev.legal_form,
            street: data.address?.street || prev.street,
            city: data.address?.city || prev.city,
            zip: data.address?.zip || prev.zip,
          }))
          toast.success('ARES data načtena')
        } else {
          toast.error('Firma nenalezena v ARES')
        }
      } else {
        toast.error('ARES lookup selhal')
      }
    } catch {
      toast.error('Chyba při komunikaci s ARES')
    } finally {
      setAresLoading(false)
    }
  }

  const toggleArrayItem = (field: 'specializations' | 'services', item: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.ico || !form.email || !form.city) {
      toast.error('Vyplňte povinná pole: název, IČO, email, město')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/accountant/marketplace/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          min_price: form.min_price ? Number(form.min_price) : null,
          max_price: form.max_price ? Number(form.max_price) : null,
        }),
      })

      if (res.ok || res.status === 200) {
        setStatus('pending')
        toast.success('Registrace odeslána ke schválení')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba při registraci')
      }
    } catch {
      toast.error('Chyba při odesílání')
    } finally {
      setSaving(false)
    }
  }

  if (loading || userLoading || userRole === 'admin') {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    )
  }

  // Status views
  if (status === 'pending') {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Card className="rounded-xl text-center">
          <CardContent className="py-12">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registrace čeká na schválení</h2>
            <p className="text-muted-foreground mb-4">
              Vaše registrace do marketplace byla odeslána. Admin ji zkontroluje a schválí.
            </p>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              Čeká na verifikaci
            </Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'verified') {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Card className="rounded-xl text-center">
          <CardContent className="py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Vaše firma je v marketplace</h2>
            <p className="text-muted-foreground mb-4">
              Registrace byla schválena. Vaše firma je viditelná pro potenciální klienty.
            </p>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              Ověřeno
            </Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Store className="h-6 w-6 text-purple-600" />
          Registrace do marketplace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Zaregistrujte svou účetní firmu a získejte nové klienty
        </p>
      </div>

      {/* Rejected notice */}
      {status === 'rejected' && (
        <Card className="rounded-xl border-red-200 dark:border-red-800">
          <CardContent className="py-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Registrace zamítnuta</p>
              {rejectionReason && (
                <p className="text-sm text-muted-foreground mt-1">Důvod: {rejectionReason}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">Můžete upravit údaje a odeslat znovu.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ARES Lookup */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Základní údaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">IČO *</label>
              <Input
                value={form.ico}
                onChange={e => setForm({ ...form, ico: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                placeholder="12345678"
                maxLength={8}
              />
            </div>
            <div className="pt-6">
              <Button
                variant="outline"
                onClick={handleAresLookup}
                disabled={aresLoading || form.ico.length !== 8}
              >
                {aresLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                ARES
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Název firmy *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Účetní s.r.o." />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">DIČ</label>
              <Input value={form.dic} onChange={e => setForm({ ...form, dic: e.target.value })} placeholder="CZ12345678" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Právní forma</label>
              <Input value={form.legal_form} onChange={e => setForm({ ...form, legal_form: e.target.value })} placeholder="s.r.o." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Kontakt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email *</label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="info@ucetni.cz" type="email" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Telefon</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+420 123 456 789" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Web</label>
              <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://www.ucetni.cz" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Sídlo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Ulice</label>
              <Input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} placeholder="Hlavní 123" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Město *</label>
              <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Praha" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">PSČ</label>
              <Input value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} placeholder="110 00" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Kraj</label>
              <Input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="Hlavní město Praha" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Popis firmy</label>
            <Textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Popište svou firmu, zkušenosti a přístup ke klientům..."
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Specializace</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleArrayItem('specializations', s)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    form.specializations.includes(s)
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-medium'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Služby</label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleArrayItem('services', s)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    form.services.includes(s)
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-medium'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity & Pricing */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Kapacita a ceník
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Stav kapacity</label>
            <div className="flex gap-2">
              {CAPACITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, capacity_status: opt.value })}
                  className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                    form.capacity_status === opt.value
                      ? `${opt.color} border-current font-medium`
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Banknote className="h-3.5 w-3.5" /> Cena od (Kč/měs)
              </label>
              <Input
                type="number"
                value={form.min_price}
                onChange={e => setForm({ ...form, min_price: e.target.value })}
                placeholder="1000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Banknote className="h-3.5 w-3.5" /> Cena do (Kč/měs)
              </label>
              <Input
                type="number"
                value={form.max_price}
                onChange={e => setForm({ ...form, max_price: e.target.value })}
                placeholder="5000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => window.history.back()}>
          Zrušit
        </Button>
        <Button onClick={handleSubmit} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Store className="h-4 w-4 mr-2" />}
          {status === 'rejected' ? 'Odeslat znovu' : 'Registrovat do marketplace'}
        </Button>
      </div>
    </div>
  )
}
