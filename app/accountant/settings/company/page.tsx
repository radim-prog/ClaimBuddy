'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Mail, Phone, MapPin, FileText, Loader2, Save, Upload, Trash2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface SupplierForm {
  name: string
  ico: string
  dic: string
  registration: string
  email: string
  phone: string
  address: string
  city: string
  zip: string
  web: string
  bankAccount: string
  iban: string
  swift: string
  footerText: string
}

const EMPTY_FORM: SupplierForm = {
  name: '', ico: '', dic: '', registration: '',
  email: '', phone: '', address: '', city: '', zip: '',
  web: '', bankAccount: '', iban: '', swift: '', footerText: '',
}

export default function CompanySettingsPage() {
  const [form, setForm] = useState<SupplierForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState<'logo' | 'signature' | null>(null)

  useEffect(() => {
    fetch('/api/accountant/settings')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json?.settings) return
        const s = json.settings.supplier_info
        if (s && typeof s === 'object') {
          setForm({
            name: s.name || '',
            ico: s.ico || '',
            dic: s.dic || '',
            registration: s.registration || '',
            email: s.email || '',
            phone: s.phone || '',
            address: s.address || '',
            city: s.city || '',
            zip: s.zip || '',
            web: s.web || '',
            bankAccount: s.bankAccount || '',
            iban: s.iban || '',
            swift: s.swift || '',
            footerText: '',
          })
          if (s.logo_url) setLogoUrl(s.logo_url)
          if (s.signature_url) setSignatureUrl(s.signature_url)
        }
        const footer = json.settings.invoice_footer_text
        if (footer) {
          setForm(prev => ({ ...prev, footerText: typeof footer === 'string' ? footer : '' }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const update = (key: keyof SupplierForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!form.name || !form.ico || !form.bankAccount) {
      toast.error('Vyplňte povinná pole: Název firmy, IČO a Číslo účtu')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/accountant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_info: {
            name: form.name,
            ico: form.ico,
            dic: form.dic,
            registration: form.registration,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            zip: form.zip,
            web: form.web || undefined,
            bankAccount: form.bankAccount,
            iban: form.iban,
            swift: form.swift || undefined,
          },
          invoice_footer_text: form.footerText || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      toast.success('Firemní údaje uloženy')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const handleAssetUpload = async (type: 'logo' | 'signature', file: File) => {
    setUploading(type)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/accountant/settings/assets', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      if (type === 'logo') setLogoUrl(data.url)
      else setSignatureUrl(data.url)

      toast.success(type === 'logo' ? 'Logo nahráno' : 'Razítko nahráno')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba při nahrávání')
    } finally {
      setUploading(null)
    }
  }

  const handleAssetDelete = async (type: 'logo' | 'signature') => {
    try {
      const response = await fetch(`/api/accountant/settings/assets?type=${type}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Delete failed')

      if (type === 'logo') setLogoUrl(null)
      else setSignatureUrl(null)

      toast.success(type === 'logo' ? 'Logo odstraněno' : 'Razítko odstraněno')
    } catch {
      toast.error('Chyba při mazání')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Základní informace + Kontakt */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Základní informace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company-name" className="text-xs">Název firmy *</Label>
              <Input id="company-name" placeholder="Účetní Svobodová s.r.o." value={form.name} onChange={e => update('name', e.target.value)} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-ico" className="text-xs">IČO *</Label>
              <Input id="company-ico" placeholder="12345678" value={form.ico} onChange={e => update('ico', e.target.value)} className="h-8" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company-dic" className="text-xs">DIČ</Label>
              <Input id="company-dic" placeholder="CZ12345678" value={form.dic} onChange={e => update('dic', e.target.value)} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-reg" className="text-xs">Registrace</Label>
              <Input id="company-reg" placeholder="C 12345 vedená u KS v Praze" value={form.registration} onChange={e => update('registration', e.target.value)} className="h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kontakt + Adresa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Kontakt a adresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company-email" className="text-xs">Email *</Label>
              <Input id="company-email" type="email" placeholder="info@ucetni-svobodova.cz" value={form.email} onChange={e => update('email', e.target.value)} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-phone" className="text-xs">Telefon</Label>
              <Input id="company-phone" type="tel" placeholder="+420 123 456 789" value={form.phone} onChange={e => update('phone', e.target.value)} className="h-8" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company-address" className="text-xs">Ulice *</Label>
              <Input id="company-address" placeholder="Na Poříčí 1041/12" value={form.address} onChange={e => update('address', e.target.value)} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-city" className="text-xs">Město *</Label>
              <Input id="company-city" placeholder="Praha 1" value={form.city} onChange={e => update('city', e.target.value)} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-zip" className="text-xs">PSČ *</Label>
              <Input id="company-zip" placeholder="110 00" value={form.zip} onChange={e => update('zip', e.target.value)} className="h-8" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-website" className="text-xs">Web</Label>
            <Input id="company-website" type="url" placeholder="https://www.ucetni-svobodova.cz" value={form.web} onChange={e => update('web', e.target.value)} className="h-8" />
          </div>
        </CardContent>
      </Card>

      {/* Banka */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bankovní spojení</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bank-account" className="text-xs">Číslo účtu *</Label>
              <Input id="bank-account" placeholder="123456789/0100" value={form.bankAccount} onChange={e => update('bankAccount', e.target.value)} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank-iban" className="text-xs">IBAN</Label>
              <Input id="bank-iban" placeholder="CZ65 0100 0000 0012 3456 7890" value={form.iban} onChange={e => update('iban', e.target.value)} className="h-8" />
            </div>
          </div>
          <div className="max-w-[200px] space-y-1.5">
            <Label htmlFor="bank-swift" className="text-xs">SWIFT/BIC</Label>
            <Input id="bank-swift" placeholder="KOMBCZPP" value={form.swift} onChange={e => update('swift', e.target.value)} className="h-8" />
          </div>
        </CardContent>
      </Card>

      {/* Logo a razítko */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Logo a razítko
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Logo firmy</Label>
              {logoUrl ? (
                <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 flex items-center gap-3">
                  <img src={logoUrl} alt="Logo" className="max-h-10 object-contain" />
                  <Button variant="ghost" size="sm" onClick={() => handleAssetDelete('logo')} className="text-red-600 h-7 px-2">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleAssetUpload('logo', file) }} disabled={uploading === 'logo'} />
                  {uploading === 'logo' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : (
                    <span className="flex items-center gap-2 text-xs text-gray-500"><Upload className="h-4 w-4" /> PNG, JPG, SVG</span>
                  )}
                </label>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Razítko / podpis</Label>
              {signatureUrl ? (
                <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 flex items-center gap-3">
                  <img src={signatureUrl} alt="Razítko" className="max-h-10 object-contain" />
                  <Button variant="ghost" size="sm" onClick={() => handleAssetDelete('signature')} className="text-red-600 h-7 px-2">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleAssetUpload('signature', file) }} disabled={uploading === 'signature'} />
                  {uploading === 'signature' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : (
                    <span className="flex items-center gap-2 text-xs text-gray-500"><Upload className="h-4 w-4" /> PNG, JPG</span>
                  )}
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patička */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Patička faktury
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="footer-text"
            placeholder="Faktura je splatná do 14 dnů od data vystavení.&#10;Účetní služby nejsou předmětem DPH dle § 51 ZDPH."
            rows={2}
            value={form.footerText}
            onChange={e => update('footerText', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Uložit */}
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          {saving ? 'Ukládám...' : 'Uložit změny'}
        </Button>
      </div>
    </div>
  )
}
