'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calculator, Shield, ChevronDown } from 'lucide-react'

interface AppModule {
  id: string
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  activeColor: string
  description: string
}

const APP_MODULES: AppModule[] = [
  {
    id: 'accounting',
    name: 'Účetnictví',
    href: '/accountant/dashboard',
    icon: Calculator,
    color: 'text-violet-400',
    activeColor: 'bg-violet-500/20 text-violet-300',
    description: 'Správa klientů, dokladů a uzávěrek',
  },
  {
    id: 'claims',
    name: 'Pojistné události',
    href: '/claims/dashboard',
    icon: Shield,
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/20 text-blue-300',
    description: 'Správa pojistných událostí',
  },
]

export function AppSwitcher({ userModules }: { userModules: string[] }) {
  const pathname = usePathname() ?? ''
  const router = useRouter()

  const availableModules = APP_MODULES.filter(m => userModules.includes(m.id))

  // Don't render if user has only one module
  if (availableModules.length <= 1) return null

  const currentModule = pathname.startsWith('/claims')
    ? APP_MODULES.find(m => m.id === 'claims')!
    : APP_MODULES.find(m => m.id === 'accounting')!

  const CurrentIcon = currentModule.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.08] transition-all duration-200 text-white/70 hover:text-white/90">
          <CurrentIcon className={`h-4 w-4 ${currentModule.color}`} />
          <span className="text-xs font-medium hidden sm:inline">{currentModule.name}</span>
          <ChevronDown className="h-3 w-3 text-white/40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {availableModules.map((mod) => {
          const Icon = mod.icon
          const isActive = mod.id === currentModule.id
          return (
            <DropdownMenuItem
              key={mod.id}
              onClick={() => router.push(mod.href)}
              className={`cursor-pointer ${isActive ? 'bg-accent' : ''}`}
            >
              <Icon className={`mr-3 h-5 w-5 ${mod.color}`} />
              <div>
                <p className="text-sm font-medium">{mod.name}</p>
                <p className="text-xs text-muted-foreground">{mod.description}</p>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
