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
  MessageSquare,
  Upload,
  FileWarning,
  Car,
  CheckCircle2,
  XCircle,
  Calendar,
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
        // API may not exist yet
      } finally {
        setStatsLoading(false)
      }
    }
    fetchHubStats()
  }, [companyId])

  const activeTaskCount = tasks.filter(t =>
    t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress'
  ).length
  const tasksBadge = attention.active_tasks || activeTaskCount || 0
  const messagesBadge = attention.unread_messages || 0
  const docsBadge = (attention.missing_documents + attention.pending_uploads) || 0

  // Attention items
  const attentionItems: Array<{ message: string; severity: 'high' | 'medium' | 'low' }> = []
  if (hubStats?.attention?.items) {
    attentionItems.push(...hubStats.attention.items)
  }
  if (attention.missing_documents > 0) {
    attentionItems.push({
      message: `${attention.missing_documents} chybějící${attention.missing_documents > 1 ? ' doklady' : ' doklad'}`,
      severity: 'high',
    })
  }
  if (attention.pending_uploads > 0) {
    attentionItems.push({
      message: `${attention.pending_uploads} nahrání ke zpracování`,
      severity: 'medium',
    })
  }
  if (attention.unread_messages > 0) {
    attentionItems.push({
      message: `${attention.unread_messages} nepřečten${attention.unread_messages > 1 ? 'ých zpráv' : 'á zpráva'}`,
      severity: 'medium',
    })
  }

  // Latest closure status
  const latestClosure = closures.length > 0
    ? closures.sort((a, b) => b.period.localeCompare(a.period))[0]
    : null
  const closureComplete = latestClosure
    ? latestClosure.bank_statement_status !== 'missing' &&
      latestClosure.expense_documents_status !== 'missing' &&
      latestClosure.income_invoices_status !== 'missing'
    : false

  const s = (val: number | undefined) => statsLoading ? '—' : (val ?? '—')

  return (
    <div className="space-y-4">

      {/* Attention Banner — only if issues */}
      {attentionItems.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {attentionItems.slice(0, 5).map((item, i) => (
              <span key={i} className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  item.severity === 'high' ? 'bg-red-500' : 'bg-amber-400'
                }`} />
                {item.message}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Strip — key numbers at a glance */}
      <div className="flex items-center gap-6 flex-wrap py-1">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">{s(hubStats?.documents?.total)}</span>
          <span className="text-sm text-gray-500">dokladů</span>
          {hubStats?.documents?.pending ? (
            <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 px-1.5 py-0">{hubStats.documents.pending} ke zprac.</Badge>
          ) : null}
        </div>
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {hubStats?.work?.hours_this_month !== undefined ? `${hubStats.work.hours_this_month}h` : '—'}
          </span>
          <span className="text-sm text-gray-500">tento měsíc</span>
        </div>
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`h-4 w-4 ${tasksBadge > 0 ? 'text-purple-500' : 'text-green-500'}`} />
          <span className="text-sm font-bold text-gray-900 dark:text-white">{tasksBadge}</span>
          <span className="text-sm text-gray-500">úkolů</span>
        </div>
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">{s(hubStats?.files?.total)}</span>
          <span className="text-sm text-gray-500">souborů</span>
        </div>
        {latestClosure && (
          <>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <Calendar className={`h-4 w-4 ${closureComplete ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-sm text-gray-500">{formatPeriod(latestClosure.period)}</span>
              {closureComplete ? (
                <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 px-1.5 py-0">OK</Badge>
              ) : (
                <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 px-1.5 py-0">Chybí</Badge>
              )}
            </div>
          </>
        )}
      </div>

      {/* Primary Actions — the two things an accountant does most */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Doklady */}
        <Link href={`/accountant/clients/${companyId}/documents`} className="group">
          <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-900/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 hover:shadow-md p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 group-hover:scale-105 transition-transform">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Doklady</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Příjmové a výdajové doklady</p>
                </div>
              </div>
              {docsBadge > 0 && (
                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 text-xs font-bold bg-red-500 text-white rounded-full">
                  {docsBadge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">{s(hubStats?.documents?.total)}</span> celkem
              </span>
              {hubStats?.documents?.pending ? (
                <span className="text-blue-600 dark:text-blue-400 font-medium">{hubStats.documents.pending} ke zpracování</span>
              ) : null}
            </div>
            <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>

        {/* Práce */}
        <Link href={`/accountant/clients/${companyId}/work`} className="group">
          <div className="relative rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-900/60 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 hover:shadow-md p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 group-hover:scale-105 transition-transform">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Práce</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Úkoly, hodiny, zprávy</p>
                </div>
              </div>
              {(tasksBadge + messagesBadge) > 0 && (
                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 text-xs font-bold bg-purple-500 text-white rounded-full">
                  {tasksBadge + messagesBadge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">{tasksBadge}</span> aktivních úkolů
              </span>
              {hubStats?.work?.hours_this_month !== undefined && (
                <span className="text-amber-600 dark:text-amber-400 font-medium">{hubStats.work.hours_this_month}h tento měsíc</span>
              )}
            </div>
            <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      </div>

      {/* Quick Links — compact row for secondary sections */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { href: `/accountant/clients/${companyId}/files`, icon: FolderOpen, label: 'Soubory', count: s(hubStats?.files?.total), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { href: `/accountant/clients/${companyId}/projects`, icon: Briefcase, label: 'Projekty', count: hubStats?.projects?.active !== undefined ? hubStats.projects.active : '—', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { href: `/accountant/clients/${companyId}/travel`, icon: Car, label: 'Jízdy', count: null, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
          { href: `/accountant/clients/${companyId}/profile`, icon: Building2, label: 'Firma', count: null, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-900/60 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all px-4 py-3">
              <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${item.bg} shrink-0`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</span>
                {item.count !== null && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{item.count}</span>
                )}
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  const months = ['', 'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
  return `${months[parseInt(month)]} ${year}`
}
