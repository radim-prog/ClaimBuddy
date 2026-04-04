'use client'

import { useState } from 'react'
import { Building2, Search, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type AresResult = {
  name: string
  ico: string
  dic?: string | null
  legal_form?: string
  address?: { street: string; city: string; zip: string }
  vat_payer?: boolean
}

export function AddFirstCompany({ onCreated }: { onCreated: () => void }) {
  const [ico, setIco] = useState('')
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [aresResult, setAresResult] = useState<AresResult | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    const cleaned = ico.replace(/\s/g, '')
    if (!/^\d{8}$/.test(cleaned)) {
      setError('IČO musí být 8 číslic')
      return
    }

    setError('')
    setSearching(true)
    setAresResult(null)

    try {
      const res = await fetch(`/api/ares?ico=${cleaned}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Firma nenalezena')
        return
      }
      const data = await res.json()
      setAresResult(data)
    } catch {
      setError('Chyba při vyhledávání v ARES')
    } finally {
      setSearching(false)
    }
  }

  const handleCreate = async () => {
    if (!aresResult) return
    setCreating(true)

    try {
      const res = await fetch('/api/client/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ico: aresResult.ico, name: aresResult.name }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Nepodařilo se vytvořit firmu')
        return
      }

      toast.success('Firma byla přidána!')
      onCreated()
    } catch {
      toast.error('Chyba při vytváření firmy')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 px-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-bold">Vítejte! Přidejte svou firmu</h2>
            <p className="text-sm text-muted-foreground">
              Zadejte IČO a my vyhledáme údaje z registru ARES
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Zadejte IČO (8 číslic)"
                value={ico}
                onChange={(e) => {
                  setIco(e.target.value)
                  setError('')
                  setAresResult(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                maxLength={10}
                className="font-mono"
              />
              <Button onClick={handleSearch} disabled={searching || ico.replace(/\s/g, '').length < 8}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {aresResult && (
              <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold">{aresResult.name}</p>
                    <p className="text-sm text-muted-foreground">IČO: {aresResult.ico}</p>
                    {aresResult.dic && <p className="text-sm text-muted-foreground">DIČ: {aresResult.dic}</p>}
                    {aresResult.address && (
                      <p className="text-sm text-muted-foreground">
                        {[aresResult.address.street, aresResult.address.city, aresResult.address.zip].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <Button onClick={handleCreate} disabled={creating} className="w-full mt-3">
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vytvářím...
                    </>
                  ) : (
                    'Přidat firmu'
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
