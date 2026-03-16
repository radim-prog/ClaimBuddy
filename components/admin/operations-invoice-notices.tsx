'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Save, FileText, Loader2 } from 'lucide-react'

const DEFAULT_NOTICES = [
  { id: 'notice_payment_first', text: 'Činnost bude zahájena po úplném uhrazení faktury.', enabled: false },
  { id: 'notice_ownership', text: 'Dodané zboží zůstává majetkem dodavatele do úplného zaplacení.', enabled: false },
  { id: 'notice_late_fee', text: 'V případě prodlení s úhradou bude účtován úrok z prodlení dle platných předpisů.', enabled: false },
  { id: 'notice_no_vat', text: 'Nejsme plátci DPH.', enabled: false },
]

interface NoticeItem {
  id: string
  text: string
  enabled: boolean
}

export function InvoiceNoticesSettings() {
  const [notices, setNotices] = useState<NoticeItem[]>(DEFAULT_NOTICES)
  const [customNotices, setCustomNotices] = useState<NoticeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch('/api/accountant/admin/settings?key=invoice_notices')
      if (res.ok) {
        const data = await res.json()
        if (data.value) {
          const saved = data.value
          if (saved.predefined) setNotices(mergeWithDefaults(saved.predefined))
          if (saved.custom) setCustomNotices(saved.custom)
        }
      }
    } catch { /* use defaults */ } finally {
      setLoading(false)
    }
  }

  function mergeWithDefaults(saved: NoticeItem[]): NoticeItem[] {
    return DEFAULT_NOTICES.map(def => {
      const found = saved.find(s => s.id === def.id)
      return found ? { ...def, enabled: found.enabled, text: found.text } : def
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'invoice_notices',
          value: { predefined: notices, custom: customNotices },
        }),
      })
      if (res.ok) toast.success('Hlášky uloženy')
      else toast.error('Chyba při ukládání')
    } catch {
      toast.error('Chyba')
    } finally {
      setSaving(false)
    }
  }

  function toggleNotice(id: string) {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n))
  }

  function addCustom() {
    setCustomNotices(prev => [...prev, { id: `custom_${Date.now()}`, text: '', enabled: true }])
  }

  function removeCustom(id: string) {
    setCustomNotices(prev => prev.filter(n => n.id !== id))
  }

  function updateCustomText(id: string, text: string) {
    setCustomNotices(prev => prev.map(n => n.id === id ? { ...n, text } : n))
  }

  function toggleCustom(id: string) {
    setCustomNotices(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Hlášky na fakturách</span>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs">
          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
          Uložit
        </Button>
      </div>

      {/* Predefined notices */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Předdefinované hlášky</Label>
        {notices.map(notice => (
          <div key={notice.id} className="flex items-start gap-3 p-2 rounded-md border bg-card">
            <Checkbox
              checked={notice.enabled}
              onCheckedChange={() => toggleNotice(notice.id)}
              className="mt-0.5"
            />
            <span className="text-xs leading-relaxed flex-1">{notice.text}</span>
          </div>
        ))}
      </div>

      {/* Custom notices */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Vlastní hlášky</Label>
          <Button size="sm" variant="outline" onClick={addCustom} className="h-6 text-xs px-2">
            <Plus className="h-3 w-3 mr-1" />
            Přidat
          </Button>
        </div>
        {customNotices.map(notice => (
          <div key={notice.id} className="flex items-start gap-2 p-2 rounded-md border bg-card">
            <Checkbox
              checked={notice.enabled}
              onCheckedChange={() => toggleCustom(notice.id)}
              className="mt-1"
            />
            <Textarea
              value={notice.text}
              onChange={e => updateCustomText(notice.id, e.target.value)}
              className="text-xs min-h-[40px] flex-1"
              placeholder="Text hlášky..."
            />
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeCustom(notice.id)}>
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
            </Button>
          </div>
        ))}
        {customNotices.length === 0 && (
          <p className="text-xs text-muted-foreground italic py-2">Žádné vlastní hlášky.</p>
        )}
      </div>
    </div>
  )
}
