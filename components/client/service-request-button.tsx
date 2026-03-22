'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const TYPE_LABELS: Record<string, string> = {
  general: 'Obecný',
  documents: 'Doklady',
  tax: 'Daně',
  payroll: 'Mzdy',
  invoice: 'Fakturace',
  consultation: 'Konzultace',
  urgent: 'Urgentní',
  other: 'Jiný',
}

const PRIORITY_LABELS: Record<string, { label: string }> = {
  low: { label: 'Nízká' },
  normal: { label: 'Normální' },
  high: { label: 'Vysoká' },
  urgent: { label: 'Urgentní' },
}

export function ServiceRequestButton() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formType, setFormType] = useState('general')
  const [formPriority, setFormPriority] = useState('normal')
  const [formSubject, setFormSubject] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const handleSubmit = async () => {
    if (!formSubject.trim() || !formDescription.trim()) {
      toast.error('Vyplňte předmět a popis požadavku')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/client/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          priority: formPriority,
          subject: formSubject.trim(),
          description: formDescription.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Chyba při vytváření požadavku')
        return
      }

      toast.success('Požadavek odeslán')
      setDialogOpen(false)
      setFormType('general')
      setFormPriority('normal')
      setFormSubject('')
      setFormDescription('')
    } catch {
      toast.error('Nepodařilo se odeslat požadavek')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} variant="outline" size="sm" className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Nový požadavek
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nový požadavek</DialogTitle>
            <DialogDescription>
              Popište svůj požadavek a my se vám ozveme co nejdříve.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Typ</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorita</Label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([val, cfg]) => (
                      <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Předmět</Label>
              <Input
                value={formSubject}
                onChange={e => setFormSubject(e.target.value)}
                placeholder="Stručný popis požadavku..."
              />
            </div>

            <div className="space-y-2">
              <Label>Popis</Label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Podrobný popis vašeho požadavku..."
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Odesílám...
                </>
              ) : (
                'Odeslat požadavek'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
