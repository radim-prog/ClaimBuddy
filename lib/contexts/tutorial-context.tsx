'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useTutorial } from '@/lib/hooks/use-tutorial'
import { TutorialStep } from '@/lib/tutorial-steps'

type TutorialContextType = ReturnType<typeof useTutorial>

const TutorialContext = createContext<TutorialContextType | null>(null)

type TutorialProviderProps = {
  children: ReactNode
  steps?: TutorialStep[]
  apiPath?: string
  storageKey?: string
}

export function TutorialProvider({ children, steps, apiPath, storageKey }: TutorialProviderProps) {
  const tutorial = useTutorial({ steps, apiPath, storageKey })
  return (
    <TutorialContext.Provider value={tutorial}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorialContext() {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error('useTutorialContext must be used within TutorialProvider')
  return ctx
}
