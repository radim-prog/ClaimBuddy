'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Bell, Clock, FileText, Banknote, Send } from 'lucide-react'

type ReminderType = 'deadline' | 'missing_docs' | 'unpaid_invoice' | 'custom'
type ReminderFrequency = 'daily' | 'every_3_days' | 'weekly' | 'biweekly' | 'adaptive'

interface ReminderCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName?: string
  /** Pre-fill type based on trigger point */
  defaultType?: ReminderType
  /** Pre-fill message based on context */
  defaultMessage?: string
  /** Extra metadata to attach (e.g. period, task_id, case_id) */
  metadata?: Record<string, unknown>
  onCreated?: () => void
}

const typeOptions: { value: ReminderType; label: string; icon: typeof Bell }[] = [
  { value: 'deadline', label: 'Termín', icon: Clock },
  { value: 'missing_docs', label: 'Doklady k doplnění', icon: FileText },
  { value: 'unpaid_invoice', label: 'Nezaplacená faktura', icon: Banknote },
  { value: 'custom', label: 'Vlastní', icon: Bell },
]

const frequencyOptions: { value: ReminderFrequency; label: string; desc: string }[] = [
  { value: 'daily', label: 'Denně', desc: 'Každý pracovní den' },
  { value: 'every_3_days', label: 'Každé 3 dny', desc: 'Standardní frekvence' },
  { value: 'weekly', label: 'Týdně', desc: 'Jednou za týden' },
  { value: 'biweekly', label: 'Každé 2 týdny', desc: 'Méně častá' },
  { value: 'adaptive', label: 'Adaptivní', desc: 'Automatická eskalace' },
]

const channelOptions: { value: string; label: string }[] = [
  { value: 'in_app', label: 'V aplikaci' },
  { value: 'email', label: 'E-mail' },
  { value: 'telegram', label: 'Telegram' },
]

export function ReminderCreateDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  defaultType = 'custom',
  defaultMessage = '',
  metadata = {},
  onCreated,
}: ReminderCreateDialogProps) {
  const [type, setType] = useState<ReminderType>(defaultType)
  const [message, setMessage] = useState(defaultMessage)
  const [frequency, setFrequency] = useState<ReminderFrequency>('every_3_days')
  const [channels, setChannels] = useState<string[]>(['in_app'])
  const [maxDeliveries, setMaxDeliveries] = useState(20)
  const [saving, setSaving] = useState(false)

  const toggleChannel = (ch: string) => {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    )
  }

  const handleCreate = async () => {
    if (!message.trim()) {
      toast.error('Vyplňte zprávu připomínky')
      return
    }
    if (channels.length === 0) {
      toast.error('Vyberte alespoň jeden kanál')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/accountant/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          type,
          message,
          frequency,
          channels,
          max_deliveries: maxDeliveries,
          metadata,
        }),
      })

      if (res.ok) {
        toast.success('Připomínka vytvořena')
        onOpenChange(false)
        onCreated?.()
        // Reset form
        setMessage('')
        setType(defaultType)
        setFrequency('every_3_days')
        setChannels(['in_app'])
        setMaxDeliveries(20)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba při vytváření')
      }
    } catch {
      toast.error('Chyba při vytváření')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-purple-600" />
            Nová připomínka
            {companyName && (
              <span className="text-sm font-normal text-muted-foreground">— {companyName}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Typ</label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map(opt => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      type === opt.value
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Zpráva</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Text připomínky pro klienta..."
              rows={3}
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Frekvence</label>
            <div className="flex flex-wrap gap-2">
              {frequencyOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    frequency === opt.value
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-medium'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Kanály doručení</label>
            <div className="flex gap-2">
              {channelOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleChannel(opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    channels.includes(opt.value)
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-medium'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max deliveries */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Max. počet doručení
            </label>
            <Input
              type="number"
              value={maxDeliveries}
              onChange={e => setMaxDeliveries(Math.max(1, Math.min(50, Number(e.target.value))))}
              min={1}
              max={50}
              className="w-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Vytvářím...' : 'Vytvořit připomínku'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
