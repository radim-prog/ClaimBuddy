'use client'

import { useState, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react'

interface CollapsibleSectionProps {
  id: string
  title?: string
  label?: string // alias for title
  icon: LucideIcon
  children: ReactNode
  defaultOpen?: boolean   // uncontrolled mode
  expanded?: boolean      // controlled mode
  onToggle?: () => void   // controlled mode
  badge?: ReactNode
  actions?: ReactNode
  className?: string
  variant?: 'card' | 'bordered' // visual style
}

export function CollapsibleSection({
  id,
  title,
  label,
  icon: Icon,
  children,
  defaultOpen = true,
  expanded,
  onToggle,
  badge,
  actions,
  className = '',
  variant = 'card',
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)

  const isControlled = expanded !== undefined
  const isOpen = isControlled ? expanded : internalOpen
  const handleToggle = isControlled
    ? onToggle
    : () => setInternalOpen(prev => !prev)

  const displayTitle = title || label || ''

  if (variant === 'bordered') {
    return (
      <div className={`border border-border/50 rounded-xl overflow-hidden ${className}`}>
        <button
          onClick={handleToggle}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        >
          <ChevronRight
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
          <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          <span className="font-medium text-gray-900 dark:text-white">{displayTitle}</span>
        </button>
        {isOpen && (
          <div className="p-4 border-t border-border/50">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card id={id} className={`scroll-mt-4 rounded-xl shadow-soft ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 hover:text-purple-600 transition-colors"
          >
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            <Icon className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg font-display">{displayTitle}</CardTitle>
            {badge}
          </button>
          {isOpen && actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  )
}
