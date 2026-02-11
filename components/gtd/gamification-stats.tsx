'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, Star, Award } from 'lucide-react'

// Level thresholds
const LEVELS = [
  { min: 0, name: 'Nováček', color: 'bg-gray-100 text-gray-700' },
  { min: 10, name: 'Pomocník', color: 'bg-blue-100 text-blue-700' },
  { min: 25, name: 'Zdatný', color: 'bg-green-100 text-green-700' },
  { min: 50, name: 'Profík', color: 'bg-purple-100 text-purple-700' },
  { min: 100, name: 'Expert', color: 'bg-yellow-100 text-yellow-700' },
  { min: 200, name: 'Mistr', color: 'bg-orange-100 text-orange-700' },
  { min: 500, name: 'Legenda', color: 'bg-red-100 text-red-700' },
]

function getLevel(completedCount: number) {
  let level = LEVELS[0]
  for (const l of LEVELS) {
    if (completedCount >= l.min) level = l
  }
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1]
  return { ...level, nextLevel, progress: nextLevel ? ((completedCount - level.min) / (nextLevel.min - level.min)) * 100 : 100 }
}

function calculateStreak(tasks: { status: string; completed_at?: string }[]): number {
  const completedDates = new Set<string>()
  for (const t of tasks) {
    if (t.status === 'completed' && t.completed_at) {
      completedDates.add(t.completed_at.slice(0, 10))
    }
  }

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check backwards from today
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10)
    if (completedDates.has(dateStr)) {
      streak++
    } else if (i === 0) {
      // Today doesn't have completions yet, that's ok - check yesterday
      continue
    } else {
      break
    }
  }

  return streak
}

/**
 * Combined gamification stats: Level badge + Streak counter.
 * Compact display for dashboard sidebar or header.
 */
export function GamificationStats() {
  const [completedTotal, setCompletedTotal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tasks?status=completed&page_size=500')
      .then(r => r.json())
      .then(data => {
        const tasks = data.tasks || []
        setCompletedTotal(tasks.length)
        setStreak(calculateStreak(tasks))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return null

  const level = getLevel(completedTotal)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Level */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className={level.color}>
                  <Star className="h-3 w-3 mr-1" />
                  {level.name}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {completedTotal} úkolů dokončeno
                {level.nextLevel && (
                  <> · {level.nextLevel.min - completedTotal} do dalšího levelu</>
                )}
              </p>
            </div>
          </div>

          {/* Streak */}
          <div className="text-center flex-shrink-0">
            <div className="flex items-center gap-1">
              <Flame className={`h-5 w-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{streak}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {streak === 1 ? 'den' : streak >= 2 && streak <= 4 ? 'dny' : 'dní'} v řadě
            </p>
          </div>
        </div>

        {/* Level progress bar */}
        {level.nextLevel && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(level.progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
