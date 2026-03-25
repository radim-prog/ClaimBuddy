'use client'

import { useState } from 'react'
import { Bug } from 'lucide-react'
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

const CATEGORIES = [
  { value: 'button_broken', label: 'Nefunguje tlačítko' },
  { value: 'display_issue', label: 'Špatné zobrazení' },
  { value: 'error_message', label: 'Chybová hláška' },
  { value: 'other', label: 'Jiné' },
] as const

export function BugReportButton() {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = description.trim().length >= 10 && !submitting

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
        logs: logBuffer.getRecent(),
        timestamp: Date.now(),
      }

      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success('Díky za nahlášení! Budeme se tím zabývat.')
        setOpen(false)
        setDescription('')
        setCategory('')
      } else {
        toast.error('Nepodařilo se odeslat hlášení. Zkuste to znovu.')
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
              onClick={() => setOpen(true)}
              className="fixed bottom-20 md:bottom-6 right-4 z-40 h-9 w-9 md:h-10 md:w-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
              aria-label="Nahlásit problém"
            >
              <Bug className="h-4 w-4 md:h-[18px] md:w-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Nahlásit problém</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-muted-foreground" />
              Nahlásit problém
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Textarea
                placeholder="Popište co se stalo..."
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
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              S vaším hlášením se automaticky odešlou technické údaje pro rychlejší vyřešení.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
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
