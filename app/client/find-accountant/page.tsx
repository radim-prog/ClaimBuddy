'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Send, CheckCircle2, Building2 } from 'lucide-react'
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

export default function FindAccountantPage() {
  const { userName, selectedCompany, selectedCompanyId } = useClientUser()
  const [location, setLocation] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [budget, setBudget] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!location && !businessType && !note) {
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
          preferred_location: location,
          business_type: businessType,
          budget_range: budget,
          note,
          source: 'find_accountant_form',
        }),
      })

      if (res.status === 429) {
        toast.info('Už jste nedávno odeslali poptávku. Ozveme se vám.')
        setSent(true)
        return
      }

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Nepodařilo se odeslat')
        return
      }

      setSent(true)
      toast.success('Poptávka odeslána!')
    } catch {
      toast.error('Chyba při odesílání')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Děkujeme za zájem!</h1>
        <p className="text-muted-foreground">
          Vaši poptávku jsme přijali. Ozveme se vám co nejdříve s nabídkou účetních služeb.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          Chci účetní
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vyplňte krátký formulář a my vám najdeme vhodnou účetní.
        </p>
      </div>

      <Card className="rounded-xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pre-filled info */}
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
              <Label htmlFor="location">Preferovaná lokalita</Label>
              <Input
                id="location"
                placeholder="např. Praha, Brno, online..."
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-type">Typ podnikání</Label>
              <select
                id="business-type"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
              >
                <option value="">Vyberte...</option>
                {BUSINESS_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Rozpočet na účetní</Label>
              <select
                id="budget"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={budget}
                onChange={e => setBudget(e.target.value)}
              >
                <option value="">Vyberte...</option>
                {BUDGET_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Poznámka</Label>
              <textarea
                id="note"
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="Napište nám co potřebujete, jaké máte požadavky..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? 'Odesílám...' : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Odeslat poptávku
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
