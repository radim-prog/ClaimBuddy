'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const SHORTCUTS: Record<string, { path: string; label: string }> = {
  'd': { path: '/accountant/dashboard', label: 'Dashboard' },
  'k': { path: '/accountant/clients', label: 'Klienti' },
  'u': { path: '/accountant/tasks', label: 'Úkoly' },
  'p': { path: '/accountant/projects', label: 'Projekty' },
  'f': { path: '/accountant/invoicing', label: 'Fakturace' },
  'n': { path: '/accountant/settings/templates', label: 'Šablony' },
}

export function KeyboardShortcuts() {
  const router = useRouter()
  const [pendingG, setPendingG] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable) return

    // ? = show help
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      setShowHelp(prev => !prev)
      return
    }

    // Escape = close help
    if (e.key === 'Escape') {
      setShowHelp(false)
      setPendingG(false)
      return
    }

    // g + key navigation
    if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
      setPendingG(true)
      setTimeout(() => setPendingG(false), 1500)
      return
    }

    if (pendingG) {
      const shortcut = SHORTCUTS[e.key]
      if (shortcut) {
        e.preventDefault()
        router.push(shortcut.path)
        setPendingG(false)
        return
      }
      setPendingG(false)
    }

    // / = focus search (if exists)
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      const searchInput = document.querySelector('input[placeholder*="Hledat"]') as HTMLInputElement
      if (searchInput) {
        e.preventDefault()
        searchInput.focus()
      }
    }
  }, [pendingG, router])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!showHelp) {
    return pendingG ? (
      <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg z-50 animate-pulse">
        g + ...
      </div>
    ) : null
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowHelp(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Klávesové zkratky</h3>
          <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Navigace (g + klávesa)</div>
          {Object.entries(SHORTCUTS).map(([key, { label }]) => (
            <div key={key} className="flex justify-between items-center text-sm">
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <div className="flex gap-1">
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">g</kbd>
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">{key}</kbd>
              </div>
            </div>
          ))}
          <div className="border-t dark:border-gray-700 pt-3 mt-3">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Ostatní</div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700 dark:text-gray-300">Hledat</span>
              <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">/</kbd>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-700 dark:text-gray-300">Tato nápověda</span>
              <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">?</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
