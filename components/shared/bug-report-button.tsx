'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { logBuffer } from '@/lib/client-log-buffer'

type FeedbackType = 'bug' | 'suggestion'

const BUG_CATEGORIES = [
  { value: 'bug_broken', label: 'Něco nefunguje' },
  { value: 'bug_display', label: 'Zobrazuje se špatně' },
  { value: 'bug_error', label: 'Chybová hláška' },
  { value: 'bug_other', label: 'Jiný problém' },
] as const

const SUGGESTION_CATEGORIES = [
  { value: 'suggestion_new', label: 'Nová funkce' },
  { value: 'suggestion_improve', label: 'Vylepšení existující funkce' },
  { value: 'suggestion_ux', label: 'Vzhled a ovládání' },
  { value: 'suggestion_other', label: 'Jiný nápad' },
] as const

export function BugReportButton() {
  const [open, setOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const categories = feedbackType === 'bug' ? BUG_CATEGORIES : SUGGESTION_CATEGORIES
  const canSubmit = description.trim().length >= 10 && !submitting

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setDescription('')
    setCategory('')
    setFeedbackType('bug')
  }

  const handleTypeChange = (type: FeedbackType) => {
    setFeedbackType(type)
    setCategory('')
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)

    try {
      const payload = {
        description: description.trim(),
        category: category || null,
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        logs: feedbackType === 'bug' ? logBuffer.getRecent() : undefined,
        timestamp: Date.now(),
      }

      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(
          feedbackType === 'bug'
            ? 'Díky za nahlášení! Budeme se tím zabývat.'
            : 'Díky za návrh! Zvážíme ho.'
        )
        handleClose()
      } else {
        toast.error('Nepodařilo se odeslat. Zkuste to znovu.')
      }
    } catch {
      toast.error('Chyba připojení. Zkuste to později.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleOpen}
              className="fixed bottom-20 md:bottom-6 right-4 z-40 h-9 w-9 md:h-10 md:w-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
              aria-label="Zpětná vazba"
            >
              <MessageSquare className="h-4 w-4 md:h-[18px] md:w-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Zpětná vazba</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              Zpětná vazba
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tab switcher */}
            <div className="flex rounded-lg border p-1 gap-1">
              <button
                onClick={() => handleTypeChange('bug')}
                className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${
                  feedbackType === 'bug'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Nahlásit problém
              </button>
              <button
                onClick={() => handleTypeChange('suggestion')}
                className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${
                  feedbackType === 'suggestion'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Navrhnout vylepšení
              </button>
            </div>

            <div>
              <Textarea
                placeholder={feedbackType === 'bug' ? 'Popište co se stalo...' : 'Popište svůj nápad...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={2000}
              />
              <div className="flex justify-between mt-1">
                {description.trim().length > 0 && description.trim().length < 10 && (
                  <p className="text-xs text-destructive">Minimum 10 znaků</p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {description.length}/2000
                </p>
              </div>
            </div>

            <div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie (volitelná)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              {feedbackType === 'bug'
                ? 'S hlášením se automaticky odešlou technické údaje pro rychlejší vyřešení.'
                : 'Vaše návrhy nám pomáhají aplikaci zlepšovat.'}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose}>
              Zrušit
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? 'Odesílání...' : 'Odeslat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
