'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Mail, Send, Clock, XCircle, RefreshCw, UserPlus, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Invitation {
  id: string
  invited_email: string
  status: string
  expires_at: string
  created_at: string
  accepted_at: string | null
}

interface InviteClientDialogProps {
  companyId: string
  companyName: string
  companyIco?: string
  hasOwner: boolean
}

export function InviteClientDialog({ companyId, companyName, companyIco, hasOwner }: InviteClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)

  const pendingInvite = invitations.find(i => i.status === 'pending')

  const loadInvitations = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/invite`)
      if (res.ok) setInvitations(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (open) loadInvitations()
  }, [open])

  const handleSend = async () => {
    if (!email.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Pozvánka odeslána!')
        setEmail('')
        loadInvitations()
      } else {
        toast.error(data.error || 'Nepodařilo se odeslat pozvánku')
      }
    } catch {
      toast.error('Chyba při odesílání pozvánky')
    } finally {
      setSending(false)
    }
  }

  const handleCancel = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/invite`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      })
      if (res.ok) {
        toast.success('Pozvánka zrušena')
        loadInvitations()
      }
    } catch {
      toast.error('Nepodařilo se zrušit pozvánku')
    }
  }

  const handleResend = async () => {
    if (!pendingInvite) return
    // Cancel old + send new
    await handleCancel(pendingInvite.id)
    setEmail(pendingInvite.invited_email)
    // Will re-trigger send after state update
  }

  if (hasOwner) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="text-muted-foreground">Klient je propojen s portálem</span>
      </div>
    )
  }

  if (pendingInvite && !open) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-muted-foreground">
            Pozvánka odeslána na <strong>{pendingInvite.invited_email}</strong>
          </span>
          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
            Čeká
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <RefreshCw className="h-3 w-3 mr-1" /> Spravovat
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <UserPlus className="h-4 w-4 mr-2" />
          Pozvat klienta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pozvat klienta do portálu</DialogTitle>
          <DialogDescription>
            Klient obdrží email s odkazem na registraci a po přijetí uvidí tuto firmu v klientském portálu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium">{companyName}</p>
            {companyIco && <p className="text-muted-foreground">IČO: {companyIco}</p>}
          </div>

          {pendingInvite ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Čekající pozvánka
                  </p>
                  <p className="text-amber-600 dark:text-amber-300">
                    {pendingInvite.invited_email}
                  </p>
                  <p className="text-xs text-amber-500 mt-1">
                    Platná do {new Date(pendingInvite.expires_at).toLocaleDateString('cs-CZ')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleResend}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Odeslat znovu
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleCancel(pendingInvite.id)}>
                  <XCircle className="h-3 w-3 mr-1" /> Zrušit
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="invite-email" className="text-sm font-medium">
                  Email klienta
                </label>
                <div className="flex gap-2">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="klient@firma.cz"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                  />
                  <Button onClick={handleSend} disabled={sending || !email.trim()}>
                    <Send className="h-4 w-4 mr-1" />
                    {sending ? 'Odesílám...' : 'Odeslat'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Pozvánka bude platná 7 dní. Klient se zaregistruje a bude automaticky propojen s touto firmou.
              </p>
            </div>
          )}

          {/* History */}
          {invitations.filter(i => i.status !== 'pending').length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Historie pozvánek</p>
              <div className="space-y-1.5">
                {invitations.filter(i => i.status !== 'pending').slice(0, 5).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{inv.invited_email}</span>
                    <Badge variant="outline" className={`text-[10px] ${
                      inv.status === 'accepted' ? 'text-green-600 border-green-300' :
                      inv.status === 'expired' ? 'text-gray-400 border-gray-200' :
                      'text-red-500 border-red-200'
                    }`}>
                      {inv.status === 'accepted' ? 'Přijato' :
                       inv.status === 'expired' ? 'Vypršelo' : 'Zrušeno'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
