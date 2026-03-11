'use client'

import { useRouter } from 'next/navigation'
import { Camera, Receipt, Car, MessageCircle, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionOverlayProps {
  open: boolean
  onClose: () => void
  onAction: (action: 'scan' | 'invoice' | 'trip') => void
}

export function QuickActionOverlay({ open, onClose, onAction }: QuickActionOverlayProps) {
  const router = useRouter()

  const handleAction = (action: 'scan' | 'invoice' | 'trip') => {
    onClose()
    onAction(action)
  }

  const handleMessages = () => {
    onClose()
    router.push('/client/messages')
  }

  const handleStatement = () => {
    onClose()
    onAction('scan')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed inset-0 z-[46] flex items-center justify-center p-4 pointer-events-none transition-all duration-300',
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        )}
      >
        <div
          className={cn(
            'w-full max-w-sm bg-background rounded-2xl shadow-2xl p-6 pointer-events-auto',
            !open && 'pointer-events-none',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 3 primary buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleAction('scan')}
              className="w-full h-14 flex items-center gap-3 px-5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-base shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98]"
            >
              <Camera className="h-5 w-5 flex-shrink-0" />
              Nahrát doklad
            </button>

            <button
              onClick={() => handleAction('invoice')}
              className="w-full h-14 flex items-center gap-3 px-5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-medium text-base shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all active:scale-[0.98]"
            >
              <Receipt className="h-5 w-5 flex-shrink-0" />
              Vystavit fakturu
            </button>

            <button
              onClick={() => handleAction('trip')}
              className="w-full h-14 flex items-center gap-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium text-base shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all active:scale-[0.98]"
            >
              <Car className="h-5 w-5 flex-shrink-0" />
              Zapsat jízdu
            </button>
          </div>

          {/* 2 secondary buttons */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={handleMessages}
              className="h-12 flex items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" />
              Zprávy
            </button>

            <button
              onClick={handleStatement}
              className="h-12 flex items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors active:scale-[0.98]"
            >
              <FileText className="h-4 w-4" />
              Nahrát výpis
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
