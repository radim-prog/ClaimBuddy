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
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
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

  // Build attention items for the bottom section
  const attentionItems: Array<{ type: string; message: string; severity: 'high' | 'medium' | 'low' }> = []

  // From hub stats API
  if (hubStats?.attention?.items) {
    attentionItems.push(...hubStats.attention.items)
  }

  // From attention context (fallback / enrichment)
  if (attention.missing_documents > 0) {
    attentionItems.push({
      type: 'documents',
      message: `${attention.missing_documents} chybejici doklad${attention.missing_documents > 1 ? 'y' : ''}`,
      severity: 'high',
    })
  }
  if (attention.pending_uploads > 0) {
    attentionItems.push({
      type: 'uploads',
      message: `${attention.pending_uploads} nahran${attention.pending_uploads > 1 ? 'e' : 'y'} ke zpracovani`,
      severity: 'medium',
    })
  }
  if (attention.unread_messages > 0) {
    attentionItems.push({
      type: 'messages',
      message: `${attention.unread_messages} neprecteny${attention.unread_messages > 1 ? 'ch' : ''} zprav${attention.unread_messages > 1 ? '' : 'a'}`,
      severity: 'medium',
    })
  }

  // Stat helper: returns value or dash if not loaded
  const stat = (val: number | undefined) => {
    if (statsLoading) return '...'
    return val !== undefined ? val : '\u2014'
  }

  // Card definitions
  const cards = [
    {
      id: 'files',
      href: `/accountant/clients/${companyId}/files`,
      icon: FolderOpen,
      label: 'Soubory',
      stat1: `${stat(hubStats?.files?.total)} souboru`,
      stat2: hubStats?.files?.recent ? `${hubStats.files.recent} novych` : statsLoading ? '...' : null,
      badge: null as number | null,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'documents',
      href: `/accountant/clients/${companyId}/documents`,
      icon: FileText,
      label: 'Doklady',
      stat1: `${stat(hubStats?.documents?.total)} dokladu`,
      stat2: hubStats?.documents?.pending ? `${hubStats.documents.pending} ke zprac.` : statsLoading ? '...' : null,
      badge: docsBadge > 0 ? docsBadge : null,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'work',
      href: `/accountant/clients/${companyId}/work`,
      icon: Clock,
      label: 'Prace',
      stat1: hubStats?.work?.hours_this_month !== undefined
        ? `${hubStats.work.hours_this_month}h tento mes.`
        : statsLoading ? '...' : '\u2014',
      stat2: tasksBadge > 0 ? `${tasksBadge} ukolu` : null,
      badge: (tasksBadge + messagesBadge) > 0 ? tasksBadge + messagesBadge : null,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'profile',
      href: `/accountant/clients/${companyId}/profile`,
      icon: Building2,
      label: 'Firma',
      stat1: company.legal_form || '\u2014',
      stat2: company.vat_payer ? 'Platce DPH' : 'Neplatce',
      badge: null,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'projects',
      href: `/accountant/clients/${companyId}/projects`,
      icon: Briefcase,
      label: 'Projekty',
      stat1: hubStats?.projects?.active !== undefined
        ? `${hubStats.projects.active} aktivnich`
        : statsLoading ? '...' : '\u2014',
      stat2: hubStats?.projects?.cases ? `${hubStats.projects.cases} spisu` : statsLoading ? '...' : null,
      badge: null,
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hub Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link key={card.id} href={card.href}>
            <Card className="card-hover rounded-xl shadow-soft-sm border-gray-200/80 dark:border-gray-700/80 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 cursor-pointer group h-full">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${card.iconBg} transition-colors group-hover:scale-105`}>
                    <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {card.badge && card.badge > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px] rounded-md">
                        {card.badge}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                </div>
                <h3 className="text-base font-semibold font-display text-gray-900 dark:text-white mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                  {card.label}
                </h3>
                <div className="mt-auto space-y-0.5">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.stat1}
                  </p>
                  {card.stat2 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {card.stat2}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Attention Section */}
      {attentionItems.length > 0 && (
        <Card className="rounded-xl shadow-soft-sm border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold font-display text-amber-800 dark:text-amber-300">
                Vyzaduje pozornost
              </h3>
              <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 text-[10px] ml-auto rounded-md">
                {attentionItems.length}
              </Badge>
            </div>
            <ul className="space-y-1.5">
              {attentionItems.slice(0, 8).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                    item.severity === 'high' ? 'bg-red-500' :
                    item.severity === 'medium' ? 'bg-amber-500' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-gray-700 dark:text-gray-300">{item.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  )
}
