'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { TUTORIAL_STEPS, TutorialStep } from '@/lib/tutorial-steps'

type TutorialStepProgress = {
  id: string
  title: string
  description: string
  href: string
  completed: boolean
  completed_at: string | null
}

type UseTutorialOptions = {
  steps?: TutorialStep[]
  apiPath?: string
  storageKey?: string
}

export function useTutorial(options?: UseTutorialOptions) {
  const tutorialSteps = options?.steps ?? TUTORIAL_STEPS
  const apiPath = options?.apiPath ?? '/api/accountant/tutorial'
  const storageKey = options?.storageKey ?? 'tutorial-dismissed'

  const [steps, setSteps] = useState<TutorialStepProgress[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  // Interactive tour state
  const [isActive, setIsActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const router = useRouter()
  const pathname = usePathname()

  const currentStep = isActive ? tutorialSteps[currentStepIndex] ?? null : null

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(apiPath)
      if (!res.ok) return
      const data = await res.json()
      setSteps(data.steps)
      setCompletedCount(data.completed_count)
      setTotalCount(data.total_count)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [apiPath])

  useEffect(() => {
    const wasDismissed = localStorage.getItem(storageKey) === '1'
    setDismissed(wasDismissed)
    fetchProgress()
  }, [fetchProgress, storageKey])

  const completeStep = useCallback(async (stepId: string) => {
    // Optimistic update
    setSteps(prev => {
      const already = prev.find(s => s.id === stepId)?.completed
      if (already) return prev
      return prev.map(s =>
        s.id === stepId ? { ...s, completed: true, completed_at: new Date().toISOString() } : s
      )
    })
    setCompletedCount(prev => {
      const step = steps.find(s => s.id === stepId)
      if (step?.completed) return prev
      return prev + 1
    })

    try {
      await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: stepId }),
      })
    } catch {
      // revert on error
      fetchProgress()
    }
  }, [steps, fetchProgress, apiPath])

  const dismiss = useCallback(() => {
    setDismissed(true)
    localStorage.setItem(storageKey, '1')
  }, [storageKey])

  const reset = useCallback(async () => {
    setDismissed(false)
    localStorage.removeItem(storageKey)
    await fetch(apiPath, { method: 'DELETE' })
    fetchProgress()
  }, [fetchProgress, storageKey, apiPath])

  // --- Interactive tour methods ---

  const startTour = useCallback(() => {
    setCurrentStepIndex(0)
    setIsActive(true)
  }, [])

  const stopTour = useCallback(() => {
    setIsActive(false)
  }, [])

  const navigateToStepPage = useCallback((stepIndex: number) => {
    const step = tutorialSteps[stepIndex]
    if (!step) return

    // Special pages
    if (step.page === '__any__') return
    if (step.page === '__client_detail__') {
      // If not already on a client detail page, navigate to clients
      if (!(pathname ?? '').startsWith('/accountant/clients/')) {
        router.push('/accountant/clients')
      }
      return
    }

    // Navigate if not already on the right page
    if (!(pathname ?? '').startsWith(step.page)) {
      router.push(step.page)
    }
  }, [pathname, router, tutorialSteps])

  const nextStep = useCallback(() => {
    const step = tutorialSteps[currentStepIndex]
    if (step) {
      completeStep(step.id)
    }

    const nextIdx = currentStepIndex + 1
    if (nextIdx >= tutorialSteps.length) {
      // Tour complete
      setIsActive(false)
      return
    }

    setCurrentStepIndex(nextIdx)
    navigateToStepPage(nextIdx)
  }, [currentStepIndex, completeStep, navigateToStepPage, tutorialSteps])

  const prevStep = useCallback(() => {
    const prevIdx = currentStepIndex - 1
    if (prevIdx < 0) return

    setCurrentStepIndex(prevIdx)
    navigateToStepPage(prevIdx)
  }, [currentStepIndex, navigateToStepPage])

  const isAllComplete = completedCount >= totalCount && totalCount > 0

  return {
    // Legacy progress tracking
    steps,
    completedCount,
    totalCount,
    loading,
    dismissed,
    isAllComplete,
    completeStep,
    dismiss,
    reset,
    refresh: fetchProgress,

    // Interactive tour
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps: tutorialSteps.length,
    tutorialSteps,
    startTour,
    stopTour,
    nextStep,
    prevStep,
  }
}
