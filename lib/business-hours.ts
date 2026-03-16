/**
 * Business hours utility for notification delivery
 * Only delivers WhatsApp/SMS during business hours to avoid disturbing clients
 * Adapted from ~/Projects/Twilio/lib/business-hours.ts
 */

export interface BusinessHoursConfig {
  days: number[] // 0=Sunday, 1=Monday, ..., 6=Saturday
  from: string   // "08:00"
  to: string     // "18:00"
}

const TIMEZONE = 'Europe/Prague'

// Default: Monday-Friday, 8:00-18:00
const DEFAULT_CONFIG: BusinessHoursConfig = {
  days: [1, 2, 3, 4, 5],
  from: '08:00',
  to: '18:00',
}

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h + (m || 0) / 60
}

export function isBusinessHours(config?: BusinessHoursConfig, date?: Date): boolean {
  const cfg = config || DEFAULT_CONFIG
  const now = date || new Date()

  const pragueTime = new Date(
    now.toLocaleString('en-US', { timeZone: TIMEZONE })
  )

  const dayOfWeek = pragueTime.getDay()
  if (!cfg.days.includes(dayOfWeek)) return false

  const currentTime = pragueTime.getHours() + pragueTime.getMinutes() / 60
  return currentTime >= parseTime(cfg.from) && currentTime < parseTime(cfg.to)
}

const DAY_NAMES = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota']

export function getNextBusinessDay(config?: BusinessHoursConfig): string {
  const cfg = config || DEFAULT_CONFIG
  const now = new Date()
  const pragueTime = new Date(
    now.toLocaleString('en-US', { timeZone: TIMEZONE })
  )

  const dayOfWeek = pragueTime.getDay()
  const currentHour = pragueTime.getHours()
  const closeHour = parseTime(cfg.to)

  for (const bd of cfg.days) {
    if (bd > dayOfWeek || (bd === dayOfWeek && currentHour < closeHour)) {
      return DAY_NAMES[bd]
    }
  }

  return DAY_NAMES[cfg.days[0]]
}

export function getBusinessHoursText(config?: BusinessHoursConfig): string {
  const cfg = config || DEFAULT_CONFIG
  const dayLabels = cfg.days.map(d => DAY_NAMES[d])
  if (dayLabels.length >= 2) {
    return `${dayLabels[0]} až ${dayLabels[dayLabels.length - 1]}, ${cfg.from} až ${cfg.to}`
  }
  return `${dayLabels[0]}, ${cfg.from} až ${cfg.to}`
}
