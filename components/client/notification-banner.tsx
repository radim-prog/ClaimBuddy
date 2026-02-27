'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, Clock, Banknote, FileText, Bell } from 'lucide-react'

interface Notification {
  id: string
  type: 'deadline_reminder' | 'unpaid_invoice' | 'missing_documents' | 'custom'
  title: string
  severity: 'urgent' | 'warning' | 'info'
  status: 'active' | 'dismissed' | 'resolved'
}

interface NotificationBannerProps {
  dismissed: boolean
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
  custom: 'Oznámení',
}

const bannerColors: Record<string, string> = {
  urgent: 'bg-red-500 text-white',
  warning: 'bg-orange-500 text-white',
  info: 'bg-blue-500 text-white',
}

export function NotificationBanner({ dismissed }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (dismissed) {
      fetch('/api/client/notifications')
        .then(r => r.json())
        .then(data => {
          const unresolved = (data.notifications || []).filter((n: Notification) => n.status !== 'resolved')
          setNotifications(unresolved)
        })
        .catch(() => {})
    }
  }, [dismissed])

  if (!dismissed || notifications.length === 0) return null

  const hasUrgent = notifications.some(n => n.severity === 'urgent')
  const hasWarning = notifications.some(n => n.severity === 'warning')
  const color = hasUrgent ? bannerColors.urgent : hasWarning ? bannerColors.warning : bannerColors.info
  const BannerIcon = hasUrgent ? AlertTriangle : hasWarning ? AlertCircle : Info
  const count = notifications.length

  return (
    <div className={`sticky top-0 z-50 ${color}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <BannerIcon className="h-5 w-5" />
          <span className="font-medium">
            Máte {count} nevyřízen{count === 1 ? 'ý požadavek' : count < 5 ? 'é požadavky' : 'ých požadavků'}
          </span>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {expanded && (
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
          {notifications.map(notification => {
            const Icon = typeIcons[notification.type] || Bell
            return (
              <div
                key={notification.id}
                className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 flex items-center gap-3"
              >
                <Icon className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm flex-1">{notification.title}</span>
                <span className="text-xs text-gray-500">{typeLabels[notification.type]}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
