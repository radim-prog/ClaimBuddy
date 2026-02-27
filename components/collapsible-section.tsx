'use client'

import { useState, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react'

interface CollapsibleSectionProps {
  id: string
  title: string
  icon: LucideIcon
  children: ReactNode
  defaultOpen?: boolean
  badge?: ReactNode
  actions?: ReactNode
  className?: string
}

export function CollapsibleSection({
  id,
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  badge,
  actions,
  className = '',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card id={id} className={`scroll-mt-4 rounded-xl shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 hover:text-purple-600 transition-colors"
          >
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
            <Icon className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">{title}</CardTitle>
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
