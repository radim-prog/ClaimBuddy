'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'

const DISMISS_SESSION_KEY = 'upsell_banner_dismissed'
const DISMISS_WEEKLY_KEY = 'upsell_banner_dismissed_at'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

type UpsellBannerProps = {
  /** Contextual message shown in the banner */
  message: string
  /** CTA button text */
  ctaText?: string
  /** Where CTA leads — default mailto */
  ctaHref?: string
}

export function UpsellBanner({
  message,
  ctaText = 'Chci účetní',
  ctaHref = '/client/find-accountant',
}: UpsellBannerProps) {
  const { selectedCompany, userId } = useClientUser()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show for clients WITHOUT accountant
    if (!selectedCompany || selectedCompany.has_accountant !== false) {
      setVisible(false)
      return
    }

    // Session cap: already dismissed this session
    if (sessionStorage.getItem(DISMISS_SESSION_KEY)) {
      setVisible(false)
      return
    }

    // Weekly cap: dismissed less than 7 days ago
    const lastDismissed = localStorage.getItem(DISMISS_WEEKLY_KEY)
    if (lastDismissed && Date.now() - parseInt(lastDismissed, 10) < WEEK_MS) {
      setVisible(false)
      return
    }

    setVisible(true)
    // Log impression
    logUpsellEvent('upsell_shown', userId)
  }, [selectedCompany, userId])

  if (!visible) return null

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_SESSION_KEY, '1')
    localStorage.setItem(DISMISS_WEEKLY_KEY, String(Date.now()))
    setVisible(false)
  }

  const handleClick = () => {
    logUpsellEvent('upsell_clicked', userId)
  }

  return (
    <div className="relative rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 dark:border-purple-800 p-4 flex items-start gap-3">
      <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
        <a
          href={ctaHref}
          onClick={handleClick}
          className="inline-block mt-2 text-sm font-medium text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 underline underline-offset-2"
        >
          {ctaText}
        </a>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
        aria-label="Zavřít"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Fire-and-forget tracking to usage_log */
function logUpsellEvent(action: string, userId: string) {
  if (!userId) return
  fetch('/api/client/upsell-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  }).catch(() => {})
}
