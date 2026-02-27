'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Check, Trash2, AlertTriangle, AlertCircle, Info,
  Clock, Banknote, FileText, Bell, X,
} from 'lucide-react'

interface Notification {
  id: string
  type: 'deadline_reminder' | 'unpaid_invoice' | 'missing_documents' | 'custom'
  title: string
  message: string
  severity: 'urgent' | 'warning' | 'info'
  status: 'active' | 'dismissed' | 'resolved'
  created_at: string
}

interface NotificationPanelProps {
  companyId: string
}

const typeIcons: Record<string, typeof Clock> = {
  deadline_reminder: Clock,
  unpaid_invoice: Banknote,
  missing_documents: FileText,
  custom: Bell,
}

const typeLabels: Record<string, string> = {
  deadline_reminder: 'Termín',
  unpaid_invoice: 'Faktura',
  missing_documents: 'Dokumenty',
  custom: 'Vlastní',
}

const typeColors: Record<string, string> = {
  deadline_reminder: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  unpaid_invoice: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  missing_documents: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  custom: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

const severityIcons: Record<string, typeof AlertTriangle> = {
  urgent: AlertTriangle,
  warning: AlertCircle,
  info: Info,
}

const severityColors: Record<string, string> = {
  urgent: 'bg-red-500 text-white',
  warning: 'bg-orange-500 text-white',
  info: 'bg-blue-500 text-white',
}

const severityLabels: Record<string, string> = {
  urgent: 'Naléhavé',
  warning: 'Upozornění',
  info: 'Info',
}

const statusColors: Record<string, string> = {
  active: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  dismissed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}

const statusLabels: Record<string, string> = {
  active: 'Aktivní',
  dismissed: 'Odkliknuto',
  resolved: 'Vyřešeno',
}

export function NotificationPanel({ companyId }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active')
  const [formData, setFormData] = useState({
    type: 'custom' as Notification['type'],
    title: '',
    message: '',
    severity: 'info' as Notification['severity'],
  })

  const fetchNotifications = () => {
    fetch(`/api/accountant/companies/${companyId}/notifications`)
      .then(r => r.json())
      .then(data => setNotifications(data.notifications || []))
      .catch(() => toast.error('Nepodařilo se načíst notifikace'))
  }

  useEffect(() => { fetchNotifications() }, [companyId])

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Vyplňte název a zprávu')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success('Notifikace vytvořena')
        setFormData({ type: 'custom', title: '', message: '', severity: 'info' })
        setIsCreating(false)
        fetchNotifications()
      } else {
        toast.error('Chyba při vytváření')
      }
    } catch {
      toast.error('Chyba při vytváření')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async (id: string) => {
    const res = await fetch(`/api/accountant/companies/${companyId}/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    })
    if (res.ok) {
      toast.success('Vyřešeno')
      fetchNotifications()
    } else {
      toast.error('Chyba')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat notifikaci?')) return
    const res = await fetch(`/api/accountant/companies/${companyId}/notifications/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      toast.success('Smazáno')
      fetchNotifications()
    } else {
      toast.error('Chyba')
    }
  }

  const filtered = activeTab === 'active'
    ? notifications.filter(n => n.status !== 'resolved')
    : notifications

  const activeCount = notifications.filter(n => n.status !== 'resolved').length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifikace klienta
        </CardTitle>
        <Button size="sm" variant={isCreating ? 'outline' : 'default'} onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? <><X className="h-4 w-4 mr-1" /> Zavřít</> : <><Plus className="h-4 w-4 mr-1" /> Nová notifikace</>}
        </Button>
      </CardHeader>

      <CardContent>
        {isCreating && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <h4 className="font-medium">Nová notifikace</h4>
            <div>
              <label className="text-sm text-muted-foreground">Typ</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as Notification['type'] })}
                className="w-full mt-1 px-3 py-2 rounded-md border bg-white dark:bg-gray-800 text-sm"
              >
                <option value="deadline_reminder">Termín</option>
                <option value="unpaid_invoice">Faktura</option>
                <option value="missing_documents">Dokumenty</option>
                <option value="custom">Vlastní</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Název</label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Název notifikace" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Zpráva</label>
              <Textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} placeholder="Obsah..." rows={3} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Závažnost</label>
              <select
                value={formData.severity}
                onChange={e => setFormData({ ...formData, severity: e.target.value as Notification['severity'] })}
                className="w-full mt-1 px-3 py-2 rounded-md border bg-white dark:bg-gray-800 text-sm"
              >
                <option value="info">Info</option>
                <option value="warning">Upozornění</option>
                <option value="urgent">Naléhavé</option>
              </select>
            </div>
            <Button onClick={handleCreate} disabled={isLoading} className="w-full">
              {isLoading ? 'Vytvářím...' : 'Vytvořit notifikaci'}
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('active')}
          >
            Aktivní
            {activeCount > 0 && <Badge variant="secondary" className="ml-2">{activeCount}</Badge>}
          </Button>
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('all')}
          >
            Všechny
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Žádné notifikace</p>
          ) : (
            filtered.map(n => {
              const Icon = typeIcons[n.type] || Bell
              const SevIcon = severityIcons[n.severity] || Info
              return (
                <div key={n.id} className="p-3 border rounded-lg flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{n.title}</span>
                      <Badge className={typeColors[n.type]}>{typeLabels[n.type]}</Badge>
                      <Badge className={severityColors[n.severity]}>
                        <SevIcon className="h-3 w-3 mr-1" />{severityLabels[n.severity]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={statusColors[n.status]}>{statusLabels[n.status]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {n.status !== 'resolved' && (
                      <Button size="icon" variant="ghost" onClick={() => handleResolve(n.id)} title="Vyřešit">
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(n.id)} title="Smazat">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
