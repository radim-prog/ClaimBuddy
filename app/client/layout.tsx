'use client'

import React from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  LogOut,
  UserCircle,
  FileText,
  Car,
  Users,
  ChevronRight,
  ChevronLeft,
  Lock,
  Crown,
  ClipboardList,
  Landmark,
  Package,
  UserCheck,
  BookOpen,
  FolderOpen,
  FilePlus,
  Shield,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { logout } from '@/app/auth/login/actions'
import { ClientUserProvider, useClientUser } from '@/lib/contexts/client-user-context'
import { ActiveModuleProvider, useActiveModule } from '@/lib/contexts/active-module-context'
import { NotificationModal } from '@/components/client/notification-modal'
import { NotificationBanner } from '@/components/client/notification-banner'
import { ImpersonationBanner } from '@/components/client/impersonation-banner'
import { MissingDocsBar } from '@/components/client/missing-docs-bar'
import { CompanySwitcher } from '@/components/client/company-switcher'
import { CompanyPickerModal } from '@/components/client/company-picker-modal'
import { ClientModuleSwitcher } from '@/components/client/client-module-switcher'
import { usePlanFeatures } from '@/lib/hooks/use-plan-features'
import { useClientUnreadMessages } from '@/hooks/use-client-unread-messages'
import { TutorialProvider, useTutorialContext } from '@/lib/contexts/tutorial-context'
import { TutorialOverlay } from '@/components/accountant/tutorial-overlay'
import { CLIENT_TUTORIAL_STEPS } from '@/lib/client-tutorial-steps'

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard; feature?: string; tourId?: string; divider?: boolean; matchPaths?: string[] }

// Accounting context navigation
const accountingNavigation: NavItem[] = [
  { name: 'Přehled',           href: '/client/dashboard',   icon: LayoutDashboard, tourId: 'client-dashboard' },
  { name: 'Doklady & Faktury', href: '/client/documents',   icon: FileText,        tourId: 'client-documents', matchPaths: ['/client/documents', '/client/invoices'] },
  { name: 'Kniha jízd',        href: '/client/travel',      icon: Car,             tourId: 'client-travel' },
  { name: 'Zprávy',            href: '/client/messages',    icon: MessageSquare,   tourId: 'client-messages' },
]

// Claims context navigation
const claimsNavigation: NavItem[] = [
  { name: 'Moje případy', href: '/client/claims', icon: FolderOpen },
  { name: 'Soubory', href: '/client/documents', icon: FileText },
  { name: 'Zprávy', href: '/client/messages', icon: MessageSquare },
  { name: 'Nahlásit událost', href: '/claims/new', icon: FilePlus, divider: true },
]

