'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Banknote, FileText, Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react'

interface Notification {
  id: string
  type: 'deadline_reminder' | 'unpaid_invoice' | 'missing_documents' | 'custom'
  title: string
  message: string
  severity: 'urgent' | 'warning' | 'info'
  status: 'active' | 'dismissed' | 'resolved'
  created_at: string
}

interface NotificationModalProps {
  onDismissed?: () => void
}

const typeIcons: Record<string, typeof Clock> = {
  deadline_reminder: Clock,
  unpaid_invoice: Banknote,
  missing_documents: FileText,
  custom: Bell,
}

const severityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
}

const severityBadgeColors: Record<string, string> = {
  urgent: 'bg-red-500 text-white',
  warning: 'bg-orange-500 text-white',
  info: 'bg-blue-500 text-white',
}

const severityLabels: Record<string, { label: string; header: string }> = {
  urgent: { label: 'Naléhavé', header: 'Naléhavé' },
  warning: { label: 'Upozornění', header: 'Upozornění' },
  info: { label: 'Info', header: 'Informace' },
}

export function NotificationModal({ onDismissed }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetch('/api/client/notifications')
      .then(r => r.json())
      .then(data => {
        const active = (data.notifications || []).filter((n: Notification) => n.status === 'active')
        setNotifications(active)
        if (active.length > 0) setIsOpen(true)
      })
      .catch(() => {})
  }, [])

  const handleDismissAll = async () => {
    setIsLoading(true)
    try {
      await Promise.all(
        notifications.map(n =>
          fetch(`/api/client/notifications/${n.id}/dismiss`, { method: 'POST' })
        )
      )
      setIsOpen(false)
      onDismissed?.()
    } catch {
      console.error('Failed to dismiss notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const grouped = {
    urgent: notifications.filter(n => n.severity === 'urgent'),
    warning: notifications.filter(n => n.severity === 'warning'),
    info: notifications.filter(n => n.severity === 'info'),
  }

  if (notifications.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="h-6 w-6" />
            Máte {notifications.length} {notifications.length === 1 ? 'nové oznámení' : notifications.length < 5 ? 'nová oznámení' : 'nových oznámení'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {(['urgent', 'warning', 'info'] as const).map(severity => {
            const items = grouped[severity]
            if (items.length === 0) return null
            return (
              <div key={severity} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {severity === 'urgent' && '🔴'} {severity === 'warning' && '🟠'} {severity === 'info' && '🔵'} {severityLabels[severity].header}
                </h3>
                {items.map(notification => {
                  const Icon = typeIcons[notification.type] || Bell
                  return (
                    <div key={notification.id} className={`p-4 rounded-lg border ${severityColors[severity]}`}>
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{notification.title}</h4>
                            <Badge className={severityBadgeColors[severity]}>
                              {severityLabels[severity].label}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                          <p className="text-xs mt-2 opacity-60">
                            {new Date(notification.created_at).toLocaleDateString('cs-CZ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleDismissAll} disabled={isLoading} className="min-w-[150px]">
            {isLoading ? 'Ukládání...' : 'Beru na vědomí'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
