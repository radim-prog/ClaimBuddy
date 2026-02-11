'use client'

import confetti from 'canvas-confetti'

/**
 * Fire confetti animation when a task is completed.
 * Small burst for individual tasks, big burst for inbox cleared.
 */
export function fireTaskConfetti() {
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { y: 0.7 },
    colors: ['#9333ea', '#a855f7', '#c084fc', '#22c55e', '#facc15'],
  })
}

export function fireInboxClearedConfetti() {
  const duration = 1500
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#9333ea', '#a855f7', '#22c55e'],
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#9333ea', '#a855f7', '#22c55e'],
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
