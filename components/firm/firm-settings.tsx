'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Save, Building2, MapPin, CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type FirmData = {
  id: string
  name: string
  ico: string | null
  dic: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: { street?: string; city?: string; zip?: string } | null
  billing_email: string | null
  settings: { billing?: { invoice_day?: number; payment_terms_days?: number; late_fee_percent?: number } } | null
}

export function FirmSettings() {
  const [firm, setFirm] = useState<FirmData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [ico, setIco] = useState('')
  const [dic, setDic] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [invoiceDay, setInvoiceDay] = useState(1)
  const [paymentTerms, setPaymentTerms] = useState(14)
  const [lateFee, setLateFee] = useState(0.05)

  useEffect(() => {
    fetch('/api/accountant/firm')
      .then(r => r.json())
      .then(data => {
        if (data.firm) {
          const f = data.firm as FirmData
          setFirm(f)
          setName(f.name || '')
          setIco(f.ico || '')
          setDic(f.dic || '')
          setEmail(f.email || '')
          setPhone(f.phone || '')
          setWebsite(f.website || '')
          setStreet(f.address?.street || '')
          setCity(f.address?.city || '')
          setZip(f.address?.zip || '')
          setBillingEmail(f.billing_email || '')
          setInvoiceDay(f.settings?.billing?.invoice_day || 1)
          setPaymentTerms(f.settings?.billing?.payment_terms_days || 14)
          setLateFee(f.settings?.billing?.late_fee_percent || 0.05)
        }
      })
      .catch(() => toast.error('Nepodařilo se načíst data firmy'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/firm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          ico: ico || null,
          dic: dic || null,
          email: email || null,
          phone: phone || null,
          website: website || null,
          address: { street, city, zip },
          billing_email: billingEmail || null,
          settings: {
            ...firm?.settings,
            billing: {
              ...firm?.settings?.billing,
              invoice_day: invoiceDay,
              payment_terms_days: paymentTerms,
              late_fee_percent: lateFee,
            },
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setFirm(data.firm)
        toast.success('Nastavení uloženo')
      } else {
        toast.error('Nepodařilo se uložit')
      }
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!firm) {
    return <p className="text-muted-foreground text-center py-12">Firma nenalezena</p>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profil firmy */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Profil firmy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Název firmy</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ico">IČO</Label>
              <Input id="ico" value={ico} onChange={e => setIco(e.target.value)} className="font-mono" />
            </div>
            <div>
              <Label htmlFor="dic">DIČ</Label>
              <Input id="dic" value={dic} onChange={e => setDic(e.target.value)} className="font-mono" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="website">Web</Label>
              <Input id="website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adresa */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Adresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street">Ulice</Label>
            <Input id="street" value={street} onChange={e => setStreet(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Město</Label>
              <Input id="city" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="zip">PSČ</Label>
              <Input id="zip" value={zip} onChange={e => setZip(e.target.value)} className="font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fakturační nastavení */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Fakturační nastavení
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="billingEmail">Fakturační email</Label>
            <Input id="billingEmail" type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoiceDay">Den fakturace</Label>
              <Input id="invoiceDay" type="number" min={1} max={28} value={invoiceDay} onChange={e => setInvoiceDay(parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Splatnost (dny)</Label>
              <Input id="paymentTerms" type="number" min={1} max={90} value={paymentTerms} onChange={e => setPaymentTerms(parseInt(e.target.value) || 14)} />
            </div>
            <div>
              <Label htmlFor="lateFee">Úrok (%/den)</Label>
              <Input id="lateFee" type="number" step={0.01} min={0} max={1} value={lateFee} onChange={e => setLateFee(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Ukládám...' : 'Uložit změny'}
        </Button>
      </div>
    </div>
  )
}