// Dynamic navigation — visible only when portal_sections[key] is true (accounting only)
const dynamicNavigation: { name: string; href: string; icon: typeof LayoutDashboard; portalKey: string; tourId?: string }[] = [
  { name: 'Daně', href: '/client/taxes', icon: Landmark, portalKey: 'tax_overview', tourId: 'client-taxes' },
  { name: 'Majetek', href: '/client/assets', icon: Package, portalKey: 'assets' },
  { name: 'Zaměstnanci', href: '/client/employees', icon: UserCheck, portalKey: 'employees' },
  { name: 'Adresář', href: '/client/partners', icon: Users, portalKey: 'address_book' },
  { name: 'Dotazník', href: '/client/tax-questionnaire', icon: ClipboardList, portalKey: 'tax_questionnaire' },
]

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const { userName, userInitials, selectedCompany, selectedCompanyId, setSelectedCompanyId, userModules, companies, visibleCompanies, showCompanyPicker, setShowCompanyPicker, setDefaultCompany } = useClientUser()
  const { isLocked, planTier } = usePlanFeatures()
  const { totalUnread } = useClientUnreadMessages()
  const { startTour } = useTutorialContext()
  const { activeModule } = useActiveModule()
  const isClaims = activeModule === 'claims'
  const [notificationsDismissed, setNotificationsDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [questionnaireNew, setQuestionnaireNew] = useState(false)

  // Check if there's a questionnaire with status='sent' (new for client)
  useEffect(() => {
    if (!selectedCompanyId) return
    const year = new Date().getFullYear()
    fetch(`/api/client/tax-questionnaire?company_id=${selectedCompanyId}&year=${year}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.questionnaire?.status === 'sent') setQuestionnaireNew(true)
        else setQuestionnaireNew(false)
      })
      .catch(() => {})
  }, [selectedCompanyId])

  // Build navigation: base + dynamic sections enabled for this company
  const portalSections = selectedCompany?.portal_sections || {}
  const enabledDynamic = dynamicNavigation.filter(item => portalSections[item.portalKey])
  const baseNavigation = isClaims ? claimsNavigation : accountingNavigation
  const navigation = useMemo(() => {
    if (isClaims) return claimsNavigation
    const result = [...baseNavigation]
    // Insert dynamic items before divider
    const dividerIdx = result.findIndex(n => 'divider' in n && n.divider)
    const insertAt = dividerIdx >= 0 ? dividerIdx : result.length
    result.splice(insertAt, 0, ...enabledDynamic)
    return result
  }, [enabledDynamic.length, selectedCompany?.id, isClaims])

  // Claims branding: override favicon + title on claims.zajcon.cz
  useEffect(() => {
    if (!isClaims) return
    document.title = document.title.replace('Účetní OS', 'Pojistná Pomoc')
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (favicon) favicon.href = '/favicon-claims.svg'
  }, [isClaims, pathname])

  // Auto-start tutorial for first-time users
  useEffect(() => {
    if (isClaims) return
    const dismissed = localStorage.getItem('client-tutorial-dismissed')
    if (dismissed) return
    fetch('/api/client/tutorial')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.completed_steps?.length === 0) {
          startTour()
        }
      })
      .catch(() => {})
  }, [isClaims]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const saved = localStorage.getItem('client-sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleSidebar = () => {
    setCollapsed(prev => {
      localStorage.setItem('client-sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      {!isClaims && <MissingDocsBar />}
      <NotificationModal onDismissed={() => setNotificationsDismissed(true)} />
      <NotificationBanner dismissed={notificationsDismissed} />
      <CompanyPickerModal
        open={showCompanyPicker}
        companies={visibleCompanies}
        onSelect={(id) => { setSelectedCompanyId(id); setShowCompanyPicker(false) }}
        onSetDefault={setDefaultCompany}
        onClose={() => setShowCompanyPicker(false)}
      />

      {/* Sidebar - Desktop */}
      <aside className={`hidden md:fixed md:inset-y-0 md:flex md:flex-col z-30 transition-all duration-300 ease-in-out ${collapsed ? 'md:w-[72px]' : 'md:w-64'}`}>
        {/* Floating toggle button on edge */}
        <button
          onClick={toggleSidebar}
          className="absolute top-[76px] -right-3 w-6 h-6 rounded-full bg-background border border-border/50 shadow-soft flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-soft-md hover:scale-110 transition-all duration-200 z-50"
          title={collapsed ? 'Rozbalit menu' : 'Zmenšit menu'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <div className="flex flex-col flex-grow sidebar-blue shadow-sidebar overflow-y-auto custom-scrollbar">
          {/* Logo */}
          <div className={`relative flex items-center h-16 flex-shrink-0 border-b border-white/[0.06] transition-all duration-300 ${collapsed ? 'justify-center px-3' : 'px-5'}`}>
            <Link href={isClaims ? '/client/claims' : '/client/dashboard'} className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-soft-sm flex-shrink-0 ${isClaims ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                {isClaims ? (
                  <Shield className="h-4 w-4 text-white" />
                ) : (
                  <span className="text-sm font-bold text-white font-display">U</span>
                )}
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-base font-semibold text-white/95 font-display tracking-tight whitespace-nowrap">
                    {isClaims ? 'PU Portál' : 'Účetní OS'}
                  </h1>
                  <p className="text-[10px] text-white/40 font-medium whitespace-nowrap">
                    {isClaims ? 'Pojistné události' : 'Klientský portál'}
                  </p>
                </div>
              )}
            </Link>
          </div>

          {/* Company Switcher */}
          <CompanySwitcher collapsed={collapsed} />

          {/* Navigation */}
          <TooltipProvider delayDuration={0}>
            <nav className="relative flex-1 px-3 py-4 space-y-0.5">
              {navigation.map((item) => {
                const isActive = item.matchPaths
                  ? item.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
                  : (pathname === item.href || pathname.startsWith(item.href + '/'))
                const Icon = item.icon
                const locked = item.feature ? isLocked(item.feature) : false
                const showDivider = 'divider' in item && item.divider
                const linkEl = (
                  <Link
                    href={locked ? '/client/subscription' : item.href}
                    data-tour={item.tourId}
                    className={`
                      group flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                      ${locked
                        ? 'text-white/25 hover:bg-white/[0.03]'
                        : isActive
                          ? 'bg-white/[0.10] text-white nav-active-indicator backdrop-blur-sm'
                          : 'text-white/50 hover:bg-white/[0.06] hover:text-white/90'
                      }
                    `}
                  >
                    <span className="flex items-center">
                      <Icon className={`${collapsed ? '' : 'mr-3'} h-[18px] w-[18px] flex-shrink-0 transition-colors ${locked ? 'text-white/15' : isActive ? 'text-blue-300' : 'text-white/35 group-hover:text-white/70'}`} />
                      {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                      {!collapsed && locked && <Lock className="ml-1.5 h-3 w-3 text-white/20" />}
                      {!collapsed && item.href === '/client/messages' && totalUnread > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none font-semibold">{totalUnread}</span>
                      )}
                      {!collapsed && item.href === '/client/tax-questionnaire' && questionnaireNew && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-blue-500 text-white leading-none animate-pulse">Nový</span>
                      )}
                      {!collapsed && item.href === '/client/crisis' && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-white/10 text-white/40 leading-none">Bonus</span>
                      )}
                    </span>
                    {!collapsed && isActive && !locked && <ChevronRight className="h-3.5 w-3.5 text-white/25" />}
                  </Link>
                )

                if (collapsed) {
                  return (
                    <React.Fragment key={item.name}>
                      {showDivider && <div className="border-t border-white/[0.06] my-2" />}
                      <Tooltip>
                        <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    </React.Fragment>
                  )
                }

                return <React.Fragment key={item.name}>{showDivider && <div className="border-t border-white/[0.06] my-2" />}{linkEl}</React.Fragment>
              })}
            </nav>
          </TooltipProvider>

          {/* Upgrade CTA for free users */}
          {planTier === 'free' && !collapsed && (
            <div className="relative px-3 pb-2">
              <Link
                href="/client/subscription"
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-200 border border-amber-400/20"
              >
                <Crown className="h-4 w-4 text-amber-300" />
                <span>Upgradovat</span>
              </Link>
            </div>
          )}

          {/* Module Switcher — bottom position */}
          <ClientModuleSwitcher userModules={userModules} collapsed={collapsed} />

          {/* Tools - Průvodce & Tmavý režim */}
          <div className="relative flex-shrink-0 border-t border-white/[0.06] px-3 py-3 space-y-0.5">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => startTour()}
                    className="w-full group flex items-center justify-center px-3 py-2 text-sm font-medium rounded-xl text-white/40 hover:bg-white/[0.05] hover:text-white/70 transition-all duration-200"
                  >
                    <BookOpen className="h-[18px] w-[18px] flex-shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">Průvodce</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => startTour()}
                className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-xl text-white/40 hover:bg-white/[0.05] hover:text-white/70 transition-all duration-200"
              >
                <BookOpen className="mr-3 h-[18px] w-[18px] flex-shrink-0" />
                Průvodce
              </button>
            )}
            <div className={`${collapsed ? 'flex justify-center' : ''}`}>
              <ThemeToggle
                variant={collapsed ? 'icon' : 'full'}
                className="text-white/40 hover:text-white/70 hover:bg-white/[0.05] rounded-xl"
              />
            </div>
          </div>

          {/* User section */}
          <div className="relative flex-shrink-0 border-t border-white/[0.06] p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center ${collapsed ? 'justify-center' : ''} w-full group hover:bg-white/[0.05] rounded-xl p-2 transition-all duration-200`}>
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="bg-white/10 text-white/80 text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="ml-3 text-left overflow-hidden">
                      <p className="text-sm font-medium text-white/90 truncate">{userName}</p>
                      <p className="text-[11px] text-white/40">Klient</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Nastavení</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/client/account" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Nastavení
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/subscription" className="cursor-pointer">
                    <Crown className="mr-2 h-4 w-4" />
                    Předplatné
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Odhlásit se
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between sidebar-blue px-4 py-3">
          <Link href={isClaims ? '/client/claims' : '/client/dashboard'} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white font-display">U</span>
            </div>
            <span className="text-sm font-semibold text-white/90 font-display">Účetní OS</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-white/90 hover:text-white">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-white/10 text-white font-bold text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/client/account" className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Nastavení
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Odhlásit se
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col min-h-screen overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'md:pl-[72px]' : 'md:pl-64'}`}>
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8 min-w-0 page-enter max-w-5xl mx-auto w-full">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>

        <TutorialOverlay />
      </div>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur-2xl border-t border-gray-200/60 dark:border-gray-800/60 z-50 safe-area-bottom">
        <nav className="flex justify-around px-1 pt-1 pb-1">
          {navigation.filter(n => isClaims
            ? ['Moje případy', 'Soubory', 'Zprávy', 'Nahlásit událost'].includes(n.name)
            : ['Přehled', 'Doklady & Faktury', 'Zprávy', 'Kniha jízd'].includes(n.name)
          ).map((item) => {
            const isActive = item.matchPaths
              ? item.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
              : (pathname === item.href || pathname.startsWith(item.href + '/'))
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  relative flex flex-col items-center py-2 px-3 min-w-0 flex-1 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'text-primary'
                    : 'text-gray-400 dark:text-gray-500 active:scale-95'
                  }
                `}
              >
                <div className={`${isActive ? 'bg-primary/10 dark:bg-primary/20 rounded-xl px-3 py-1' : 'px-3 py-1'} transition-all duration-200`}>
                  <Icon className={`h-5 w-5 ${isActive ? 'scale-105' : ''} transition-transform`} />
                </div>
                <span className={`text-[10px] mt-0.5 truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="client-theme">
      <ClientUserProvider>
        <ActiveModuleProvider>
          <TutorialProvider
            steps={CLIENT_TUTORIAL_STEPS}
            apiPath="/api/client/tutorial"
            storageKey="client-tutorial-dismissed"
          >
            <ClientLayoutInner>{children}</ClientLayoutInner>
          </TutorialProvider>
        </ActiveModuleProvider>
      </ClientUserProvider>
    </div>
  )
}
