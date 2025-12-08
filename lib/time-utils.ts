/**
 * Time Tracking Utilities
 * Helper functions for time formatting, calculations, and conversions
 */

/**
 * Format duration in minutes to HH:MM:SS or MM:SS format
 * @param minutes - Duration in minutes (can include decimals for seconds)
 * @returns Formatted string (e.g., "1:23:45" or "23:45")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  const secs = Math.floor((minutes % 1) * 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format time for display (e.g., "2h 30min" or "45 min")
 * @param minutes - Duration in minutes
 * @returns Human-readable string
 */
export function formatTimeDisplay(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`
  } else if (hours > 0) {
    return `${hours}h`
  }
  return `${mins} min`
}

/**
 * Calculate billable amount based on time and hourly rate
 * @param minutes - Duration in minutes
 * @param hourlyRate - Rate per hour
 * @returns Calculated amount (rounded)
 */
export function calculateBillableAmount(minutes: number, hourlyRate: number): number {
  const hours = minutes / 60
  return Math.round(hours * hourlyRate)
}

/**
 * Convert hours to minutes
 * @param hours - Number of hours
 * @returns Minutes
 */
export function hoursToMinutes(hours: number): number {
  return hours * 60
}

/**
 * Convert minutes to hours (with decimals)
 * @param minutes - Number of minutes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Hours
 */
export function minutesToHours(minutes: number, decimals: number = 2): number {
  return Number((minutes / 60).toFixed(decimals))
}

/**
 * Calculate time difference between two dates in minutes
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Duration in minutes
 */
export function calculateDuration(startDate: Date, endDate: Date): number {
  const diff = endDate.getTime() - startDate.getTime()
  return diff / (1000 * 60) // Convert milliseconds to minutes
}

/**
 * Sum up duration from multiple time entries
 * @param entries - Array of objects with duration_minutes property
 * @returns Total duration in minutes
 */
export function sumDurations<T extends { duration_minutes?: number }>(entries: T[]): number {
  return entries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0)
}

/**
 * Filter and sum billable time entries
 * @param entries - Array of time entries with billable flag
 * @returns Total billable minutes
 */
export function sumBillableDurations<T extends { duration_minutes?: number; billable: boolean }>(
  entries: T[]
): number {
  return entries
    .filter(entry => entry.billable)
    .reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0)
}

/**
 * Calculate progress percentage
 * @param actual - Actual time spent
 * @param estimated - Estimated time
 * @returns Percentage (0-100+)
 */
export function calculateProgress(actual: number, estimated: number): number {
  if (estimated === 0) return 0
  return Math.round((actual / estimated) * 100)
}

/**
 * Check if time is over budget
 * @param actual - Actual time spent
 * @param estimated - Estimated time
 * @returns True if over budget
 */
export function isOverBudget(actual: number, estimated: number): boolean {
  return estimated > 0 && actual > estimated
}

/**
 * Get time difference as a formatted string
 * @param actual - Actual time
 * @param estimated - Estimated time
 * @returns Formatted difference (e.g., "+15 min" or "-30 min")
 */
export function getTimeDifference(actual: number, estimated: number): string {
  const diff = actual - estimated
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff} min`
}

/**
 * Parse time string (HH:MM) to minutes
 * @param timeString - Time in HH:MM format
 * @returns Minutes
 */
export function parseTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

/**
 * Format minutes to HH:MM format
 * @param minutes - Duration in minutes
 * @returns Time string (e.g., "02:30")
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns Date string
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get current time in HH:MM format
 * @returns Time string
 */
export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 5)
}

/**
 * Calculate total invoiceable amount for a period
 * @param entries - Time entries
 * @param hourlyRate - Hourly rate
 * @returns Total amount
 */
export function calculateInvoiceableAmount<T extends { duration_minutes?: number; billable: boolean }>(
  entries: T[],
  hourlyRate: number
): number {
  const billableMinutes = sumBillableDurations(entries)
  return calculateBillableAmount(billableMinutes, hourlyRate)
}

/**
 * Group time entries by date
 * @param entries - Time entries with created_at or stopped_at
 * @returns Map of date to entries
 */
export function groupEntriesByDate<T extends { created_at?: string; stopped_at?: string }>(
  entries: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>()

  entries.forEach(entry => {
    const date = (entry.stopped_at || entry.created_at || '').split('T')[0]
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }
    grouped.get(date)!.push(entry)
  })

  return grouped
}

/**
 * Get time entries for a specific month
 * @param entries - All time entries
 * @param yearMonth - Year-month string (e.g., "2025-12")
 * @returns Filtered entries
 */
export function getEntriesForMonth<T extends { created_at?: string; stopped_at?: string }>(
  entries: T[],
  yearMonth: string
): T[] {
  return entries.filter(entry => {
    const entryDate = entry.stopped_at || entry.created_at || ''
    return entryDate.startsWith(yearMonth)
  })
}
