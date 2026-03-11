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
    <div
      className={cn(
        'fixed inset-0 z-[60]',
        'bg-background md:bg-black/50 md:backdrop-blur-sm',
        'flex flex-col md:items-center md:justify-center md:p-6',
        'transition-all duration-300 ease-out',
        open ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:opacity-0 pointer-events-none',
      )}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex flex-col flex-1 md:flex-initial w-full md:max-w-2xl md:max-h-[85vh] md:rounded-2xl md:shadow-2xl md:bg-background overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h2 className="text-lg font-bold font-display">Vystavit fakturu</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {open && (
            <ClientInvoiceForm
              companyId={companyId}
              onClose={onClose}
              onCreated={onClose}
            />
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
