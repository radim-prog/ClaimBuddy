'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

/**
 * Circular progress ring showing today's task completion.
 * "Dnes hotovo X z Y" with animated SVG ring.
 */
export function DailyProgressRing() {
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetch('/api/tasks?page_size=500')
      .then(r => r.json())
      .then(data => {
        const tasks = data.tasks || []
        const today = new Date().toISOString().slice(0, 10)
        const todayCompleted = tasks.filter(
          (t: { status: string; completed_at?: string }) =>
            t.status === 'completed' && t.completed_at?.startsWith(today)
        ).length
        const todayActive = tasks.filter(
          (t: { status: string }) =>
            t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'someday_maybe'
        ).length
        setCompleted(todayCompleted)
        setTotal(todayCompleted + todayActive)
      })
      .catch(() => {})
  }, [])

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" className="-rotate-90">
            <circle
              cx="48" cy="48" r={radius}
              fill="none" stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
              strokeWidth="8"
            />
            <circle
              cx="48" cy="48" r={radius}
              fill="none" stroke="currentColor"
              className="text-purple-500 transition-all duration-1000 ease-out"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-800 dark:text-white">{percentage}%</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold text-gray-800 dark:text-white">Dnes hotovo</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {completed} <span className="text-sm font-normal text-gray-500">z {total}</span>
          </p>
          {completed > 0 && percentage === 100 && (
            <p className="text-sm text-green-600 font-medium">Vsechno splneno!</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
