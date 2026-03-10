'use client'

import React, { useRef, useState } from 'react'
import type { TaxPeriodData } from '@/lib/types/tax'

function formatAmount(n: number): string {
  if (Math.abs(n) >= 1000) {
    return `${Math.round(n / 1000)}k`
  }
  return n.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })
}

export const VatCell = React.memo(function VatCell({
  data,
  companyName,
  monthLabel,
  isFuture,
  isQuarterlyInterim,
  onClick,
}: {
  data: TaxPeriodData | null
  companyName: string
  monthLabel: string
  isFuture: boolean
  isQuarterlyInterim: boolean
  onClick: () => void
}) {
  const cellRef = useRef<HTMLTableCellElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [showAbove, setShowAbove] = useState(false)

  const handleMouseEnter = () => {
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect()
      setShowAbove(rect.top > window.innerHeight / 2)
    }
    setIsHovered(true)
  }

  if (isFuture) {
    return (
      <td ref={cellRef} className="px-0.5 py-1.5 text-center">
        <div className="w-[88px] h-14 mx-auto rounded-lg border bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <span className="text-gray-300 dark:text-gray-600">—</span>
        </div>
      </td>
    )
  }

  const isEmpty = !data || (data.revenue === 0 && data.expenses === 0 && data.vat_output === 0 && data.vat_input === 0)
  const vatResult = data ? (data.vat_result ?? (data.vat_output - data.vat_input)) : 0

  return (
    <td
      ref={cellRef}
      className="px-0.5 py-1.5 text-center relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
        className={`
          w-[88px] h-14 mx-auto rounded-lg border transition-all cursor-pointer
          ${isEmpty
            ? 'border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 bg-gray-50/50 dark:bg-gray-800/30'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-500'
          }
          ${isQuarterlyInterim ? 'opacity-60' : ''}
          hover:shadow-soft-sm
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1
          flex flex-col items-center justify-center gap-0
        `}
      >
        {isEmpty ? (
          <span className="text-gray-400 dark:text-gray-500 text-lg">+</span>
        ) : (
          <div className="text-[10px] leading-tight px-1 w-full">
            <div className="text-gray-500 dark:text-gray-400 truncate">
              P: {formatAmount(data!.revenue)}
            </div>
            <div className="text-gray-500 dark:text-gray-400 truncate">
              V: {formatAmount(data!.expenses)}
            </div>
            <div className={`font-semibold truncate ${vatResult > 0 ? 'text-red-600 dark:text-red-400' : vatResult < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
              DPH: {vatResult > 0 ? '+' : ''}{formatAmount(vatResult)}
            </div>
          </div>
        )}
        {isQuarterlyInterim && !isEmpty && (
          <div className="text-[8px] text-purple-500 dark:text-purple-400 -mt-0.5">průběžné</div>
        )}
      </div>

      {isHovered && !isEmpty && data && (
        <div className={`absolute ${showAbove ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 z-50 pointer-events-none`}>
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
            <div className="font-bold mb-1">{companyName}</div>
            <div className="text-gray-300 mb-2">{monthLabel}</div>
            <div className="space-y-0.5 text-left">
              <div>Příjmy: <span className="text-gray-200">{data.revenue.toLocaleString('cs-CZ')} Kč</span></div>
              <div>Výdaje: <span className="text-gray-200">{data.expenses.toLocaleString('cs-CZ')} Kč</span></div>
              <div>DPH výstup: <span className="text-gray-200">{data.vat_output.toLocaleString('cs-CZ')} Kč</span></div>
              <div>DPH vstup: <span className="text-gray-200">{data.vat_input.toLocaleString('cs-CZ')} Kč</span></div>
              <div className={`font-semibold pt-1 border-t border-gray-700 ${vatResult > 0 ? 'text-red-400' : 'text-green-400'}`}>
                DPH výsledek: {vatResult > 0 ? '+' : ''}{vatResult.toLocaleString('cs-CZ')} Kč
              </div>
              {data.notes && (
                <div className="text-yellow-300 pt-1 italic max-w-[200px] break-words">{data.notes}</div>
              )}
            </div>
          </div>
          <div className={`w-3 h-3 bg-gray-900 transform rotate-45 absolute ${showAbove ? 'top-full -mt-1.5' : 'bottom-full -mb-1.5'} left-1/2 -translate-x-1/2`} />
        </div>
      )}
    </td>
  )
})
