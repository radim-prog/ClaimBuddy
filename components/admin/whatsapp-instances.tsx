'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  QrCode,
  Unplug,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Firm {
  id: string
  name: string
}

interface EvolutionInstance {
  id: string
  firm_id: string
  instance_name: string
  phone_number: string | null
  status: 'connected' | 'disconnected' | 'connecting'
  created_at: string
  updated_at: string
  accounting_firms: { id: string; name: string } | null
}

interface QRData {
  pairingCode?: string
  code?: string
  base64?: string
  count: number
}

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: EvolutionInstance['status'] }) {
  if (status === 'connected') {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Připojeno
      </Badge>
    )
  }
  if (status === 'connecting') {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
        <Clock className="h-3 w-3 mr-1" />
        Připojování
      </Badge>
    )
  }
  return (
    <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700">
      <AlertCircle className="h-3 w-3 mr-1" />
      Nepřipojeno
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// QR code dialog
// ---------------------------------------------------------------------------

function QRDialog({
  open,
  onClose,
  instanceName,
}: {
  open: boolean
  onClose: () => void
  instanceName: string
}) {
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setQrData(null)
    setError(null)
    setLoading(true)

    fetch(`/api/accountant/whatsapp/qr?instance=${encodeURIComponent(instanceName)}`)
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error ?? `HTTP ${res.status}`)
        }
        return res.json() as Promise<QRData>
      })
      .then(setQrData)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Nepodařilo se načíst QR kód'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [open, instanceName])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>QR kód — {instanceName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Načítám QR kód...</span>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          {qrData && (
            <>
              {qrData.base64 ? (
                <img
                  src={qrData.base64}
                  alt="WhatsApp QR kód"
                  className="w-56 h-56 rounded border border-border"
                />
              ) : qrData.code ? (
                <div className="font-mono text-sm break-all bg-muted p-3 rounded">
                  {qrData.code}
                </div>
              ) : null}

              {qrData.pairingCode && (
                <p className="text-sm text-muted-foreground">
                  Párovací kód: <span className="font-semibold font-mono">{qrData.pairingCode}</span>
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Otevřete WhatsApp → Nastavení → Propojená zařízení → Přidat zařízení
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Zavřít</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Create instance dialog
// ---------------------------------------------------------------------------

function CreateInstanceDialog({
  open,
  onClose,
  onCreated,
  firms,
}: {
  open: boolean
  onClose: () => void
  onCreated: (instance: EvolutionInstance) => void
  firms: Firm[]
}) {
  const [firmId, setFirmId] = useState('')
  const [instanceName, setInstanceName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [saving, setSaving] = useState(false)

  function reset() {
    setFirmId('')
    setInstanceName('')
    setPhoneNumber('')
  }

  async function handleCreate() {
    if (!firmId) {
      toast.error('Vyberte firmu')
      return
    }
    if (!instanceName.trim()) {
      toast.error('Zadejte název instance')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/accountant/admin/whatsapp-instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firm_id: firmId,
          instance_name: instanceName.trim(),
          phone_number: phoneNumber.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Nepodařilo se vytvořit instanci')
        return
      }

      toast.success(`Instance "${instanceName}" vytvořena`)
      onCreated(data.instance as EvolutionInstance)
      reset()
      onClose()
    } catch (err: unknown) {
      console.error('[CreateInstance]', err)
      toast.error('Nepodařilo se vytvořit instanci')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nová WhatsApp instance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="firm-select">Firma</Label>
            <Select value={firmId} onValueChange={setFirmId}>
              <SelectTrigger id="firm-select">
                <SelectValue placeholder="Vyberte firmu..." />
              </SelectTrigger>
              <SelectContent>
                {firms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="instance-name">Název instance</Label>
            <Input
              id="instance-name"
              placeholder="napr. firma-novak-wa"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Musí být jedinečný v rámci Evolution API (pouze písmena, čísla, pomlčky)
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone-number">Telefonní číslo (volitelné)</Label>
            <Input
              id="phone-number"
              placeholder="+420 777 000 111"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm" onClick={reset}>Zrušit</Button>
          </DialogClose>
          <Button size="sm" onClick={handleCreate} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Vytvářím...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Vytvořit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WhatsAppInstances() {
  const [instances, setInstances] = useState<EvolutionInstance[]>([])
  const [firms, setFirms] = useState<Firm[]>([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [qrInstance, setQrInstance] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)

  const loadInstances = useCallback(async () => {
    try {
      const res = await fetch('/api/accountant/admin/whatsapp-instances')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setInstances(data.instances ?? [])
    } catch (err: unknown) {
      console.error('[WhatsAppInstances] load error', err)
      toast.error('Nepodařilo se načíst instance')
    }
  }, [])

  const loadFirms = useCallback(async () => {
    try {
      const res = await fetch('/api/accountant/admin/tenants')
      if (!res.ok) return
      const data = await res.json()
      const firmList: Firm[] = (data.firms ?? []).map((f: { id: string; name: string }) => ({
        id: f.id,
        name: f.name,
      }))
      setFirms(firmList)
    } catch (err: unknown) {
      console.error('[WhatsAppInstances] firms load error', err)
    }
  }, [])

  useEffect(() => {
    Promise.all([loadInstances(), loadFirms()]).finally(() => setLoading(false))
  }, [loadInstances, loadFirms])

  async function handleConnect(instance: EvolutionInstance) {
    setConnectingId(instance.id)
    try {
      // Update DB status to 'connecting'
      await fetch('/api/accountant/admin/whatsapp-instances', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: instance.id, status: 'connecting' }),
      })
      setInstances((prev) =>
        prev.map((i) => (i.id === instance.id ? { ...i, status: 'connecting' } : i))
      )
      // Open QR dialog
      setQrInstance(instance.instance_name)
    } catch (err: unknown) {
      console.error('[Connect]', err)
      toast.error('Nepodařilo se spustit připojení')
    } finally {
      setConnectingId(null)
    }
  }

  async function handleDisconnect(instance: EvolutionInstance) {
    setDisconnectingId(instance.id)
    try {
      const res = await fetch(
        `/api/accountant/whatsapp/disconnect?instance=${encodeURIComponent(instance.instance_name)}`,
        { method: 'POST' }
      )

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? 'Odpojení se nezdařilo')
        return
      }

      // Update DB status
      await fetch('/api/accountant/admin/whatsapp-instances', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: instance.id, status: 'disconnected' }),
      })

      setInstances((prev) =>
        prev.map((i) => (i.id === instance.id ? { ...i, status: 'disconnected' } : i))
      )
      toast.success(`Instance "${instance.instance_name}" odpojena`)
    } catch (err: unknown) {
      console.error('[Disconnect]', err)
      toast.error('Nepodařilo se odpojit instanci')
    } finally {
      setDisconnectingId(null)
    }
  }

  async function handleDelete(instance: EvolutionInstance) {
    if (
      !window.confirm(
        `Opravdu smazat instanci "${instance.instance_name}"? Tuto akci nelze vrátit.`
      )
    ) {
      return
    }

    setDeletingId(instance.id)
    try {
      const res = await fetch(
        `/api/accountant/admin/whatsapp-instances?id=${instance.id}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? 'Smazání se nezdařilo')
        return
      }

      setInstances((prev) => prev.filter((i) => i.id !== instance.id))
      toast.success(`Instance "${instance.instance_name}" smazána`)
    } catch (err: unknown) {
      console.error('[Delete]', err)
      toast.error('Nepodařilo se smazat instanci')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Načítání instancí...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {instances.length === 0
            ? 'Zatím žádné instance.'
            : `${instances.length} ${instances.length === 1 ? 'instance' : instances.length < 5 ? 'instance' : 'instancí'}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLoading(true)
              loadInstances().finally(() => setLoading(false))
            }}
            title="Obnovit"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nová instance
          </Button>
        </div>
      </div>

      {instances.length > 0 && (
        <div className="divide-y divide-border rounded-md border">
          {instances.map((instance) => {
            const firmName = instance.accounting_firms?.name ?? instance.firm_id
            const isDeleting = deletingId === instance.id
            const isConnecting = connectingId === instance.id
            const isDisconnecting = disconnectingId === instance.id
            const isBusy = isDeleting || isConnecting || isDisconnecting

            return (
              <div
                key={instance.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{instance.instance_name}</span>
                    <StatusBadge status={instance.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Firma: {firmName}
                    {instance.phone_number && (
                      <span className="ml-2 text-muted-foreground/70">
                        · {instance.phone_number}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {instance.status !== 'connected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(instance)}
                      disabled={isBusy}
                      title="Připojit — zobrazí QR kód"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4" />
                      )}
                      <span className="ml-1.5 hidden sm:inline">Připojit</span>
                    </Button>
                  )}

                  {instance.status === 'connected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(instance)}
                      disabled={isBusy}
                      title="Odpojit instanci"
                    >
                      {isDisconnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Unplug className="h-4 w-4" />
                      )}
                      <span className="ml-1.5 hidden sm:inline">Odpojit</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(instance)}
                    disabled={isBusy}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Smazat instanci"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CreateInstanceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(newInstance) => setInstances((prev) => [newInstance, ...prev])}
        firms={firms}
      />

      {qrInstance && (
        <QRDialog
          open={!!qrInstance}
          onClose={() => setQrInstance(null)}
          instanceName={qrInstance}
        />
      )}
    </div>
  )
}
