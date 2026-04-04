'use client'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

const POLL_INTERVAL = 60_000

export function useVersionCheck() {
  const initialVersion = useRef<string | null>(null)
  const toastShown = useRef(false)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' })
        const version = await res.text()

        if (initialVersion.current === null) {
          initialVersion.current = version
          return
        }

        if (version !== initialVersion.current && !toastShown.current) {
          toastShown.current = true
          toast('Aplikace byla aktualizována', {
            description: 'Klikněte pro načtení nové verze',
            duration: Infinity,
            action: {
              label: 'Načíst',
              onClick: () => window.location.reload(),
            },
          })
        }
      } catch {
        // Network error — ignore, don't trigger false reload
      }
    }

    check()
    const id = setInterval(check, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])
}
