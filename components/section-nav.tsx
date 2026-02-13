'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Calendar,
  FileText,
  Users,
  Car,
  Shield,
  CalendarDays,
  MessageCircle,
  ClipboardList,
  BarChart3,
  BookOpen,
  LucideIcon
} from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  badge?: number | string
}

interface SectionNavProps {
  items: NavItem[]
  activeSection?: string
}

export function SectionNav({ items, activeSection }: SectionNavProps) {
  const [active, setActive] = useState(activeSection || items[0]?.id)

  // Track scroll position to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = items.map(item => document.getElementById(item.id))
      const scrollPosition = window.scrollY + 100

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= scrollPosition) {
          setActive(items[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [items])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Offset for sticky header if any
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      setActive(id)
    }
  }

  return (
    <nav className="sticky top-4 space-y-1 bg-white dark:bg-gray-800 rounded-lg border p-2 shadow-sm">
      <div className="text-xs font-medium text-gray-400 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
        Navigace
      </div>
      {items.map((item) => {
        const Icon = item.icon
        const isActive = active === item.id

        return (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all
              ${isActive
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 hover:text-gray-900 dark:text-white'
              }
            `}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.badge !== undefined && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-600 dark:text-gray-400'}
              `}>
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

// Pre-defined nav items for client detail page
export const clientDetailNavItems: NavItem[] = [
  { id: 'info', label: 'Info o firmě', icon: Building2 },
  { id: 'closures', label: 'Uzávěrky', icon: Calendar },
  { id: 'tasks', label: 'Úkoly', icon: ClipboardList },
  { id: 'messages', label: 'Zprávy', icon: MessageCircle },
  { id: 'employees', label: 'Zaměstnanci', icon: Users },
  { id: 'assets', label: 'Majetek', icon: Car },
  { id: 'insurance', label: 'Pojištění', icon: Shield },
  { id: 'annual-closing', label: 'Roční uzávěrka', icon: BookOpen },
  { id: 'deadlines', label: 'Termíny', icon: CalendarDays },
  { id: 'reports', label: 'Reporty', icon: BarChart3 },
]
