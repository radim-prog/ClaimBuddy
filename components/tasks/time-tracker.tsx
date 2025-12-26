'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Play,
  Pause,
  Square,
  Clock,
  Timer,
  Edit2,
  Trash2,
  DollarSign,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

// Types
export interface TimeTrackingEntry {
  id: string
  task_id: string
  user_id: string
  user_name: string
  started_at: string
  stopped_at?: string
  duration_minutes?: number
  note?: string
  billable: boolean
  created_at: string
}

export interface TimeTrackerProps {
  taskId: string
  estimatedMinutes?: number
  actualMinutes?: number
  hourlyRate?: number
  isBillable?: boolean
  isProject?: boolean
  onTimeUpdate?: (actualMinutes: number, entries: TimeTrackingEntry[]) => void
  currentUserId: string
  currentUserName: string
  initialEntries?: TimeTrackingEntry[]
}

// Helper function to format duration
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  const secs = Math.floor((minutes % 1) * 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Helper function to format time display
function formatTimeDisplay(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)

  if (hours > 0) {
    return `${hours}h ${mins}min`
  }
  return `${mins} min`
}

// Helper function to calculate billable amount
function calculateBillableAmount(minutes: number, hourlyRate: number): number {
  const hours = minutes / 60
  return Math.round(hours * hourlyRate)
}

