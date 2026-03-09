'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  onUploaded?: () => void
  /** When set, auto-links uploaded documents to this task */
  taskId?: string
  userId?: string
  userName?: string
}

const DOC_TYPES = [
  { value: 'bank_statement', label: 'Výpis z banky' },
  { value: 'expense_invoice', label: 'Nákladová faktura' },
  { value: 'income_invoice', label: 'Příjmová faktura' },
  { value: 'receipt', label: 'Účtenka' },
  { value: 'contract', label: 'Smlouva' },
  { value: 'other', label: 'Ostatní' },
]

function getCurrentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getPeriodOptions() {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

  // Current year + previous year
  for (let y = now.getFullYear(); y >= now.getFullYear() - 1; y--) {
    const maxMonth = y === now.getFullYear() ? now.getMonth() : 11
    for (let m = maxMonth; m >= 0; m--) {
      const value = `${y}-${String(m + 1).padStart(2, '0')}`
      options.push({ value, label: `${months[m]} ${y}` })
    }
  }
  return options
}

export function UploadDialog({ open, onOpenChange, companyId, onUploaded, taskId, userId, userName }: UploadDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [docType, setDocType] = useState('expense_invoice')
  const [period, setPeriod] = useState(getCurrentPeriod())
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const periodOptions = getPeriodOptions()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Vyberte soubor')
      return
    }

    setUploading(true)
    let successCount = 0
    const headers: Record<string, string> = {}
    if (userId) headers['x-user-id'] = userId
    if (userName) headers['x-user-name'] = userName

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyId', companyId)
      formData.append('period', period)
      formData.append('type', docType)

      try {
        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          headers,
          body: formData,
        })
        if (res.ok) {
          successCount++
          // Auto-link to task if taskId is provided
          if (taskId) {
            const data = await res.json().catch(() => null)
            if (data?.document?.id) {
              await fetch(`/api/tasks/${taskId}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ documentIds: [data.document.id] }),
              }).catch(() => {})
            }
          }
        } else {
          const data = await res.json().catch(() => ({}))
          toast.error(`Chyba: ${file.name} — ${data.error || 'Upload selhal'}`)
        }
      } catch {
        toast.error(`Chyba při nahrávání ${file.name}`)
      }
    }

    setUploading(false)

    if (successCount > 0) {
      toast.success(`Nahráno ${successCount} ${successCount === 1 ? 'soubor' : successCount < 5 ? 'soubory' : 'souborů'}`)
      setFiles([])
      onUploaded?.()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-purple-600" />
            Nahrát dokument
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.doc,.docx"
            />
            {files.length > 0 ? (
              <div className="space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <FileText className="h-4 w-4 text-purple-500 shrink-0" />
                    <span className="truncate">{f.name}</span>
                    <span className="text-xs text-gray-400">({(f.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Přetáhněte soubory nebo klikněte pro výběr</p>
                <p className="text-xs text-gray-400 mt-1">PDF, obrázky, Excel, Word (max 20 MB)</p>
              </div>
            )}
          </div>

          {/* Document type */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Typ dokumentu</label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Období</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Zrušit
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Nahrávám...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1" />
                  Nahrát {files.length > 0 ? `(${files.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
