'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search, Loader2, Building2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface AddCompanyDialogProps {
  onCompanyAdded?: () => void
  trigger?: React.ReactNode
}

export function AddCompanyDialog({ onCompanyAdded, trigger }: AddCompanyDialogProps) {
  const [open, setOpen] = useState(false)
  const [ico, setIco] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Auto-filled from ARES
  const [name, setName] = useState('')
  const [dic, setDic] = useState('')
  const [legalForm, setLegalForm] = useState('')
  const [address, setAddress] = useState('')
  const [vatPayer, setVatPayer] = useState(false)
  const [aresLoaded, setAresLoaded] = useState(false)

  // Client-provided
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [managingDirector, setManagingDirector] = useState('')

  const resetForm = () => {
    setIco('')
    setName('')
    setDic('')
    setLegalForm('')
    setAddress('')
    setVatPayer(false)
    setAresLoaded(false)
    setEmail('')
    setPhone('')
    setManagingDirector('')
    setSuccess(false)
  }

  const handleLookup = async () => {
    const cleanIco = ico.replace(/\s/g, '')
    if (cleanIco.length !== 8) {
      toast.error('IČO musí mít 8 číslic')
      return
    }

    setLookingUp(true)
    try {
      const res = await fetch(`/api/ares?ico=${cleanIco}`)
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Firma nenalezena v ARES')
        return
      }

      setName(data.name || '')
      setDic(data.dic || '')
      setLegalForm(data.legal_form || '')
      setVatPayer(data.vat_payer || false)
      const addr = data.address
      if (addr) {
        setAddress([addr.street, addr.city, addr.zip].filter(Boolean).join(', '))
      }
      setAresLoaded(true)
      toast.success('Data načtena z ARES')
    } catch {
      toast.error('Nepodařilo se spojit s ARES')
    } finally {
      setLookingUp(false)
    }
  }

  const handleSubmit = async () => {
    const cleanIco = ico.replace(/\s/g, '')
    if (cleanIco.length !== 8) {
      toast.error('IČO musí mít 8 číslic')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/client/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ico: cleanIco,
          name: name || undefined,
          email: email || undefined,
          phone: phone || undefined,
          managing_director: managingDirector || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Nepodařilo se přidat firmu')
        return
      }

      setSuccess(true)
      toast.success('Firma odeslána ke schválení')
      onCompanyAdded?.()

      // Close after brief success state
      setTimeout(() => {
        setOpen(false)
        resetForm()
      }, 1500)
    } catch {
      toast.error('Chyba při odesílání')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Přidat firmu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Building2 className="h-5 w-5" />
            Přidat firmu
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-medium">Firma odeslána ke schválení</p>
            <p className="text-sm text-muted-foreground text-center">
              Váš účetní firmu zkontroluje a schválí. Poté se vám zobrazí v portálu.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ICO + ARES lookup */}
            <div>
              <Label>IČO</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={ico}
                  onChange={e => { setIco(e.target.value); setAresLoaded(false) }}
                  placeholder="12345678"
                  maxLength={8}
                  className="h-11 font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLookup}
                  disabled={lookingUp || ico.replace(/\s/g, '').length !== 8}
                  className="shrink-0"
                >
                  {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-1 hidden sm:inline">ARES</span>
                </Button>
              </div>
            </div>

            {/* ARES auto-filled fields (read-only preview) */}
            {aresLoaded && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 space-y-1.5 text-sm">
                <p className="font-medium text-green-800 dark:text-green-300">{name}</p>
                {dic && <p className="text-muted-foreground">DIČ: {dic}</p>}
                <p className="text-muted-foreground">{legalForm}{vatPayer ? ' | Plátce DPH' : ''}</p>
                {address && <p className="text-muted-foreground">{address}</p>}
              </div>
            )}

            {/* Client-provided fields */}
            <div>
              <Label>Kontaktní email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="info@firma.cz"
                className="mt-1 h-11"
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+420 123 456 789"
                className="mt-1 h-11"
              />
            </div>
            <div>
              <Label>Jednatel / kontaktní osoba</Label>
              <Input
                value={managingDirector}
                onChange={e => setManagingDirector(e.target.value)}
                placeholder="Jan Novák"
                className="mt-1 h-11"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={saving || ico.replace(/\s/g, '').length !== 8}
              className="w-full"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Odesílám...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" />Odeslat ke schválení</>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Firma bude viditelná po schválení účetním.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
