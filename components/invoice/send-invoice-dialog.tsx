'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import type { Invoice } from '@/lib/mock-data'

interface SendInvoiceDialogProps {
  invoice: Invoice
  open: boolean
  onOpenChange: (open: boolean) => void
  onSent: (updatedInvoice: Invoice) => void
  defaultEmail?: string
}

export function SendInvoiceDialog({
  invoice,
  open,
  onOpenChange,
  onSent,
  defaultEmail = '',
}: SendInvoiceDialogProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Zadejte platný email')
      return
    }

    setSending(true)
    try {
      const response = await fetch(`/api/accountant/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send')
      }

      if (data.provider === 'none') {
        toast.success('Faktura označena jako odeslaná', {
          description: 'Email provider není nastaven (SENDGRID_API_KEY). Faktura byla označena jako odeslaná, ale email nebyl odeslán.',
        })
      } else {
        toast.success(`Faktura odeslána na ${email}`)
      }

      if (data.invoice) {
        onSent(data.invoice)
      }
      onOpenChange(false)
    } catch (err) {
      toast.error('Chyba při odesílání', {
        description: err instanceof Error ? err.message : 'Zkuste to znovu',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-600" />
            Odeslat fakturu emailem
          </DialogTitle>
          <DialogDescription>
            Faktura {invoice.invoice_number} bude odeslána jako PDF příloha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email odběratele</Label>
            <Input
              id="email"
              type="email"
              placeholder="firma@example.cz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm space-y-1">
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Číslo faktury:</strong> {invoice.invoice_number}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Odběratel:</strong> {invoice.customer?.name || invoice.company_name}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Částka:</strong>{' '}
              {invoice.total_with_vat.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Zrušit
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !email}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Odesílám...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Odeslat
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
