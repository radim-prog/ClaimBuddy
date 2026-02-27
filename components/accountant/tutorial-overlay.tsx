'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTutorialContext } from '@/lib/contexts/tutorial-context'
import { TUTORIAL_STEPS } from '@/lib/tutorial-steps'
import { Button } from '@/components/ui/button'
import { X, ChevronRight, ChevronLeft, PartyPopper, Rocket, Sparkles } from 'lucide-react'

type Rect = { top: number; left: number; width: number; height: number }

export function TutorialOverlay() {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    nextStep,
    prevStep,
    stopTour,
  } = useTutorialContext()

  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [showComplete, setShowComplete] = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  const [animating, setAnimating] = useState(false)
  const rafRef = useRef<number>(0)
  const totalSteps = TUTORIAL_STEPS.length

  // Show intro when tour starts
  useEffect(() => {
    if (isActive && currentStepIndex === 0 && !showIntro && !showComplete) {
      setShowIntro(true)
    }
  }, [isActive, currentStepIndex, showIntro, showComplete])

  // Find and track target element position
  const updateRect = useCallback(() => {
    if (!currentStep || showIntro) {
      setTargetRect(null)
      return
    }

    const el = document.querySelector(currentStep.targetSelector)
    if (!el) {
      setTargetRect(null)
      return
    }

    const rect = el.getBoundingClientRect()
    const isVisible =
      rect.top >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.left >= 0 &&
      rect.right <= window.innerWidth

    if (!isVisible) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    })
  }, [currentStep, showIntro])

  // Re-measure on step change, resize, scroll
  useEffect(() => {
    if (!isActive || showIntro) return

    const timer = setTimeout(updateRect, 300)

    const handleChange = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateRect)
    }

    window.addEventListener('resize', handleChange)
    window.addEventListener('scroll', handleChange, true)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', handleChange)
      window.removeEventListener('scroll', handleChange, true)
    }
  }, [isActive, currentStep, showIntro, updateRect])

  // Keyboard navigation
  useEffect(() => {
    if (!isActive || showIntro || showComplete) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext()
      else if (e.key === 'ArrowLeft' && currentStepIndex > 0) prevStep()
      else if (e.key === 'Escape') stopTour()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isActive, showIntro, showComplete, currentStepIndex])

  const handleStartTour = useCallback(() => {
    setShowIntro(false)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)
  }, [])

  const handleNext = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) {
      setShowComplete(true)
      nextStep()
      return
    }
    setAnimating(true)
    nextStep()
    setTimeout(() => setAnimating(false), 400)
  }, [currentStepIndex, totalSteps, nextStep])

  const handleFinish = useCallback(() => {
    setShowComplete(false)
    setShowIntro(false)
    stopTour()
  }, [stopTour])

  if (!isActive && !showComplete) return null

  // ========== INTRO SCREEN ==========
  if (showIntro) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleFinish} />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Vítejte v průvodci
            </h2>
            <p className="text-purple-200 text-sm">
              Za 7 kroků vám ukážeme vše důležité
            </p>
          </div>

          {/* Steps preview */}
          <div className="px-6 py-5">
            <div className="space-y-2 mb-6">
              {TUTORIAL_STEPS.slice(0, 4).map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={step.id} className="flex items-center gap-3 text-sm">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex-shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{step.title}</span>
                  </div>
                )
              })}
              <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  <span className="text-xs font-bold">+{totalSteps - 4}</span>
                </div>
                <span>...a další kroky</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleFinish}
                className="flex-1 rounded-xl"
              >
                Později
              </Button>
              <Button
                onClick={handleStartTour}
                className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
              >
                Začít průvodce
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-3">
              Navigace: šipky nebo Enter / Esc pro ukončení
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ========== COMPLETE SCREEN ==========
  if (showComplete) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleFinish} />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
              <PartyPopper className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Výborně!
            </h2>
            <p className="text-emerald-100 text-sm">
              Prošli jste všech {totalSteps} kroků průvodce
            </p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Znáte základy aplikace. Průvodce můžete kdykoli spustit znovu z postranního menu.
            </p>
            <Button onClick={handleFinish} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-8">
              <Sparkles className="h-4 w-4 mr-2" />
              Jdeme na to
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ========== SPOTLIGHT + TOOLTIP ==========
  const padding = 10
  const spotlightStyle = targetRect
    ? {
        position: 'fixed' as const,
        top: targetRect.top - padding,
        left: targetRect.left - padding,
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
        borderRadius: '12px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 20px 4px rgba(147, 51, 234, 0.3)',
        zIndex: 61,
        pointerEvents: 'none' as const,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    : null

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || !currentStep) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }

    const tooltipWidth = 360
    const tooltipGap = 20
    const style: React.CSSProperties = { position: 'fixed' }

    switch (currentStep.placement) {
      case 'right':
        style.top = Math.max(16, targetRect.top - 10)
        style.left = targetRect.left + targetRect.width + padding + tooltipGap
        if (style.left as number + tooltipWidth > window.innerWidth - 16) {
          style.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - tooltipWidth - 16))
          style.top = targetRect.top + targetRect.height + padding + tooltipGap
        }
        break
      case 'left':
        style.top = Math.max(16, targetRect.top - 10)
        style.left = targetRect.left - padding - tooltipGap - tooltipWidth
        if ((style.left as number) < 16) {
          style.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - tooltipWidth - 16))
          style.top = targetRect.top + targetRect.height + padding + tooltipGap
        }
        break
      case 'bottom':
        style.top = targetRect.top + targetRect.height + padding + tooltipGap
        style.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - tooltipWidth - 16))
        break
      case 'top':
        style.top = targetRect.top - padding - tooltipGap - 200
        style.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - tooltipWidth - 16))
        if ((style.top as number) < 16) {
          style.top = targetRect.top + targetRect.height + padding + tooltipGap
        }
        break
    }

    if (typeof style.left === 'number' && style.left + tooltipWidth > window.innerWidth - 16) {
      style.left = window.innerWidth - tooltipWidth - 16
    }

    return style
  }

  const Icon = currentStep?.icon
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <>
      {/* Dark overlay when no target found */}
      {!targetRect && (
        <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm" />
      )}

      {/* Spotlight hole with purple glow */}
      {spotlightStyle && <div style={spotlightStyle} />}

      {/* Tooltip card */}
      <div
        style={{ ...getTooltipStyle(), zIndex: 62, width: 360 }}
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${
          animating ? 'animate-in fade-in zoom-in-95 duration-300' : ''
        }`}
      >
        {/* Gradient step indicator */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm">
                <Icon className="h-4 w-4 text-white" />
              </div>
            )}
            <div>
              <span className="text-white font-semibold text-sm">
                {currentStep?.title}
              </span>
              <div className="text-purple-200 text-[11px]">
                Krok {currentStepIndex + 1} z {totalSteps}
              </div>
            </div>
          </div>
          <button
            onClick={stopTour}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-purple-100 dark:bg-purple-900/30">
          <div
            className="h-full bg-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
            {currentStep?.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={stopTour}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Přeskočit průvodce
            </button>
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <Button variant="outline" size="sm" onClick={prevStep} className="h-8 px-3 text-xs rounded-lg">
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Zpět
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="h-8 px-4 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
              >
                {currentStepIndex >= totalSteps - 1 ? (
                  <>
                    Dokončit
                    <Sparkles className="h-3.5 w-3.5 ml-1" />
                  </>
                ) : (
                  <>
                    Další
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
