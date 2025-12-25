'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'

// Typy pro nastavení
export interface AlertSettings {
  // Onboarding
  onboardingStalledDays: number      // Dní bez aktivity = zaseklý (default: 7)
  onboardingLowProgressPercent: number // Práh nízkého postupu % (default: 50)
  onboardingShowStalled: boolean     // Zobrazovat zaseklé klienty
  onboardingEmailOnStalled: boolean  // Email při zaseknutí

  // Dokumenty / Uzávěrky
  documentCriticalDays: number       // Dní do kritického stavu (default: 3)
  documentUrgentDays: number         // Dní do urgentního stavu (default: 7)
  closureDeadlineDay: number         // Den v měsíci pro deadline uzávěrky (default: 10)

  // Úkoly
  taskOverdueCriticalDays: number    // Dní po termínu = kritické (default: 0)
  taskOverdueUrgentDays: number      // Dní před termínem = urgentní (default: 3)

  // Notifikace
  emailNotifications: boolean
  smsNotifications: boolean
  autoReminders: boolean
  autoApproveAI: boolean

  // Výchozí hodnoty
  defaultVatRate: number
  reminderDays: number
}

// Výchozí hodnoty
const defaultSettings: AlertSettings = {
  // Onboarding
  onboardingStalledDays: 7,
  onboardingLowProgressPercent: 50,
  onboardingShowStalled: true,
  onboardingEmailOnStalled: false,

  // Dokumenty / Uzávěrky
  documentCriticalDays: 3,
  documentUrgentDays: 7,
  closureDeadlineDay: 10,

  // Úkoly
  taskOverdueCriticalDays: 0,
  taskOverdueUrgentDays: 3,

  // Notifikace
  emailNotifications: true,
  smsNotifications: false,
  autoReminders: true,
  autoApproveAI: false,

  // Výchozí hodnoty
  defaultVatRate: 21,
  reminderDays: 7,
}

const STORAGE_KEY = 'accountant-settings'

interface SettingsContextType {
  settings: AlertSettings
  updateSettings: (newSettings: Partial<AlertSettings>) => void
  resetSettings: () => void
  isLoaded: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AlertSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Načtení z localStorage při mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge s defaults pro případ že přibudou nová nastavení
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error)
    }
    setIsLoaded(true)
  }, [])

  // Uložení do localStorage při změně
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      } catch (error) {
        console.error('Failed to save settings to localStorage:', error)
      }
    }
  }, [settings, isLoaded])

  const updateSettings = useCallback((newSettings: Partial<AlertSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(() => ({
    settings,
    updateSettings,
    resetSettings,
    isLoaded
  }), [settings, updateSettings, resetSettings, isLoaded])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

// Hook pro získání pouze alert nastavení (pro GlobalDeadlineAlert)
// Memoized aby se nevytvářel nový objekt při každém renderování
export function useAlertSettings() {
  const { settings, isLoaded } = useSettings()
  return useMemo(() => ({
    onboardingStalledDays: settings.onboardingStalledDays,
    onboardingLowProgressPercent: settings.onboardingLowProgressPercent,
    onboardingShowStalled: settings.onboardingShowStalled,
    documentCriticalDays: settings.documentCriticalDays,
    documentUrgentDays: settings.documentUrgentDays,
    closureDeadlineDay: settings.closureDeadlineDay,
    taskOverdueCriticalDays: settings.taskOverdueCriticalDays,
    taskOverdueUrgentDays: settings.taskOverdueUrgentDays,
    isLoaded,
  }), [
    settings.onboardingStalledDays,
    settings.onboardingLowProgressPercent,
    settings.onboardingShowStalled,
    settings.documentCriticalDays,
    settings.documentUrgentDays,
    settings.closureDeadlineDay,
    settings.taskOverdueCriticalDays,
    settings.taskOverdueUrgentDays,
    isLoaded
  ])
}
