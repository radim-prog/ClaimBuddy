'use client'

import React, { useRef, useState, useEffect } from 'react'

type PaymentStatus = 'paid' | 'unpaid' | 'future'

export const PaymentCell = React.memo(function PaymentCell({
  status,
  hasExtraWork,
  paidAt,
  period,
  companyName,
  monthLabel,
  onPaymentChange,
}: {
  status: PaymentStatus
  hasExtraWork: boolean
  paidAt?: string | null
  period: string
  companyName: string
  monthLabel: string
  onPaymentChange?: (paid: boolean, paidAt: string | null) => void
}) {
  const cellRef = useRef<HTMLTableCellElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [showAbove, setShowAbove] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [editDate, setEditDate] = useState('')

  // Close popover on outside click
  useEffect(() => {
    if (!showPopover) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPopover])

  // Close popover on Escape
  useEffect(() => {
    if (!showPopover) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowPopover(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showPopover])

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

  // Default date for the date picker:
  // - paid → existing paid_at
  // - unpaid → last day of the period month (e.g. 2026-01 → 2026-01-31)
  function getDefaultDate() {
    if (isPaid && paidAt) {
      return new Date(paidAt).toISOString().split('T')[0]
    }
    // Default to last day of the period month
    const [y, m] = period.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const lastDayStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    // If last day is in the future, use today instead
    return lastDayStr > todayStr ? todayStr : lastDayStr
  }

  const handleClick = () => {
    setEditDate(getDefaultDate())
    setShowPopover(true)
    setIsHovered(false)
  }

  const handleMarkPaid = () => {
    if (editDate && onPaymentChange) {
      onPaymentChange(true, new Date(editDate + 'T12:00:00').toISOString())
    }
    setShowPopover(false)
  }

  const handleUnmark = () => {
    onPaymentChange?.(false, null)
    setShowPopover(false)
  }

  return (
    <td
      ref={cellRef}
      className="px-1 py-2 text-center relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => { if (!showPopover) setIsHovered(false) }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
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

      {/* Popover — always with date picker */}
      {showPopover && (
        <div
          ref={popoverRef}
          className={`absolute ${showAbove ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 z-50`}
        >
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 shadow-xl min-w-[200px]">
            <div className="text-xs font-bold text-gray-900 dark:text-white mb-1">{companyName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">{monthLabel}</div>

            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Datum platby</label>
            <input
              type="date"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleMarkPaid() }}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              autoFocus
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkPaid}
                className="flex-1 text-xs font-medium px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                {isPaid ? 'Ulozit' : 'Zaplaceno'}
              </button>
              {isPaid ? (
                <button
                  onClick={handleUnmark}
                  className="text-xs font-medium px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Odznacit
                </button>
              ) : (
                <button
                  onClick={() => setShowPopover(false)}
                  className="text-xs font-medium px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  Zrusit
                </button>
              )}
            </div>
          </div>
          <div className={`w-3 h-3 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform rotate-45 absolute ${showAbove ? 'top-full -mt-1.5' : 'bottom-full -mb-1.5'} left-1/2 -translate-x-1/2`} />
        </div>
      )}

      {/* Hover tooltip (only when popover not open) */}
      {isHovered && !showPopover && (
        <div className={`absolute ${showAbove ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 z-50 pointer-events-none`}>
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
            <div className="font-bold mb-1">{companyName}</div>
            <div className="text-gray-300">{monthLabel}</div>
            <div className={`mt-1 ${isPaid ? 'text-green-400' : 'text-red-400'}`}>
              {isPaid ? 'Zaplaceno' : 'Nezaplaceno'}
            </div>
            {isPaid && paidAt && (
              <div className="text-gray-400 mt-0.5">
                {new Date(paidAt).toLocaleDateString('cs')}
              </div>
            )}
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
