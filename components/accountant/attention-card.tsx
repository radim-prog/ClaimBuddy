'use client'

import { useAttention } from '@/lib/contexts/attention-context'
import { MessageCircle, FileX, Upload, Bell, ClipboardList, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export function AttentionCard() {
  const { totals, companiesList, loading } = useAttention()

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (totals.total === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Vše v pořádku</h3>
            <p className="text-sm text-green-600 dark:text-green-400">Žádný klient nevyžaduje vaši pozornost</p>
          </div>
        </div>
      </div>
    )
  }

  const categories = [
    { label: 'Zprávy', value: totals.unread_messages, icon: MessageCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Chybí doklady', value: totals.missing_documents, icon: FileX, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Ke schválení', value: totals.pending_uploads, icon: Upload, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Notifikace', value: totals.active_notifications, icon: Bell, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Úkoly', value: totals.active_tasks, icon: ClipboardList, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ]

  const top5 = companiesList.slice(0, 5)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Vyžaduje pozornost
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {totals.companies_needing_attention} firem
        </span>
      </div>

      {/* Summary boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {categories.map(cat => (
          <div key={cat.label} className={`${cat.bg} rounded-lg p-3 text-center`}>
            <cat.icon className={`h-5 w-5 mx-auto mb-1 ${cat.color}`} />
            <div className={`text-xl font-bold ${cat.color}`}>{cat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{cat.label}</div>
          </div>
        ))}
      </div>

      {/* Top companies */}
      {top5.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nejvíce pozornosti vyžadují
          </h4>
          <div className="space-y-1">
            {top5.map(company => (
              <Link
                key={company.company_id}
                href={`/accountant/clients/${company.company_id}`}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {company.company_name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {company.unread_messages > 0 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400" title="Zprávy">
                      <MessageCircle className="h-3 w-3 inline mr-0.5" />{company.unread_messages}
                    </span>
                  )}
                  {company.missing_documents > 0 && (
                    <span className="text-xs text-red-600 dark:text-red-400" title="Chybí">
                      <FileX className="h-3 w-3 inline mr-0.5" />{company.missing_documents}
                    </span>
                  )}
                  {company.pending_uploads > 0 && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400" title="Ke schválení">
                      <Upload className="h-3 w-3 inline mr-0.5" />{company.pending_uploads}
                    </span>
                  )}
                  {company.active_tasks > 0 && (
                    <span className="text-xs text-orange-600 dark:text-orange-400" title="Úkoly">
                      <ClipboardList className="h-3 w-3 inline mr-0.5" />{company.active_tasks}
                    </span>
                  )}
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                    {company.total}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
