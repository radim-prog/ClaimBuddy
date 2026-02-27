'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, FolderKanban } from 'lucide-react'

const tabs = [
  { name: 'Úkoly', href: '/accountant/tasks', icon: CheckSquare },
  { name: 'Projekty', href: '/accountant/projects', icon: FolderKanban },
]

export function WorkTabBar() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${isActive
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
