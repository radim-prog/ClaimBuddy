'use client'

import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Calculator, Shield, ChevronDown } from 'lucide-react'
import { IS_CLAIMS_ONLY_PRODUCT } from '@/lib/product-config'
import { useActiveModule } from '@/lib/contexts/active-module-context'

interface AppModule {
  id: 'accounting' | 'claims'
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
    href: '/accountant/claims/dashboard',
    icon: Shield,
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/20 text-blue-300',
    description: 'Správa pojistných událostí',
  },
]

export function AppSwitcher({ userModules, collapsed = false }: { userModules: string[]; collapsed?: boolean }) {
  if (IS_CLAIMS_ONLY_PRODUCT) return null

  const router = useRouter()
  const { activeModule, setActiveModule } = useActiveModule()

  const availableModules = APP_MODULES.filter(m => userModules.includes(m.id))

  // Don't render if user has only one module
  if (availableModules.length <= 1) return null

  const currentModule = APP_MODULES.find(m => m.id === activeModule) ?? APP_MODULES[0]

  const CurrentIcon = currentModule.icon

  const dropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-2 ${collapsed ? 'justify-center w-full' : ''} px-2 py-1.5 rounded-lg hover:bg-white/[0.08] transition-all duration-200 text-white/70 hover:text-white/90`}>
          <CurrentIcon className={`h-4 w-4 ${currentModule.color}`} />
          {!collapsed && <span className="text-xs font-medium">{currentModule.name}</span>}
          {!collapsed && <ChevronDown className="h-3 w-3 text-white/40" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={collapsed ? 'center' : 'start'} side={collapsed ? 'right' : undefined} className="w-64">
        {availableModules.map((mod) => {
          const Icon = mod.icon
          const isActive = mod.id === activeModule
          return (
            <DropdownMenuItem
              key={mod.id}
              onClick={() => {
                setActiveModule(mod.id)
                router.push(mod.href)
              }}
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

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{dropdown}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {currentModule.name}
        </TooltipContent>
      </Tooltip>
    )
  }

  return dropdown
}
