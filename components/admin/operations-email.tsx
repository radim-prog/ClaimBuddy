'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Save, Mail, RotateCcw } from 'lucide-react'

interface EmailAddresses {
  noreply: string
  invoicing: string
  info: string
  support: string
}

const DEFAULT_EMAILS: EmailAddresses = {
  noreply: 'noreply@claims.zajcon.cz',
  invoicing: 'fakturace@claims.zajcon.cz',
  info: 'info@claims.zajcon.cz',
  support: 'podpora@claims.zajcon.cz',
}

const EMAIL_FIELDS: { key: keyof EmailAddresses; label: string; description: string }[] = [
  { key: 'noreply', label: 'No-Reply adresa', description: 'Systémové notifikace, resetování hesla, automatické emaily' },
  { key: 'invoicing', label: 'Fakturace', description: 'Odchozí faktury, upomínky, platební informace' },
  { key: 'info', label: 'Info', description: 'Obecné informace, onboarding klientů' },
  { key: 'support', label: 'Podpora', description: 'Příjem požadavků na podporu, helpdesk' },
]

export function OperationsEmail() {
  const [emails, setEmails] = useState<EmailAddresses>(DEFAULT_EMAILS)
  const [saved, setSaved] = useState<EmailAddresses>(DEFAULT_EMAILS)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchEmails = useCallback(() => {
    fetch('/api/accountant/admin/email-settings')
      .then(r => r.json())
      .then(data => {
        if (data.emails) {
          setEmails(data.emails)
          setSaved(data.emails)
        }
      })
      .catch(() => {
        // Use defaults if endpoint not available yet
      })
  }, [])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const hasChanges = JSON.stringify(emails) !== JSON.stringify(saved)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/accountant/admin/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })
      if (res.ok) {
        setSaved({ ...emails })
        setMessage({ type: 'success', text: 'Email adresy uloženy.' })
      } else {
        setMessage({ type: 'error', text: 'Chyba při ukládání.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Nepodařilo se uložit.' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setEmails({ ...saved })
    setMessage(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Nastavte email adresy používané pro odesílání systémových zpráv, faktur a komunikaci s klienty.
      </p>

      <Card>
        <CardContent className="pt-4 pb-4 space-y-4">
          {EMAIL_FIELDS.map(({ key, label, description }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor={`email-${key}`} className="text-sm font-medium">
                  {label}
                </Label>
                {key === 'noreply' && (
                  <Badge variant="outline" className="text-[10px] h-4">Systémový</Badge>
                )}
              </div>
              <Input
                id={`email-${key}`}
                type="email"
                value={emails[key]}
                onChange={(e) => setEmails(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={DEFAULT_EMAILS[key]}
                className="h-8 text-sm"
              />
              <p className="text-xs text-gray-400">{description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {message && (
        <div className={`text-sm px-3 py-2 rounded ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="h-8"
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          {saving ? 'Ukládám...' : 'Uložit'}
        </Button>
        {hasChanges && (
          <Button size="sm" variant="outline" onClick={handleReset} className="h-8">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Zahodit změny
          </Button>
        )}
      </div>
    </div>
  )
}
