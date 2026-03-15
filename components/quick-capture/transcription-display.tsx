'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface TranscriptionDisplayProps {
  transcription: string
  onTranscriptionChange: (text: string) => void
  summary: string
  onSummaryChange: (text: string) => void
}

export function TranscriptionDisplay({
  transcription,
  onTranscriptionChange,
  summary,
  onSummaryChange,
}: TranscriptionDisplayProps) {
  const [summarizing, setSummarizing] = useState(false)

  const handleSummarize = async () => {
    if (!transcription.trim()) return
    setSummarizing(true)

    try {
      const res = await fetch('/api/capture/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcription }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Chyba při vytváření výtahu')
      }

      const data = await res.json()
      onSummaryChange(data.summary)
    } catch (err: any) {
      toast.error(err.message || 'Chyba při vytváření výtahu')
    } finally {
      setSummarizing(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Transcription text */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Přepis
        </label>
        <Textarea
          value={transcription}
          onChange={(e) => onTranscriptionChange(e.target.value)}
          rows={4}
          className="text-sm resize-none"
          placeholder="Přepis se zobrazí zde..."
        />
      </div>

      {/* Summarize button */}
      {!summary && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSummarize}
          disabled={summarizing || !transcription.trim()}
          className="gap-1.5"
        >
          {summarizing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {summarizing ? 'Zpracovávám...' : 'Výtah informací'}
        </Button>
      )}

      {/* Summary display */}
      {summary && (
        <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400">AI Výtah</span>
          </div>
          <Textarea
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            rows={4}
            className="text-sm resize-none bg-transparent border-0 p-0 focus-visible:ring-0 shadow-none"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSummarize}
            disabled={summarizing}
            className="mt-1 text-xs gap-1 text-muted-foreground"
          >
            {summarizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Přegenerovat
          </Button>
        </div>
      )}
    </div>
  )
}
