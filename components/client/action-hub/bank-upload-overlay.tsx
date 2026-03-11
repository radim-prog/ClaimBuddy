'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BankStatementUpload } from '@/components/client/bank-statement-upload'

interface BankUploadOverlayProps {
  open: boolean
  companyId: string
  companies: Array<{ id: string; name: string }>
  onClose: () => void
}

export function BankUploadOverlay({ open, companyId: initialCompanyId, companies, onClose }: BankUploadOverlayProps) {
  const [companyId, setCompanyId] = useState(initialCompanyId)

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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-bold font-display">Nahrát výpis</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Company selector if multiple */}
            {companies.length > 1 && (
              <div>
                <Label className="mb-1.5 block text-sm">Firma</Label>
                <select
                  value={companyId}
                  onChange={e => setCompanyId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {open && (
              <BankStatementUpload
                companyId={companyId}
                onUploadComplete={() => {
                  setTimeout(() => onClose(), 2000)
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
