'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  X, Camera, Upload, Loader2, CheckCircle2, AlertCircle, ImagePlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExtractionStatusBadge } from './extraction-status-badge'
import { captureDocument, pickDocument } from '@/lib/camera-service'
import { toast } from 'sonner'

interface CaptureItem {
  id: string
  file: File
  previewUrl: string
  status: 'queued' | 'uploading' | 'extracting' | 'done' | 'error'
  fileName: string
  documentId?: string
}

interface RapidCaptureOverlayProps {
  open: boolean
  companyId: string
  onClose: () => void
  onComplete?: (count: number) => void
}

export function RapidCaptureOverlay({ open, companyId, onClose, onComplete }: RapidCaptureOverlayProps) {
  const [items, setItems] = useState<CaptureItem[]>([])
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFile = useCallback((file: File) => {
    const item: CaptureItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'queued',
      fileName: file.name,
    }
    setItems(prev => [...prev, item])
  }, [])

  const handleCapture = async () => {
    const file = await captureDocument({ source: 'camera' })
    if (file) addFile(file)
  }

  const handlePick = async () => {
    const file = await pickDocument()
    if (file) addFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (let i = 0; i < files.length; i++) {
      addFile(files[i])
    }
    e.target.value = ''
  }

  const processItem = async (item: CaptureItem): Promise<CaptureItem> => {
    // Step 1: Upload
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading' as const } : i))

    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const uploadForm = new FormData()
    uploadForm.append('file', item.file)
    uploadForm.append('companyId', companyId)
    uploadForm.append('period', period)
    uploadForm.append('type', 'expense_invoice')

    try {
      const uploadRes = await fetch('/api/documents/upload', {
        method: 'POST',
        body: uploadForm,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      const uploadData = await uploadRes.json()
      const documentId = uploadData.document?.id

      // Step 2: Extract
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'extracting' as const, documentId } : i))

      const extractForm = new FormData()
      extractForm.append('file', item.file)
      extractForm.append('documentType', 'invoice')
      extractForm.append('companyId', companyId)

      try {
        await fetch('/api/client/extract', {
          method: 'POST',
          body: extractForm,
        })
      } catch {
        // Extraction failure is non-fatal — file is already uploaded
      }

      return { ...item, status: 'done', documentId }
    } catch {
      return { ...item, status: 'error' }
    }
  }

  const processAll = async () => {
    const queued = items.filter(i => i.status === 'queued')
    if (queued.length === 0) return

    setProcessing(true)

    for (const item of queued) {
      const result = await processItem(item)
      setItems(prev => prev.map(i => i.id === item.id ? result : i))
    }

    setProcessing(false)

    const doneCount = items.filter(i => i.status === 'done').length + queued.filter(i => items.find(r => r.id === i.id)?.status === 'done').length
    toast.success(`${queued.length} dokladů zpracováno`)
  }

  const handleDone = () => {
    const doneCount = items.filter(i => i.status === 'done').length
    onComplete?.(doneCount)
    setItems([])
    onClose()
  }

  const removeItem = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter(i => i.id !== id)
    })
  }

  const queuedCount = items.filter(i => i.status === 'queued').length
  const doneCount = items.filter(i => i.status === 'done').length
  const errorCount = items.filter(i => i.status === 'error').length

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
      <div className="flex flex-col flex-1 md:flex-initial w-full md:max-w-lg md:max-h-[85vh] md:rounded-2xl md:shadow-2xl md:bg-background overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold font-display">Rychlé skenování</h2>
            <p className="text-xs text-muted-foreground">Foťte více dokladů za sebou</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Hidden file input for multi-select */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Capture buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button className="h-14 gap-2" onClick={handleCapture}>
              <Camera className="w-5 h-5" />
              Vyfotit
            </Button>
            <Button variant="outline" className="h-14 gap-2" onClick={handlePick}>
              <Upload className="w-5 h-5" />
              Vybrat soubor
            </Button>
          </div>

          {/* Multi-file upload button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="w-4 h-4" />
            Přidat více souborů najednou
          </Button>

          {/* Queue */}
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  Fronta ({items.length})
                </h3>
                {queuedCount > 0 && doneCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {doneCount}/{items.length} hotovo
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {items.length > 0 && (
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${items.length > 0 ? (doneCount / items.length) * 100 : 0}%` }}
                  />
                </div>
              )}

              {/* Items */}
              <div className="space-y-1.5">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg border',
                      item.status === 'done' && 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10',
                      item.status === 'error' && 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10',
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.file.type.startsWith('image/') ? (
                        <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Upload className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.fileName}</p>
                      <div className="flex items-center gap-1.5">
                        {item.status === 'queued' && (
                          <span className="text-xs text-muted-foreground">Ve frontě</span>
                        )}
                        {item.status === 'uploading' && (
                          <span className="text-xs text-blue-600 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Nahrávání...
                          </span>
                        )}
                        {item.status === 'extracting' && (
                          <span className="text-xs text-purple-600 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Vytěžování...
                          </span>
                        )}
                        {item.status === 'done' && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Hotovo
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Chyba
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove */}
                    {item.status === 'queued' && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-muted-foreground hover:text-red-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Vyfoťte nebo nahrajte doklady</p>
              <p className="text-xs mt-1">Můžete přidat více najednou</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t shrink-0 space-y-2">
            {queuedCount > 0 && (
              <Button
                className="w-full"
                onClick={processAll}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : null}
                Zpracovat {queuedCount} doklad{queuedCount === 1 ? '' : queuedCount < 5 ? 'y' : 'ů'}
              </Button>
            )}
            {queuedCount === 0 && doneCount > 0 && (
              <Button className="w-full" onClick={handleDone}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Hotovo ({doneCount} zpracováno{errorCount > 0 ? `, ${errorCount} chyb` : ''})
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
