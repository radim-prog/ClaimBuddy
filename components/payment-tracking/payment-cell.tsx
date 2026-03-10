'use client'

import React, { useRef, useState } from 'react'

type PaymentStatus = 'paid' | 'unpaid' | 'future'

export const PaymentCell = React.memo(function PaymentCell({
  status,
  hasExtraWork,
  onToggle,
  companyName,
  monthLabel,
}: {
  status: PaymentStatus
  hasExtraWork: boolean
  onToggle: (() => void) | null
  companyName: string
  monthLabel: string
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

  if (status === 'future') {
    return (
      <td ref={cellRef} className="px-1 py-2 text-center">
        <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto rounded-lg border-2 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <span className="text-base sm:text-xl text-gray-400">—</span>
        </div>
      </td>
    )
  }

  const isPaid = status === 'paid'

  return (
    <td
      ref={cellRef}
      className="px-1 py-2 text-center relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggle?.()}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onToggle) { e.preventDefault(); onToggle() } }}
        className={`
          w-10 h-10 sm:w-14 sm:h-14 mx-auto rounded-lg border-2 transition-all cursor-pointer relative
          ${isPaid
            ? 'bg-green-500 border-green-600 hover:bg-green-600'
            : 'bg-red-500 border-red-600 hover:bg-red-600'
          }
          hover:scale-110 hover:shadow-soft-lg
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1
          flex items-center justify-center
        `}
      >
        <span className="text-sm sm:text-lg font-bold text-white">
          {isPaid ? '✓' : '!'}
        </span>
        {hasExtraWork && (
          <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-red-300 border border-white" title="Vícepráce" />
        )}
      </div>

      {isHovered && (
        <div className={`absolute ${showAbove ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 z-50 pointer-events-none`}>
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
            <div className="font-bold mb-1">{companyName}</div>
            <div className="text-gray-300">{monthLabel}</div>
            <div className={`mt-1 ${isPaid ? 'text-green-400' : 'text-red-400'}`}>
              {isPaid ? 'Zaplaceno' : 'Nezaplaceno'}
            </div>
            {hasExtraWork && (
              <div className="text-yellow-400 mt-0.5">Nezafakturované vícepráce</div>
            )}
          </div>
          <div className={`w-3 h-3 bg-gray-900 transform rotate-45 absolute ${showAbove ? 'top-full -mt-1.5' : 'bottom-full -mb-1.5'} left-1/2 -translate-x-1/2`} />
        </div>
      )}
    </td>
  )
})
