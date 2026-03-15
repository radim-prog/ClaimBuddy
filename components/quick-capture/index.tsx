'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { QuickCaptureDialog } from './quick-capture-dialog'

export function QuickCaptureButton() {
  const [open, setOpen] = useState(false)

  const handleOpen = useCallback(() => setOpen(true), [])

  // Keyboard shortcut Ctrl+N / Cmd+N
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleOpen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleOpen])

  return (
    <>
      <button
        onClick={handleOpen}
        title="Rychlý záznam (Ctrl+N)"
        data-tour="quick-add"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
      >
        <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform" />
      </button>

      <QuickCaptureDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
