'use client'

import { useState, useEffect } from 'react'
import { Mic, Upload, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CompanyCombobox } from '@/components/ui/company-combobox'
import { VoiceRecorder } from './voice-recorder'
import { AudioUpload } from './audio-upload'
import { TranscriptionDisplay } from './transcription-display'
import { toast } from 'sonner'

type CaptureMode = 'text' | 'voice' | 'upload'

type Company = { id: string; name: string }

interface QuickCaptureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickCaptureDialog({ open, onOpenChange }: QuickCaptureDialogProps) {
  const [content, setContent] = useState('')
  const [captureMode, setCaptureMode] = useState<CaptureMode>('text')
  const [transcription, setTranscription] = useState('')
  const [summary, setSummary] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [showCompany, setShowCompany] = useState(false)

  // Fetch companies lazily when dialog opens
  useEffect(() => {
    if (open && companies.length === 0) {
      fetch('/api/accountant/companies')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCompanies(data.map((c: any) => ({ id: c.id, name: c.name })))
          } else if (data.companies) {
            setCompanies(data.companies.map((c: any) => ({ id: c.id, name: c.name })))
          }
        })
        .catch(() => {}) // Silent — company is optional
    }
  }, [open, companies.length])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setContent('')
      setCaptureMode('text')
      setTranscription('')
      setSummary('')
      setTranscribing(false)
      setSubmitting(false)
      setCompanyId('')
      setShowCompany(false)
    }
  }, [open])

  const handleTranscribe = async (audioData: Blob | File) => {
    setTranscribing(true)

    try {
      const formData = new FormData()
      formData.append('file', audioData)

      const res = await fetch('/api/capture/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Chyba při přepisu')
      }

      const data = await res.json()

      if (data.text) {
        setTranscription(data.text)
        // Append transcription to main content
        setContent(prev => {
          if (prev.trim()) return prev + '\n\n--- Přepis ---\n' + data.text
          return data.text
        })
        toast.success('Přepis dokončen')
      }
    } catch (err: any) {
      toast.error(err.message || 'Chyba při přepisu')
    } finally {
      setTranscribing(false)
    }
  }

  const handleSubmit = async () => {
    const text = content.trim()
    if (!text) return

    setSubmitting(true)

    try {
      // Auto-generate title from first ~60 chars
      const firstLine = text.split('\n')[0]
      const title = firstLine.length > 60 ? firstLine.substring(0, 57) + '...' : firstLine

      const selectedCompany = companies.find(c => c.id === companyId)

      const taskPayload: Record<string, any> = {
        title,
        description: text + (summary ? '\n\n--- AI Výtah ---\n' + summary : ''),
        status: 'pending',
        company_id: companyId || undefined,
        company_name: selectedCompany?.name || '',
        task_data: {
          capture_type: captureMode,
          ...(transcription && { transcription }),
          ...(summary && { summary }),
        },
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload),
      })

      if (!res.ok) throw new Error('Nepodařilo se uložit')

      toast.success('Uloženo do Inboxu')
      onOpenChange(false)
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSubmitting(false)
    }
  }

  const hasContent = content.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rychlý záznam</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main text area */}
          <Textarea
            placeholder="Napiš poznámku, myšlenku, úkol..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="resize-none text-sm"
            autoFocus
          />

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={captureMode === 'voice' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setCaptureMode(captureMode === 'voice' ? 'text' : 'voice')}
              className="gap-1.5"
              disabled={transcribing}
            >
              <Mic className="h-4 w-4" />
              Nahrát hlas
            </Button>
            <Button
              variant={captureMode === 'upload' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setCaptureMode(captureMode === 'upload' ? 'text' : 'upload')}
              className="gap-1.5"
              disabled={transcribing}
            >
              <Upload className="h-4 w-4" />
              Nahrát soubor
            </Button>

            <div className="flex-1" />

            {!showCompany && companies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompany(true)}
                className="gap-1.5 text-muted-foreground text-xs"
              >
                <Building2 className="h-3.5 w-3.5" />
                Přiřadit firmu
              </Button>
            )}
          </div>

          {/* Transcribing indicator */}
          {transcribing && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Přepisuji audio...</span>
            </div>
          )}

          {/* Voice recorder */}
          {captureMode === 'voice' && !transcribing && (
            <VoiceRecorder
              onRecordingComplete={handleTranscribe}
              disabled={transcribing}
            />
          )}

          {/* Audio file upload */}
          {captureMode === 'upload' && !transcribing && (
            <AudioUpload
              onFileSelected={handleTranscribe}
              disabled={transcribing}
            />
          )}

          {/* Transcription + Summary */}
          {transcription && (
            <TranscriptionDisplay
              transcription={transcription}
              onTranscriptionChange={setTranscription}
              summary={summary}
              onSummaryChange={setSummary}
            />
          )}

          {/* Company combobox */}
          {showCompany && companies.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Firma (volitelné)
              </label>
              <CompanyCombobox
                companies={companies}
                value={companyId}
                onValueChange={setCompanyId}
                placeholder="Vyberte firmu"
                allowNone
                noneLabel="Bez firmy"
                triggerClassName="w-full"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasContent || submitting}
              className="gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ukládám...
                </>
              ) : (
                'Uložit do Inboxu'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
