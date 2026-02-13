'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TileConfig, TileDefinition, PageLayout } from '@/lib/types/layout'

function defaultsToTiles(defaults: TileDefinition[]): TileConfig[] {
  return defaults.map((d, i) => ({
    id: d.id,
    visible: d.defaultVisible,
    position: i,
  }))
}

export function useTileLayout(pageKey: string, defaultTiles: TileDefinition[]) {
  const [tiles, setTiles] = useState<TileConfig[]>(() => defaultsToTiles(defaultTiles))
  const [loading, setLoading] = useState(true)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tilesRef = useRef(tiles)
  tilesRef.current = tiles

  // Fetch saved layout on mount
  useEffect(() => {
    let cancelled = false

    async function fetchLayout() {
      try {
        const res = await fetch(`/api/user/layout-preferences?page_key=${encodeURIComponent(pageKey)}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()

        if (cancelled) return

        if (data.layout?.tiles) {
          const saved = data.layout.tiles as TileConfig[]
          // Merge: keep saved order/visibility but add any new tiles not in saved
          const savedIds = new Set(saved.map((t: TileConfig) => t.id))
          const merged = [
            ...saved,
            ...defaultTiles
              .filter(d => !savedIds.has(d.id))
              .map((d, i) => ({
                id: d.id,
                visible: d.defaultVisible,
                position: saved.length + i,
              })),
          ]
          setTiles(merged)
        }
      } catch {
        // Use defaults on error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLayout()
    return () => { cancelled = true }
  }, [pageKey, defaultTiles])

  // Debounced save
  const saveLayout = useCallback((newTiles: TileConfig[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const layout: PageLayout = { tiles: newTiles }
      fetch('/api/user/layout-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_key: pageKey, layout }),
      }).catch(() => {
        // Silent fail - layout is already applied optimistically
      })
    }, 500)
  }, [pageKey])

  const toggleTile = useCallback((id: string) => {
    setTiles(prev => {
      const next = prev.map(t => t.id === id ? { ...t, visible: !t.visible } : t)
      saveLayout(next)
      return next
    })
  }, [saveLayout])

  const reorderTiles = useCallback((activeId: string, overId: string) => {
    setTiles(prev => {
      const oldIndex = prev.findIndex(t => t.id === activeId)
      const newIndex = prev.findIndex(t => t.id === overId)
      if (oldIndex === -1 || newIndex === -1) return prev

      const next = [...prev]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      // Re-index positions
      const reindexed = next.map((t, i) => ({ ...t, position: i }))
      saveLayout(reindexed)
      return reindexed
    })
  }, [saveLayout])

  const resetToDefault = useCallback(() => {
    const defaults = defaultsToTiles(defaultTiles)
    setTiles(defaults)
    saveLayout(defaults)
  }, [defaultTiles, saveLayout])

  // Sorted by position
  const sortedTiles = [...tiles].sort((a, b) => a.position - b.position)

  return {
    tiles: sortedTiles,
    loading,
    toggleTile,
    reorderTiles,
    resetToDefault,
  }
}
