'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type ConnectionStatus = 'unconfigured' | 'connected' | 'failed'

export function SigniSettings() {
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('unconfigured')
  const [isConfigured, setIsConfigured] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/accountant/signing/settings')
        if (res.ok) {
          const data = await res.json()
          setIsConfigured(!!data.configured)
          setStatus(data.configured ? 'connected' : 'unconfigured')
        }
      } catch (err: unknown) {
        console.error('Chyba při načítání nastavení Signi:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  async function handleTest() {
    if (!apiKey && !isConfigured) {
      toast.error('Nejprve zadejte API klíč')
      return
    }
    setIsTesting(true)
    try {
      const res = await fetch('/api/accountant/signing/settings')
      if (res.ok) {
        setStatus('connected')
        toast.success('Připojení k Signi.com úspěšné')
      } else {
        setStatus('failed')
        toast.error('Připojení se nezdařilo — zkontrolujte API klíč')
      }
    } catch (err: unknown) {
      console.error('Chyba při testování připojení:', err)
      setStatus('failed')
      toast.error('Nepodařilo se otestovat připojení')
    } finally {
      setIsTesting(false)
    }
  }

  async function handleSave() {
    if (!apiKey.trim()) {
      toast.error('Zadejte API klíč')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/accountant/signing/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signi_api_key: apiKey.trim() }),
      })
      if (res.ok) {
        setIsConfigured(true)
        setStatus('connected')
        setApiKey('')
        toast.success('API klíč uložen')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? 'Nepodařilo se uložit nastavení')
      }
    } catch (err: unknown) {
      console.error('Chyba při ukládání nastavení Signi:', err)
      toast.error('Nepodařilo se uložit nastavení')
    } finally {
      setIsSaving(false)
    }
  }

  function StatusBadge() {
    if (status === 'connected') {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Připojeno
        </Badge>
      )
    }
    if (status === 'failed') {
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Nepřipojeno
        </Badge>
      )
    }
    return (
      <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700">
        <KeyRound className="h-3 w-3 mr-1" />
        Nekonfigurováno
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Načítání...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Stav připojení:</span>
        <StatusBadge />
      </div>

      {isConfigured && (
        <p className="text-sm text-muted-foreground">
          API klíč je nastaven. Zadejte nový klíč níže pro aktualizaci.
        </p>
      )}

      <div className="space-y-2 max-w-md">
        <Label htmlFor="signi-api-key">
          {isConfigured ? 'Nový API klíč (pro změnu)' : 'API klíč'}
        </Label>
        <Input
          id="signi-api-key"
          type="password"
          placeholder={isConfigured ? '••••••••••••••••' : 'Zadejte Signi API klíč'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={isTesting || isSaving}
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testuji...
            </>
          ) : (
            'Testovat připojení'
          )}
        </Button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || isTesting || !apiKey.trim()}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Ukládám...
            </>
          ) : (
            'Uložit'
          )}
        </Button>
      </div>
    </div>
  )
}
