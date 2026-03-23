'use client'

import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle, Eye, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type ExtractionStatusType =
  | 'none'
  | 'uploaded'
  | 'extracting'
  | 'extracted'
  | 'client_verified'
  | 'approved'
  | 'booked'
  | 'rejected'
  | 'error'

const statusConfig: Record<ExtractionStatusType, {
  label: string
  bg: string
  icon?: React.ReactNode
}> = {
  none: {
    label: 'Bez vytěžení',
    bg: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  uploaded: {
    label: 'Čeká',
    bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: <Clock className="w-3 h-3" />,
  },
  extracting: {
    label: 'Vytěžování...',
    bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  extracted: {
    label: 'Vytěženo',
    bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    icon: <Eye className="w-3 h-3" />,
  },
  client_verified: {
    label: 'Ověřeno',
    bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  approved: {
    label: 'Schváleno',
    bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  booked: {
    label: 'Zaúčtováno',
    bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  rejected: {
    label: 'Vráceno k úpravě',
    bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  error: {
    label: 'Chyba',
    bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: <AlertCircle className="w-3 h-3" />,
  },
}

interface ExtractionStatusBadgeProps {
  status: string | null | undefined
  className?: string
}

export function ExtractionStatusBadge({ status, className }: ExtractionStatusBadgeProps) {
  const key = (status || 'none') as ExtractionStatusType
  const config = statusConfig[key] || statusConfig.none

  return (
    <Badge className={cn('rounded-md text-[11px] gap-1 font-medium', config.bg, className)}>
      {config.icon}
      {config.label}
    </Badge>
  )
}
