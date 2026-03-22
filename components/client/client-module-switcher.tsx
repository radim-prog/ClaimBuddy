'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calculator, Shield, Lock, ChevronDown, ArrowRight } from 'lucide-react'
import { useActiveModule } from '@/lib/contexts/active-module-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type ModuleDef = {
  id: 'accounting' | 'claims'
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  activeColor: string
  bgGradient: string
  description: string
  crossSellTitle: string
  crossSellMessage: string
  crossSellCta: string
  crossSellHref: string
}

const CLIENT_MODULES: ModuleDef[] = [
  {
    id: 'accounting',
    name: 'Účetnictví',
    href: '/client/dashboard',
    icon: Calculator,
    color: 'text-violet-400',
    activeColor: 'bg-violet-500/20 text-violet-300',
    bgGradient: 'from-violet-400 to-violet-500',
    description: 'Doklady, faktury a účetní přehled',
    crossSellTitle: 'Potřebujete účetní?',
    crossSellMessage: 'Zajistíme vám profesionální účetní služby. Kompletní vedení účetnictví, daně a poradenství.',
    crossSellCta: 'Zjistit více',
    crossSellHref: '/client/dashboard',
  },
  {
    id: 'claims',
    name: 'Pojistné události',
    href: '/client/claims',
    icon: Shield,
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/20 text-blue-300',
    bgGradient: 'from-blue-400 to-blue-500',
    description: 'Správa a sledování pojistných událostí',
    crossSellTitle: 'Řešíte pojistnou událost?',
    crossSellMessage: 'Můžeme vám pomoci s řešením pojistné události. Nahlásíte ji a my se o vše postaráme.',
    crossSellCta: 'Nahlásit událost',
    crossSellHref: '/claims/new',
  },
]

export function ClientModuleSwitcher({
  userModules,
  collapsed,
}: {
  userModules: string[]
  collapsed: boolean
}) {
  const router = useRouter()
  const { activeModule, setActiveModule } = useActiveModule()
  const [crossSellOpen, setCrossSellOpen] = useState<'accounting' | 'claims' | null>(null)

  const currentModule = CLIENT_MODULES.find(m => m.id === activeModule) ?? CLIENT_MODULES[0]
  const otherModule = CLIENT_MODULES.find(m => m.id !== activeModule)!

  const hasBothModules = userModules.includes('accounting') && userModules.includes('claims')
  const hasAccounting = userModules.includes('accounting')
  const hasClaims = userModules.includes('claims')

  // Only one module and nothing to show
  if (userModules.length <= 1 && !otherModule) return null

  const CurrentIcon = currentModule.icon

  const crossSellMod = crossSellOpen ? CLIENT_MODULES.find(m => m.id === crossSellOpen)! : null

  // Both modules available — active dropdown switcher
  if (hasBothModules) {
    if (collapsed) return null

    return (
      <div className="relative px-3 py-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.08] transition-all duration-200 text-white/70 hover:text-white/90">
              <CurrentIcon className={`h-4 w-4 ${currentModule.color}`} />
              <span className="text-xs font-medium flex-1 text-left">{currentModule.name}</span>
              <ChevronDown className="h-3 w-3 text-white/40" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            {CLIENT_MODULES.map((mod) => {
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
      </div>
    )
  }

  // Only one module — show the other as locked with cross-sell
  const lockedModuleId = hasAccounting ? 'claims' : 'accounting'
  const lockedMod = CLIENT_MODULES.find(m => m.id === lockedModuleId)!
  const LockedIcon = lockedMod.icon

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <div className="px-3 py-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCrossSellOpen(lockedModuleId)}
                className="w-full flex items-center justify-center px-2 py-1.5 rounded-lg text-white/25 hover:bg-white/[0.04] hover:text-white/40 transition-all duration-200"
              >
                <LockedIcon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">{lockedMod.name}</TooltipContent>
          </Tooltip>
        </div>
        {crossSellMod && (
          <Dialog open={!!crossSellOpen} onOpenChange={() => setCrossSellOpen(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{crossSellMod.crossSellTitle}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{crossSellMod.crossSellMessage}</p>
              <a
                href={crossSellMod.crossSellHref}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r ${crossSellMod.bgGradient} text-white text-sm font-medium hover:opacity-90 transition-opacity w-fit`}
              >
                {crossSellMod.crossSellCta}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </DialogContent>
          </Dialog>
        )}
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="px-3 py-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCrossSellOpen(lockedModuleId)}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-white/25 hover:bg-white/[0.04] hover:text-white/40 transition-all duration-200"
            >
              <LockedIcon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium flex-1 text-left">{lockedMod.name}</span>
              <Lock className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">{lockedMod.crossSellTitle}</TooltipContent>
        </Tooltip>
      </div>
      {crossSellMod && (
        <Dialog open={!!crossSellOpen} onOpenChange={() => setCrossSellOpen(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{crossSellMod.crossSellTitle}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{crossSellMod.crossSellMessage}</p>
            <a
              href={crossSellMod.crossSellHref}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r ${crossSellMod.bgGradient} text-white text-sm font-medium hover:opacity-90 transition-opacity w-fit`}
            >
              {crossSellMod.crossSellCta}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  )
}
