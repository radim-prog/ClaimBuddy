'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, Check } from 'lucide-react'
import { SIDEBAR_THEME_LIST, getSavedThemeId, saveThemeId } from '@/lib/sidebar-themes'
import type { SidebarThemeId } from '@/lib/sidebar-themes'

export default function AppearanceSettingsPage() {
  const [activeTheme, setActiveTheme] = useState<SidebarThemeId>('classic')

  useEffect(() => {
    setActiveTheme(getSavedThemeId())
  }, [])

  const handleSelect = (id: SidebarThemeId) => {
    setActiveTheme(id)
    saveThemeId(id)
    // Dispatch event so sidebar picks up the change without full reload
    window.dispatchEvent(new CustomEvent('sidebar-theme-change', { detail: id }))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Palette className="h-3.5 w-3.5" />
            Vzhled sidebar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-4">
            Vyberte styl postranního menu. Změna se projeví okamžitě.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {SIDEBAR_THEME_LIST.map(theme => {
              const isActive = theme.id === activeTheme
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelect(theme.id)}
                  className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${theme.preview.bg} flex-shrink-0 shadow-sm`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{theme.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{theme.description}</p>
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
