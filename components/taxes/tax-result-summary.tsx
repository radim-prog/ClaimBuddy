'use client'

import type { SectionResult } from '@/lib/types/tax'

function CZK(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ') + ' Kč'
}

type SummaryItem = {
  label: string
  value: number
  highlight?: boolean
}

export function TaxResultSummary({ items, total, totalLabel, sections }: {
  items: SummaryItem[]
  total: number
  totalLabel?: string
  sections?: SectionResult[]
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 p-4">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
        {totalLabel || 'Celkový souhrn'}
      </div>
      {sections && sections.length > 0 && (
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 space-y-1">
          {sections.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{s.type} {s.label}:</span>
              <span className={`font-medium ${s.dzd >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                {CZK(s.dzd)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm font-semibold pt-1">
            <span className="text-gray-700 dark:text-gray-300">Základ daně:</span>
            <span className="text-gray-900 dark:text-white">{CZK(sections.reduce((sum, s) => sum + s.dzd, 0))}</span>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{item.label}:</span>
            <span className={`text-sm font-semibold ${
              item.value > 0 ? 'text-red-600 dark:text-red-400' :
              item.value < 0 ? 'text-green-600 dark:text-green-400' :
              'text-gray-500'
            }`}>
              {item.value > 0 ? '+' : ''}{CZK(item.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CELKEM:</span>
          <span className={`text-xl font-bold ${
            total > 0 ? 'text-red-600 dark:text-red-400' :
            total < 0 ? 'text-green-600 dark:text-green-400' :
            'text-gray-500'
          }`}>
            {total > 0 ? '+' : ''}{CZK(total)}
          </span>
          {total > 0 && <span className="text-xs text-red-500">nedoplatek</span>}
          {total < 0 && <span className="text-xs text-green-500">přeplatek</span>}
        </div>
      </div>
    </div>
  )
}
