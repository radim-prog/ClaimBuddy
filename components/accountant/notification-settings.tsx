'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Mail, Clock, Banknote, FileText } from 'lucide-react'

interface NotificationPreferences {
  channels: { in_app: boolean; email: boolean; sms: boolean; whatsapp: boolean }
  types: { deadline_reminder: boolean; unpaid_invoice: boolean; missing_documents: boolean }
}

interface NotificationSettingsProps {
  companyId: string
  notificationPreferences: NotificationPreferences | null
}

const typeConfig: { key: keyof NotificationPreferences['types']; label: string; icon: typeof Clock }[] = [
  { key: 'deadline_reminder', label: 'Připomenutí termínu', icon: Clock },
  { key: 'unpaid_invoice', label: 'Nezaplacená faktura', icon: Banknote },
  { key: 'missing_documents', label: 'Chybějící dokumenty', icon: FileText },
]

const channelConfig: { key: keyof NotificationPreferences['channels']; label: string; icon: typeof Bell; note?: string }[] = [
  { key: 'in_app', label: 'V aplikaci', icon: Bell },
  { key: 'email', label: 'E-mail', icon: Mail, note: '(Připraveno)' },
]

const defaultPrefs: NotificationPreferences = {
  channels: { in_app: true, email: true, sms: false, whatsapp: false },
  types: { deadline_reminder: true, unpaid_invoice: true, missing_documents: true },
}

export function NotificationSettings({ companyId, notificationPreferences }: NotificationSettingsProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(notificationPreferences || defaultPrefs)
  const [saving, setSaving] = useState(false)

  const save = async (newPrefs: NotificationPreferences) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: newPrefs }),
      })
      if (res.ok) {
        setPrefs(newPrefs)
        toast.success('Nastavení uloženo')
      } else {
        toast.error('Chyba při ukládání')
      }
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const toggleType = (key: keyof NotificationPreferences['types']) => {
    const updated = { ...prefs, types: { ...prefs.types, [key]: !prefs.types[key] } }
    save(updated)
  }

  const toggleChannel = (key: keyof NotificationPreferences['channels']) => {
    const updated = { ...prefs, channels: { ...prefs.channels, [key]: !prefs.channels[key] } }
    save(updated)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Nastavení notifikací
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Typy notifikací</h4>
          <div className="space-y-2">
            {typeConfig.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => toggleType(key)}
                disabled={saving}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  prefs.types[key]
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{label}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  prefs.types[key] ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {prefs.types[key] ? 'Zapnuto' : 'Vypnuto'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Kanály doručení</h4>
          <div className="space-y-2">
            {channelConfig.map(({ key, label, icon: Icon, note }) => (
              <button
                key={key}
                onClick={() => toggleChannel(key)}
                disabled={saving}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  prefs.channels[key]
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{label}</span>
                  {note && <span className="text-xs opacity-70">{note}</span>}
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  prefs.channels[key] ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {prefs.channels[key] ? 'Zapnuto' : 'Vypnuto'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
