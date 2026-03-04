'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  FolderOpen,
  FileText,
  Clock,
  Building2,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Upload,
  FileWarning,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCompany } from './layout'
import { useAttention } from '@/lib/contexts/attention-context'
import type { HubStats } from '@/lib/types/drive'

export default function ClientHubPage() {
  const params = useParams()
  const companyId = params.companyId as string
  const { company, tasks, closures } = useCompany()
  const attention = useAttention().getCompanyAttention(companyId)

  const [hubStats, setHubStats] = useState<HubStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    async function fetchHubStats() {
      try {
        const res = await fetch(`/api/drive/hub-stats?companyId=${companyId}`)
        if (res.ok) {
          const data = await res.json()
          setHubStats(data)
        }
      } catch {
        // API may not exist yet, gracefully ignore
      } finally {
        setStatsLoading(false)
      }
    }
    fetchHubStats()
  }, [companyId])

  // Compute badge counts
  const activeTaskCount = tasks.filter(t =>
    t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress'
  ).length
  const tasksBadge = attention.active_tasks || activeTaskCount || 0
  const messagesBadge = attention.unread_messages || 0
  const docsBadge = (attention.missing_documents + attention.pending_uploads) || 0

  // Build attention items
  const attentionItems: Array<{ type: string; message: string; severity: 'high' | 'medium' | 'low'; icon: typeof FileWarning }> = []

  if (hubStats?.attention?.items) {
    attentionItems.push(...hubStats.attention.items.map(item => ({ ...item, icon: FileWarning })))
  }
  if (attention.missing_documents > 0) {
    attentionItems.push({
      type: 'documents',
      message: `${attention.missing_documents} chybějící${attention.missing_documents > 1 ? ' doklady' : ' doklad'}`,
      severity: 'high',
      icon: FileWarning,
    })
  }
  if (attention.pending_uploads > 0) {
    attentionItems.push({
      type: 'uploads',
      message: `${attention.pending_uploads} nahrání ke zpracování`,
      severity: 'medium',
      icon: Upload,
    })
  }
  if (attention.unread_messages > 0) {
    attentionItems.push({
      type: 'messages',
      message: `${attention.unread_messages} nepřečten${attention.unread_messages > 1 ? 'ých zpráv' : 'á zpráva'}`,
      severity: 'medium',
      icon: MessageSquare,
    })
  }

  const stat = (val: number | undefined) => {
    if (statsLoading) return '—'
    return val !== undefined ? val : '—'
  }

  const cards = [
    {
      id: 'files',
      href: `/accountant/clients/${companyId}/files`,
      icon: FolderOpen,
      label: 'Soubory',
      value: stat(hubStats?.files?.total),
      unit: 'souborů',
      sub: hubStats?.files?.recent ? `${hubStats.files.recent} nových` : null,
      badge: null as number | null,
      color: 'emerald' as const,
    },
    {
      id: 'documents',
      href: `/accountant/clients/${companyId}/documents`,
      icon: FileText,
      label: 'Doklady',
      value: stat(hubStats?.documents?.total),
      unit: 'dokladů',
      sub: hubStats?.documents?.pending ? `${hubStats.documents.pending} ke zpracování` : null,
      badge: docsBadge > 0 ? docsBadge : null,
      color: 'blue' as const,
    },
    {
      id: 'work',
      href: `/accountant/clients/${companyId}/work`,
      icon: Clock,
      label: 'Práce',
      value: hubStats?.work?.hours_this_month !== undefined ? hubStats.work.hours_this_month : '—',
      unit: 'h tento měsíc',
      sub: tasksBadge > 0 ? `${tasksBadge} aktivních úkolů` : null,
      badge: (tasksBadge + messagesBadge) > 0 ? tasksBadge + messagesBadge : null,
      color: 'amber' as const,
    },
    {
      id: 'profile',
      href: `/accountant/clients/${companyId}/profile`,
      icon: Building2,
      label: 'Firma',
      value: company.legal_form || '—',
      unit: '',
      sub: company.vat_payer ? 'Plátce DPH' : 'Neplátce',
      badge: null,
      color: 'purple' as const,
    },
    {
      id: 'projects',
      href: `/accountant/clients/${companyId}/projects`,
      icon: Briefcase,
      label: 'Projekty',
      value: hubStats?.projects?.active !== undefined ? hubStats.projects.active : '—',
      unit: 'aktivních',
      sub: hubStats?.projects?.cases ? `${hubStats.projects.cases} spisů` : null,
      badge: null,
      color: 'indigo' as const,
    },
  ]

  const colorMap = {
    emerald: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800',
      valueBg: 'text-emerald-700 dark:text-emerald-300',
    },
    blue: {
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      hoverBorder: 'hover:border-blue-200 dark:hover:border-blue-800',
      valueBg: 'text-blue-700 dark:text-blue-300',
    },
    amber: {
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      hoverBorder: 'hover:border-amber-200 dark:hover:border-amber-800',
      valueBg: 'text-amber-700 dark:text-amber-300',
    },
    purple: {
      iconBg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      hoverBorder: 'hover:border-purple-200 dark:hover:border-purple-800',
      valueBg: 'text-purple-700 dark:text-purple-300',
    },
    indigo: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      hoverBorder: 'hover:border-indigo-200 dark:hover:border-indigo-800',
      valueBg: 'text-indigo-700 dark:text-indigo-300',
    },
  }

  return (
    <div className="space-y-5">
      {/* Attention Banner */}
      {attentionItems.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-800/40 px-5 py-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Vyžaduje pozornost
            </span>
            <Badge className="ml-auto bg-amber-200/80 dark:bg-amber-800/50 text-amber-800 dark:text-amber-300 border-0 text-[10px] font-bold px-2">
              {attentionItems.length}
            </Badge>
          </div>
          <div className="grid gap-2">
            {attentionItems.slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  item.severity === 'high' ? 'bg-red-500' :
                  item.severity === 'medium' ? 'bg-amber-500' :
                  'bg-gray-400'
                }`} />
                <span className="text-gray-700 dark:text-gray-300">{item.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hub Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => {
          const colors = colorMap[card.color]
          return (
            <Link key={card.id} href={card.href} className="group">
              <div className={`relative rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-900/60 ${colors.hoverBorder} transition-all duration-200 hover:shadow-md p-5 h-full flex flex-col`}>
                {/* Badge */}
                {card.badge && card.badge > 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                      {card.badge}
                    </span>
                  </div>
                )}

                {/* Icon + Label */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${colors.iconBg} transition-transform group-hover:scale-105`}>
                    <card.icon className={`h-5 w-5 ${colors.iconColor}`} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {card.label}
                  </span>
                </div>

                {/* Value */}
                <div className="mt-auto">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-bold ${colors.valueBg}`}>
                      {card.value}
                    </span>
                    {card.unit && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {card.unit}
                      </span>
                    )}
                  </div>
                  {card.sub && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {card.sub}
                    </p>
                  )}
                </div>

                {/* Hover arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
