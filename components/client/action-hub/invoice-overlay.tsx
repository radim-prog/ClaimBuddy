'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClientInvoiceForm } from '@/components/client/invoice-form'

interface InvoiceOverlayProps {
  open: boolean
  companyId: string
  onClose: () => void
}

export function InvoiceOverlay({ open, companyId, onClose }: InvoiceOverlayProps) {
  return (
    <div className={cn(
      'fixed inset-0 z-[60] bg-background flex flex-col',
      'transition-transform duration-300 ease-out',
      open ? 'translate-y-0' : 'translate-y-full pointer-events-none',
    )}>
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h2 className="text-lg font-bold font-display">Vystavit fakturu</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {open && (
          <ClientInvoiceForm
            companyId={companyId}
            onClose={onClose}
            onCreated={onClose}
          />
        )}
      </div>
    </div>
  )
}
