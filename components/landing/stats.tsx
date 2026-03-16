'use client'

import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 40, suffix: '+', label: 'modulů v jedné platformě' },
  { value: 120, suffix: '+', label: 'firem pod správou' },
  { value: 72, suffix: '', label: 'článků ve znalostní bázi' },
  { value: 0, suffix: ' Kč', label: 'na prvních 30 dní' },
]

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const duration = 1200
          const steps = 30
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.round(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={ref} className="text-4xl sm:text-5xl font-black tracking-tight">
      <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        {count}{suffix}
      </span>
    </div>
  )
}

export function Stats() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container relative mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {STATS.map((s) => (
            <div key={s.label} className="text-center group">
              <AnimatedCounter target={s.value} suffix={s.suffix} />
              <div className="mt-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
