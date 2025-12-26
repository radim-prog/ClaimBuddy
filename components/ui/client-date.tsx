'use client'

import { useState, useEffect } from 'react'

interface ClientDateProps {
  date: string | Date
  format?: 'date' | 'datetime' | 'time'
  className?: string
}

/**
 * Client-side date formatting component that avoids hydration mismatches.
 * Renders a placeholder on server and updates with correct timezone on client.
 */
export function ClientDate({ date, format = 'datetime', className }: ClientDateProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return consistent placeholder during SSR to avoid hydration mismatch
    return <span className={className}>—</span>
  }

  const d = typeof date === 'string' ? new Date(date) : date

  const formatDate = () => {
    switch (format) {
      case 'date':
        return d.toLocaleDateString('cs-CZ')
      case 'time':
        return d.toLocaleTimeString('cs-CZ')
      case 'datetime':
      default:
        return d.toLocaleString('cs-CZ')
    }
  }

  return <span className={className}>{formatDate()}</span>
}

/**
 * Alternative: Wrapper that adds suppressHydrationWarning
 * Use this for simple cases where you want to keep the existing code
 */
export function HydrationSafeDate({ children }: { children: React.ReactNode }) {
  return <span suppressHydrationWarning>{children}</span>
}