export function TimeTracker({
  taskId,
  estimatedMinutes = 0,
  actualMinutes = 0,
  hourlyRate = 0,
  isBillable = false,
  isProject = false,
  onTimeUpdate,
  currentUserId,
  currentUserName,
  initialEntries = []
}: TimeTrackerProps) {
  // Timer state
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedMinutes, setElapsedMinutes] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [pausedTime, setPausedTime] = useState(0)

  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualMinutes, setManualMinutes] = useState('')
  const [manualNote, setManualNote] = useState('')
  const [manualBillable, setManualBillable] = useState(isBillable)
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0])
  const [manualTime, setManualTime] = useState(new Date().toTimeString().slice(0, 5))

  // Entries state - initialize from props
  const [entries, setEntries] = useState<TimeTrackingEntry[]>(initialEntries)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  // Timer tick effect
  useEffect(() => {
    if (!isRunning || isPaused) return

    const interval = setInterval(() => {
      if (startTime) {
        const now = new Date()
        const elapsed = (now.getTime() - startTime.getTime()) / (1000 * 60) // minutes
        setElapsedMinutes(pausedTime + elapsed)
      }
    }, 100) // Update every 100ms for smooth display

    return () => clearInterval(interval)
  }, [isRunning, isPaused, startTime, pausedTime])

  // Start timer
  const handleStart = useCallback(() => {
    setIsRunning(true)
    setIsPaused(false)
    setStartTime(new Date())
  }, [])

  // Pause timer
  const handlePause = useCallback(() => {
    if (!isPaused) {
      setPausedTime(elapsedMinutes)
      setIsPaused(true)
    } else {
      setIsPaused(false)
      setStartTime(new Date())
    }
  }, [isPaused, elapsedMinutes])

  // Stop timer and save entry
  const handleStop = useCallback(() => {
    if (!startTime) return

    const entry: TimeTrackingEntry = {
      id: crypto.randomUUID(),
      task_id: taskId,
      user_id: currentUserId,
      user_name: currentUserName,
      started_at: new Date(startTime.getTime() - pausedTime * 60 * 1000).toISOString(),
      stopped_at: new Date().toISOString(),
      duration_minutes: Math.round(elapsedMinutes),
      note: '',
      billable: isBillable,
      created_at: new Date().toISOString()
    }

    const newEntries = [...entries, entry]
    setEntries(newEntries)

    // Update total actual minutes
    const newActualMinutes = actualMinutes + Math.round(elapsedMinutes)
    onTimeUpdate?.(newActualMinutes, newEntries)

    // Reset timer
    setIsRunning(false)
    setIsPaused(false)
    setElapsedMinutes(0)
    setStartTime(null)
    setPausedTime(0)
  }, [startTime, elapsedMinutes, pausedTime, taskId, currentUserId, currentUserName, isBillable, entries, actualMinutes, onTimeUpdate])

  // Quick time buttons
  const handleQuickTime = useCallback((minutes: number) => {
    const entry: TimeTrackingEntry = {
      id: crypto.randomUUID(),
      task_id: taskId,
      user_id: currentUserId,
      user_name: currentUserName,
      started_at: new Date(Date.now() - minutes * 60 * 1000).toISOString(),
      stopped_at: new Date().toISOString(),
      duration_minutes: minutes,
      note: '',
      billable: isBillable,
      created_at: new Date().toISOString()
    }

    const newEntries = [...entries, entry]
    setEntries(newEntries)

    const newActualMinutes = actualMinutes + minutes
    onTimeUpdate?.(newActualMinutes, newEntries)
  }, [taskId, currentUserId, currentUserName, isBillable, entries, actualMinutes, onTimeUpdate])

  // Manual time entry
  const handleManualEntry = useCallback(() => {
    const minutes = parseInt(manualMinutes)
    if (isNaN(minutes) || minutes <= 0) return

    const entryDate = new Date(`${manualDate}T${manualTime}`)

    const entry: TimeTrackingEntry = {
      id: crypto.randomUUID(),
      task_id: taskId,
      user_id: currentUserId,
      user_name: currentUserName,
      started_at: new Date(entryDate.getTime() - minutes * 60 * 1000).toISOString(),
      stopped_at: entryDate.toISOString(),
      duration_minutes: minutes,
      note: manualNote,
      billable: manualBillable,
      created_at: new Date().toISOString()
    }

    const newEntries = [...entries, entry]
    setEntries(newEntries)

    const newActualMinutes = actualMinutes + minutes
    onTimeUpdate?.(newActualMinutes, newEntries)

    // Reset form
    setManualMinutes('')
    setManualNote('')
    setShowManualEntry(false)
  }, [manualMinutes, manualDate, manualTime, manualNote, manualBillable, taskId, currentUserId, currentUserName, entries, actualMinutes, onTimeUpdate])

  // Delete entry
  const handleDeleteEntry = useCallback((entryId: string) => {
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return

    const newEntries = entries.filter(e => e.id !== entryId)
    setEntries(newEntries)

    const newActualMinutes = actualMinutes - (entry.duration_minutes || 0)
    onTimeUpdate?.(newActualMinutes, newEntries)
  }, [entries, actualMinutes, onTimeUpdate])

  // Calculate totals
  const totalBillableMinutes = entries
    .filter(e => e.billable)
    .reduce((sum, e) => sum + (e.duration_minutes || 0), 0)

  const totalBillableAmount = calculateBillableAmount(totalBillableMinutes, hourlyRate)

  // Progress calculation
  const progressPercentage = estimatedMinutes > 0
    ? Math.min(100, Math.round((actualMinutes / estimatedMinutes) * 100))
    : 0

  const isOverBudget = estimatedMinutes > 0 && actualMinutes > estimatedMinutes

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Time Tracking
        </CardTitle>
        <CardDescription>
          {isProject
            ? 'Automatic summing of all subtask times'
            : 'Track billable hours for this task'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Time Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Estimated</div>
            <div className="text-2xl font-bold">
              {estimatedMinutes > 0 ? formatTimeDisplay(estimatedMinutes) : '—'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Actual</div>
            <div className={cn(
              "text-2xl font-bold",
              isOverBudget && "text-destructive"
            )}>
              {actualMinutes > 0 ? formatTimeDisplay(actualMinutes) : '—'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Difference</div>
            <div className={cn(
              "text-2xl font-bold",
              actualMinutes > estimatedMinutes ? "text-destructive" : "text-green-600"
            )}>
              {estimatedMinutes > 0
                ? `${actualMinutes > estimatedMinutes ? '+' : ''}${actualMinutes - estimatedMinutes} min`
                : '—'
              }
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {estimatedMinutes > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className={cn(
                "font-medium",
                isOverBudget && "text-destructive"
              )}>
                {progressPercentage}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  isOverBudget ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              />
            </div>
            {isOverBudget && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Over budget by {actualMinutes - estimatedMinutes} minutes
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Timer Controls */}
        {!isProject && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Live Timer</h3>
              {isRunning && (
                <Badge variant={isPaused ? "secondary" : "default"} className="flex items-center gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                  )} />
                  {isPaused ? 'Paused' : 'Running'}
                </Badge>
              )}
            </div>

            {/* Running Timer Display */}
            {isRunning && (
              <div className="bg-secondary/50 rounded-lg p-6 text-center space-y-4">
                <div className="text-4xl font-mono font-bold">
                  {formatDuration(elapsedMinutes)}
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    size="lg"
                    variant="outline"
                    className={isPaused ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"}
                    onClick={handlePause}
                  >
                    {isPaused ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleStop}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop & Save
                  </Button>
                </div>
              </div>
            )}

            {/* Start Timer */}
            {!isRunning && (
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleStart}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Timer
              </Button>
            )}

            {/* Quick Time Buttons */}
            {!isRunning && (
              <div className="space-y-3">
                <Label>Rychlý záznam času</Label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleQuickTime(5)}>5 min</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickTime(10)}>10 min</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickTime(15)}>15 min</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickTime(20)}>20 min</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickTime(30)}>30 min</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickTime(45)}>45 min</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickTime(60)}>1 hod</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickTime(120)}>2 hod</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickTime(180)}>3 hod</Button>
                </div>

                {/* Custom time input */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Vlastní (min)"
                    className="w-32 h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = parseInt((e.target as HTMLInputElement).value)
                        if (!isNaN(value) && value > 0) {
                          handleQuickTime(value);
                          (e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">Enter pro přidání</span>
                </div>
              </div>
            )}

            {/* Manual Entry Toggle */}
            {!isRunning && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowManualEntry(!showManualEntry)}
              >
                <Clock className="mr-2 h-4 w-4" />
                {showManualEntry ? 'Hide' : 'Show'} Manual Entry
              </Button>
            )}

            {/* Manual Entry Form */}
            {showManualEntry && !isRunning && (
              <div className="space-y-4 p-4 border rounded-lg bg-secondary/20">
                <h4 className="font-semibold">Manual Time Entry</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-date">Date</Label>
                    <Input
                      id="manual-date"
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-time">Time</Label>
                    <Input
                      id="manual-time"
                      type="time"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-minutes">Duration (minutes)</Label>
                  <Input
                    id="manual-minutes"
                    type="number"
                    min="1"
                    placeholder="e.g. 60"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-note">Note (optional)</Label>
                  <Input
                    id="manual-note"
                    placeholder="What did you work on?"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="manual-billable">Billable</Label>
                  <Switch
                    id="manual-billable"
                    checked={manualBillable}
                    onCheckedChange={setManualBillable}
                  />
                </div>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleManualEntry}
                  disabled={!manualMinutes || parseInt(manualMinutes) <= 0}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Add Entry
                </Button>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Billable Summary */}
        {isBillable && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Billable Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Billable Hours</div>
                <div className="text-2xl font-bold">
                  {(totalBillableMinutes / 60).toFixed(2)}h
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Hourly Rate</div>
                <div className="text-2xl font-bold">
                  {hourlyRate} Kč/h
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="text-2xl font-bold text-green-600">
                  {totalBillableAmount.toLocaleString()} Kč
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Entries List */}
        {entries.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Time Entries</h3>

              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entry.user_name}</span>
                        <Badge
                          className={cn(
                            "text-xs",
                            entry.billable
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-200 text-gray-700"
                          )}
                        >
                          {entry.billable ? 'Fakturovatelné' : 'Nefakturovatelné'}
                        </Badge>
                        {entry.duration_minutes && (
                          <span className="text-sm font-mono">
                            {formatTimeDisplay(entry.duration_minutes)}
                          </span>
                        )}
                      </div>

                      {entry.note && (
                        <p className="text-sm text-muted-foreground">{entry.note}</p>
                      )}

                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.stopped_at || entry.created_at).toLocaleString('cs-CZ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.billable && hourlyRate > 0 && entry.duration_minutes && (
                        <span className="text-sm font-semibold text-green-600">
                          {calculateBillableAmount(entry.duration_minutes, hourlyRate).toLocaleString()} Kč
                        </span>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Project Note */}
        {isProject && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Project Time Tracking:</strong> Time is automatically summed from all subtasks.
              Track time on individual subtasks to see it reflected here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
