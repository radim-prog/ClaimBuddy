'use client'

import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CollapsibleSectionProps {
  id: string
  label: string
  icon: LucideIcon
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function CollapsibleSection({
  id,
  label,
  icon: Icon,
  expanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <ChevronRight
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
      </button>
      {expanded && (
        <div className="p-4 border-t border-border/50">
          {children}
        </div>
      )}
    </div>
  )
}
