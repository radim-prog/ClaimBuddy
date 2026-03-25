'use client'

export type LogEntry = {
  ts: number
  type: 'console' | 'error' | 'fetch' | 'nav' | 'click' | 'custom'
  level?: 'log' | 'warn' | 'error'
  message: string
  data?: Record<string, unknown>
}

const MAX_AGE = 5 * 60 * 1000 // 5 minutes
const MAX_ENTRIES = 500
const MAX_MESSAGE_LENGTH = 500

let initialized = false
let originalConsoleLog: typeof console.log
let originalConsoleWarn: typeof console.warn
let originalConsoleError: typeof console.error
let originalFetch: typeof window.fetch

const logs: LogEntry[] = []

function add(entry: LogEntry) {
  entry.message = entry.message.slice(0, MAX_MESSAGE_LENGTH)
  logs.push(entry)
  // Prune: keep max entries and max age
  const cutoff = Date.now() - MAX_AGE
  while (logs.length > MAX_ENTRIES || (logs.length > 0 && logs[0].ts < cutoff)) {
    logs.shift()
  }
}

function getRecent(): LogEntry[] {
  const cutoff = Date.now() - MAX_AGE
  return logs.filter(l => l.ts >= cutoff).map(l => ({ ...l }))
}

function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url, window.location.origin)
    // Strip query params (may contain tokens) — keep only pathname
    return u.pathname
  } catch {
    return url.split('?')[0].slice(0, 200)
  }
}

function init() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  // === Console overrides ===
  originalConsoleLog = console.log
  originalConsoleWarn = console.warn
  originalConsoleError = console.error

  const wrapConsole = (level: 'log' | 'warn' | 'error', original: (...args: unknown[]) => void) => {
    return (...args: unknown[]) => {
      original.apply(console, args)
      try {
        const message = args.map(a =>
          typeof a === 'string' ? a : JSON.stringify(a)
        ).join(' ')
        add({ ts: Date.now(), type: 'console', level, message })
      } catch { /* ignore serialization errors */ }
    }
  }

  console.log = wrapConsole('log', originalConsoleLog)
  console.warn = wrapConsole('warn', originalConsoleWarn)
  console.error = wrapConsole('error', originalConsoleError)

  // === Global error handlers ===
  window.addEventListener('error', (event) => {
    add({
      ts: Date.now(),
      type: 'error',
      level: 'error',
      message: event.message || 'Unknown error',
      data: {
        filename: event.filename ? sanitizeUrl(event.filename) : undefined,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack?.slice(0, 1000),
      },
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    add({
      ts: Date.now(),
      type: 'error',
      level: 'error',
      message: reason?.message || String(reason).slice(0, MAX_MESSAGE_LENGTH),
      data: {
        stack: reason?.stack?.slice(0, 1000),
      },
    })
  })

  // === Fetch wrapper ===
  originalFetch = window.fetch
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    const method = init?.method || 'GET'
    const start = Date.now()
    try {
      const response = await originalFetch.call(window, input, init)
      add({
        ts: Date.now(),
        type: 'fetch',
        message: `${method} ${sanitizeUrl(url)} → ${response.status}`,
        data: { status: response.status, duration: Date.now() - start },
      })
      return response
    } catch (err) {
      add({
        ts: Date.now(),
        type: 'fetch',
        level: 'error',
        message: `${method} ${sanitizeUrl(url)} → FAILED`,
        data: { error: (err as Error).message, duration: Date.now() - start },
      })
      throw err
    }
  }

  // === Navigation tracking ===
  let lastPathname = window.location.pathname
  const checkNav = () => {
    if (window.location.pathname !== lastPathname) {
      add({
        ts: Date.now(),
        type: 'nav',
        message: `${lastPathname} → ${window.location.pathname}`,
      })
      lastPathname = window.location.pathname
    }
  }

  // Use popstate + periodic check (Next.js uses pushState)
  window.addEventListener('popstate', checkNav)
  const navInterval = setInterval(checkNav, 1000)

  // === Click tracking ===
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (!target) return
    const tag = target.tagName?.toLowerCase()
    const text = (target.textContent || '').trim().slice(0, 100)
    const selector = tag + (target.id ? `#${target.id}` : '') + (target.className && typeof target.className === 'string' ? `.${target.className.split(' ')[0]}` : '')
    add({
      ts: Date.now(),
      type: 'click',
      message: `${selector} "${text}"`,
    })
  }, { capture: true, passive: true })

  // Store cleanup ref (not used externally but good practice)
  ;(window as unknown as Record<string, unknown>).__logBufferCleanup = () => {
    clearInterval(navInterval)
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn
    console.error = originalConsoleError
    window.fetch = originalFetch
  }
}

export const logBuffer = { init, add, getRecent }
