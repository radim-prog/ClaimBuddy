'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo, useRef } from 'react'

/**
 * Syncs filter state with URL search params using router.replace().
 * Default values are used as fallbacks when params are missing from URL.
 * Setting a value back to its default removes the param from the URL.
 */
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const defaultsRef = useRef(defaults)
  defaultsRef.current = defaults

  const filters = useMemo(() => {
    const result = {} as { [K in keyof T]: string }
    for (const key in defaultsRef.current) {
      result[key] = searchParams.get(key) ?? defaultsRef.current[key]
    }
    return result
  }, [searchParams])

  const setFilter = useCallback(
    (key: keyof T & string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === defaultsRef.current[key] || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [searchParams, pathname, router],
  )

  const setFilters = useCallback(
    (updates: Partial<Record<keyof T & string, string>>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const key in updates) {
        const value = updates[key]!
        if (value === defaultsRef.current[key] || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [searchParams, pathname, router],
  )

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    for (const key in defaultsRef.current) {
      params.delete(key)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchParams, pathname, router])

  return { filters, setFilter, setFilters, clearFilters }
}
