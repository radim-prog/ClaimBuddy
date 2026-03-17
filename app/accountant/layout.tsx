'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  LogOut,
  User,
  Receipt,
  Shield,
  CalendarCheck,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  MessageCircle,
  ScanLine,
  Send,
  Inbox,
  TrendingUp,
  CreditCard,
  FileSignature,
  ChevronDown,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GlobalDeadlineAlert } from '@/components/global-deadline-alert'
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
import { Button } from '@/components/ui/button'
import { logout } from '@/app/auth/login/actions'
import { SettingsProvider } from '@/lib/contexts/settings-context'
import { AccountantUserProvider, useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { AttentionProvider, useAttention } from '@/lib/contexts/attention-context'
import { QuickCaptureButton } from '@/components/quick-capture'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useInboxCount } from '@/components/gtd/use-inbox-count'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import { useDocumentInboxCount } from '@/hooks/use-document-inbox-count'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { WelcomeModal } from '@/components/accountant/welcome-modal'
import { TutorialOverlay } from '@/components/accountant/tutorial-overlay'
import { TutorialProvider, useTutorialContext } from '@/lib/contexts/tutorial-context'
import { BookOpen, Lock, UserPlus } from 'lucide-react'
import { AppSwitcher } from '@/components/app-switcher'
import { usePlanFeatures } from '@/lib/hooks/use-plan-features'
import { ActiveModuleProvider, useActiveModule } from '@/lib/contexts/active-module-context'
import { Building2, FolderOpen, ClipboardList } from 'lucide-react'

// === NAVIGATION GROUPS ===

// Group 1: Daily work — always visible (6 items)
const dailyWorkNav = [
  { name: 'Přehled', href: '/accountant/dashboard', icon: LayoutDashboard, tourId: 'nav-dashboard' },
  { name: 'Klienti', href: '/accountant/clients', icon: Users, badge: 'attention' as const, tourId: 'nav-clients' },
  { name: 'Komunikace', href: '/accountant/komunikace', icon: MessageCircle, badge: 'messages' as const, feature: 'messages', tourId: 'nav-komunikace' },
  { name: 'Inbox podkladů', href: '/accountant/inbox', icon: Inbox, badge: 'inbox' as const, activeMatch: ['/accountant/inbox'], tourId: 'nav-inbox' },
  { name: 'Práce', href: '/accountant/work', icon: Briefcase, badge: 'dynamic' as const, activeMatch: ['/accountant/work', '/accountant/tasks', '/accountant/projects'], tourId: 'nav-work' },
  { name: 'Vytěžování', href: '/accountant/extraction', icon: ScanLine, activeMatch: ['/accountant/extraction'], feature: 'extraction', tourId: 'nav-extraction' },
]

// Group 2: Management — collapsible (7 items)
const managementNav = [
  { name: 'Termíny', href: '/accountant/deadlines', icon: CalendarCheck, tourId: 'nav-deadlines' },
  { name: 'Připomínky', href: '/accountant/reminders', icon: Send, activeMatch: ['/accountant/reminders'], tourId: 'nav-reminders' },
  { name: 'Tržiště', href: '/accountant/marketplace-requests', icon: UserPlus, activeMatch: ['/accountant/marketplace-requests'] },
  { name: 'Příjmy', href: '/accountant/revenue', icon: TrendingUp, activeMatch: ['/accountant/revenue'] },
  { name: 'Analytika', href: '/accountant/analytics', icon: BarChart3, activeMatch: ['/accountant/analytics'], feature: 'analytics' },
  { name: 'Fakturace', href: '/accountant/invoicing', icon: Receipt, activeMatch: ['/accountant/invoicing', '/accountant/invoices'], tourId: 'nav-invoicing', feature: 'client_invoicing' },
  { name: 'Účtování', href: '/accountant/billing', icon: CreditCard, activeMatch: ['/accountant/billing'] },
]

// Group 3: Tools — collapsible (2 items)
const toolsNav = [
  { name: 'Znalostní báze', href: '/accountant/knowledge-base', icon: BookOpen, activeMatch: ['/accountant/knowledge-base'], tourId: 'nav-knowledge-base' },
  { name: 'Podepisování', href: '/accountant/signing', icon: FileSignature, activeMatch: ['/accountant/signing'] },
]

// Group 4: Admin — bottom section, admin-only (2 items)
const adminNav = [
  { name: 'Nastavení', href: '/accountant/settings', icon: Settings, tourId: 'nav-settings' },
  { name: 'Administrace', href: '/accountant/admin', icon: Shield },
]

// Nav item type
type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: 'attention' | 'messages' | 'inbox' | 'dynamic'
  feature?: string
  activeMatch?: string[]
  tourId?: string
}

// === CLAIMS MODULE NAVIGATION ===

// Claims: Daily work
const claimsDailyNav: NavItem[] = [
  { name: 'Přehled PU', href: '/accountant/claims/dashboard', icon: LayoutDashboard },
  { name: 'Klienti', href: '/accountant/clients', icon: Users },
  { name: 'Spisy', href: '/accountant/claims/cases', icon: FolderOpen },
  { name: 'Pojišťovny', href: '/accountant/claims/insurers', icon: Building2 },
  { name: 'Komunikace', href: '/accountant/komunikace', icon: MessageCircle, badge: 'messages' as const },
]

// Claims: Management
const claimsManagementNav: NavItem[] = [
  { name: 'Úkoly', href: '/accountant/gtd', icon: ClipboardList },
  { name: 'Termíny', href: '/accountant/deadlines', icon: CalendarCheck },
  { name: 'Statistiky PU', href: '/accountant/claims/stats', icon: BarChart3 },
  { name: 'Připomínky', href: '/accountant/reminders', icon: Send, activeMatch: ['/accountant/reminders'] },
  { name: 'Nastavení PU', href: '/accountant/claims/settings', icon: Settings },
]

// Extracted NavContent to avoid hook issues with renderNavItem
function NavContent({
  dailyWorkNav,
  managementNav,
  toolsNav,
  adminNav,
  pathname,
  collapsed,
  showAdmin,
  managementOpen,
  toolsOpen,
  toggleManagement,
  toggleTools,
  isLocked,
  inboxCount,
  clientsAttentionCount,
  needsResponseCount,
  documentInboxCount,
}: {
  dailyWorkNav: NavItem[]
  managementNav: NavItem[]
  toolsNav: NavItem[]
  adminNav: NavItem[]
  pathname: string
  collapsed: boolean
  showAdmin: boolean
  managementOpen: boolean
  toolsOpen: boolean
  toggleManagement: () => void
  toggleTools: () => void
  isLocked: (feature: string) => boolean
  inboxCount: number
  clientsAttentionCount: number
  needsResponseCount: number
  documentInboxCount: number
}) {
  const renderNavItem = (item: NavItem) => {
    const isActive = item.activeMatch
      ? item.activeMatch.some(p => pathname.startsWith(p))
      : pathname === item.href || pathname.startsWith(item.href + '/')
    const Icon = item.icon
    const locked = item.feature ? isLocked(item.feature) : false
    const linkEl = (
      <Link
        href={locked ? '/accountant/admin/subscription' : item.href}
        data-tour={item.tourId}
        className={`
          group flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
          ${locked
            ? 'text-white/30 hover:bg-white/[0.03] cursor-default'
            : isActive
              ? 'bg-white/[0.08] text-white nav-active-indicator'
              : 'text-white/55 hover:bg-white/[0.05] hover:text-white/85'
          }
        `}
      >
        <span className={`flex items-center ${collapsed ? 'relative' : ''}`}>
          <Icon className={`${collapsed ? '' : 'mr-3'} h-[18px] w-[18px] flex-shrink-0 transition-colors ${locked ? 'text-white/20' : isActive ? 'text-violet-300' : 'text-white/40 group-hover:text-white/65'}`} />
          {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
          {!collapsed && locked && <Lock className="ml-1.5 h-3 w-3 text-white/25" />}
          {collapsed && item.badge === 'dynamic' && inboxCount > 0 && (
            <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1 min-w-[16px] h-4 text-[10px] font-bold bg-violet-400 text-white rounded-full">{inboxCount}</span>
          )}
          {collapsed && item.badge === 'attention' && clientsAttentionCount > 0 && (
            <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1 min-w-[16px] h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">{clientsAttentionCount}</span>
          )}
          {collapsed && item.badge === 'messages' && needsResponseCount > 0 && (
            <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1 min-w-[16px] h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">{needsResponseCount}</span>
          )}
          {collapsed && item.badge === 'inbox' && documentInboxCount > 0 && (
            <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1 min-w-[16px] h-4 text-[10px] font-bold bg-amber-400 text-gray-900 rounded-full">{documentInboxCount}</span>
          )}
        </span>
        {!collapsed && (
          <span className="flex items-center gap-1.5">
            {item.badge === 'dynamic' && inboxCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-violet-400 text-white rounded-full min-w-[1.25rem]">{inboxCount}</span>
            )}
            {item.badge === 'attention' && clientsAttentionCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[1.25rem]">{clientsAttentionCount}</span>
            )}
            {item.badge === 'messages' && needsResponseCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[1.25rem]">{needsResponseCount}</span>
            )}
            {item.badge === 'inbox' && documentInboxCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-gray-900 rounded-full min-w-[1.25rem]">{documentInboxCount}</span>
            )}
            {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/30" />}
          </span>
        )}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip key={item.name}>
          <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.name}
            {item.badge === 'dynamic' && inboxCount > 0 && ` (${inboxCount})`}
            {item.badge === 'attention' && clientsAttentionCount > 0 && ` (${clientsAttentionCount})`}
            {item.badge === 'messages' && needsResponseCount > 0 && ` (${needsResponseCount})`}
            {item.badge === 'inbox' && documentInboxCount > 0 && ` (${documentInboxCount})`}
          </TooltipContent>
        </Tooltip>
      )
    }

    return <React.Fragment key={item.name}>{linkEl}</React.Fragment>
  }

  return (
    <nav className="relative flex-1 px-3 py-4 space-y-0.5">
      {/* Daily Work — always visible */}
      {dailyWorkNav.map(renderNavItem)}

      {/* Správa — collapsible */}
      <div className="pt-3 mt-3 border-t border-white/[0.06]">
        {!collapsed ? (
          <button
            onClick={toggleManagement}
            className="w-full flex items-center justify-between px-3 mb-1.5 group"
          >
            <p className="text-[10px] font-semibold text-violet-300/60 uppercase tracking-widest">
              Správa
            </p>
            <ChevronDown className={`h-3 w-3 text-white/30 transition-transform duration-200 ${managementOpen ? '' : '-rotate-90'}`} />
          </button>
        ) : (
          <div className="w-full h-px bg-white/[0.06] mb-1" />
        )}
        {(managementOpen || collapsed) && managementNav.map(renderNavItem)}
      </div>

      {/* Nástroje — collapsible (hidden when empty) */}
      {toolsNav.length > 0 && (
        <div className="pt-3 mt-3 border-t border-white/[0.06]">
          {!collapsed ? (
            <button
              onClick={toggleTools}
              className="w-full flex items-center justify-between px-3 mb-1.5 group"
            >
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                Nástroje
              </p>
              <ChevronDown className={`h-3 w-3 text-white/30 transition-transform duration-200 ${toolsOpen ? '' : '-rotate-90'}`} />
            </button>
          ) : (
            <div className="w-full h-px bg-white/[0.06] mb-1" />
          )}
          {(toolsOpen || collapsed) && toolsNav.map(renderNavItem)}
        </div>
      )}

      {/* Admin — bottom, admin-only */}
      {showAdmin && (
        <div className="pt-3 mt-3 border-t border-white/[0.06]">
          {!collapsed && (
            <p className="px-3 text-[10px] font-semibold text-violet-300/60 uppercase tracking-widest mb-1.5">
              Admin
            </p>
          )}
          {adminNav.map(renderNavItem)}
        </div>
      )}
    </nav>
  )
}

export default function AccountantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AccountantUserProvider>
      <SettingsProvider>
        <AttentionProvider>
          <TutorialProvider>
            <ActiveModuleProvider>
              <TooltipProvider delayDuration={0}>
                <AccountantLayoutInner>{children}</AccountantLayoutInner>
              </TooltipProvider>
            </ActiveModuleProvider>
          </TutorialProvider>
        </AttentionProvider>
      </SettingsProvider>
    </AccountantUserProvider>
  )
}

function AccountantLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { userName, userInitials, userRole, permissions, userModules } = useAccountantUser()
  const { startTour } = useTutorialContext()
  const inboxCount = useInboxCount()
  const { totals: attentionTotals } = useAttention()
  const { needsResponseCount } = useUnreadMessages()
  const documentInboxCount = useDocumentInboxCount()
  const { isLocked } = usePlanFeatures()
  const { activeModule } = useActiveModule()
  const isClaims = activeModule === 'claims'
  // Attention for Klienti badge: exclude unread_messages (shown on Komunikace instead)
  const clientsAttentionCount = attentionTotals.total - attentionTotals.unread_messages
  const [collapsed, setCollapsed] = useState(false)
  const [managementOpen, setManagementOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-management-open') !== 'false'
    }
    return true
  })
  const [toolsOpen, setToolsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-tools-open') !== 'false'
    }
    return false
  })
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('accountant-sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    const handler = () => {
      setCollapsed(localStorage.getItem('accountant-sidebar-collapsed') === 'true')
    }
    window.addEventListener('sidebar-toggle', handler)
    return () => window.removeEventListener('sidebar-toggle', handler)
  }, [])

  const toggleSidebar = () => {
    setCollapsed(prev => {
      localStorage.setItem('accountant-sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  const toggleManagement = () => {
    setManagementOpen(prev => {
      localStorage.setItem('sidebar-management-open', String(!prev))
      return !prev
    })
  }
  const toggleTools = () => {
    setToolsOpen(prev => {
      localStorage.setItem('sidebar-tools-open', String(!prev))
      return !prev
    })
  }

  const showAdmin = userRole === 'admin' || permissions?.admin_access === true

  const handleLogout = () => {
    setShowLogoutDialog(true)
  }

  const confirmLogout = async () => {
    setShowLogoutDialog(false)
    await logout()
  }

  const roleLabel = userRole === 'admin' ? 'Admin' : userRole === 'accountant' ? 'Účetní' : userRole === 'assistant' ? 'Asistentka' : 'Klient'

  return (
    <div className="min-h-screen bg-background">
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

        <div className="flex flex-col flex-grow sidebar-purple shadow-sidebar overflow-y-auto custom-scrollbar">
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }}
          />

          {/* Logo */}
          <div className={`relative flex items-center h-16 flex-shrink-0 border-b border-white/[0.06] transition-all duration-300 ${collapsed ? 'justify-center px-3' : 'px-5'}`}>
            <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-soft-sm flex-shrink-0 ${isClaims ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-violet-400 to-violet-500'}`}>
                {isClaims ? (
                  <Shield className="h-4 w-4 text-white" />
                ) : (
                  <span className="text-sm font-bold text-white font-display">U</span>
                )}
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-base font-semibold text-white/95 font-display tracking-tight whitespace-nowrap">
                    {isClaims ? 'PU Manager' : 'Účetní OS'}
                  </h1>
                  <p className="text-[10px] text-white/40 font-medium whitespace-nowrap">
                    {isClaims ? 'Pojistné události' : 'Portál pro účetní'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* App Switcher */}
          {!collapsed && userModules.length > 1 && (
            <div className="relative px-3 py-2 border-b border-white/[0.06]">
              <AppSwitcher userModules={userModules} />
            </div>
          )}

          {/* Navigation */}
          <TooltipProvider delayDuration={0}>
            <NavContent
              dailyWorkNav={isClaims ? claimsDailyNav : dailyWorkNav}
              managementNav={isClaims ? claimsManagementNav : (userRole === 'admin' ? managementNav : managementNav.filter(item => item.href !== '/accountant/revenue'))}
              toolsNav={isClaims ? [] : toolsNav}
              adminNav={adminNav}
              pathname={pathname}
              collapsed={collapsed}
              showAdmin={showAdmin}
              managementOpen={managementOpen}
              toolsOpen={toolsOpen}
              toggleManagement={toggleManagement}
              toggleTools={toggleTools}
              isLocked={isLocked}
              inboxCount={inboxCount}
              clientsAttentionCount={clientsAttentionCount}
              needsResponseCount={needsResponseCount}
              documentInboxCount={documentInboxCount}
            />
          </TooltipProvider>

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
                      {userInitials || '..'}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <>
                      <div className="ml-3 text-left overflow-hidden">
                        <p className="text-sm font-medium text-white/90 truncate">{userName || 'Načítání...'}</p>
                        <p className="text-[11px] text-white/40">{roleLabel}</p>
                      </div>
                      {userRole === 'admin' && (
                        <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold bg-violet-400/20 text-violet-300 rounded-md border border-violet-400/20">
                          ADMIN
                        </span>
                      )}
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Můj účet</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/accountant/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/accountant/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
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
      </aside>

      {/* Mobile header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between sidebar-purple px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isClaims ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-violet-400 to-violet-500'}`}>
              {isClaims ? (
                <Shield className="h-3.5 w-3.5 text-white" />
              ) : (
                <span className="text-xs font-bold text-white font-display">U</span>
              )}
            </div>
            <span className="text-sm font-semibold text-white/90 font-display">{isClaims ? 'PU Manager' : 'Účetní OS'}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" className="text-white/50 hover:text-white hover:bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
        <nav className="flex items-center justify-around px-1 py-1">
          {dailyWorkNav.slice(0, 5).map((item) => {
            const isActive = item.activeMatch
              ? item.activeMatch.some(p => pathname.startsWith(p))
              : pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-400 dark:text-gray-500 active:text-purple-500'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge === 'dynamic' && inboxCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1 min-w-[16px] h-4 text-[10px] font-bold bg-amber-400 text-gray-900 rounded-full">
                      {inboxCount}
                    </span>
                  )}
                  {item.badge === 'attention' && clientsAttentionCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1 min-w-[16px] h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                      {clientsAttentionCount}
                    </span>
                  )}
                  {item.badge === 'messages' && needsResponseCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1 min-w-[16px] h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                      {needsResponseCount}
                    </span>
                  )}
                  {item.badge === 'inbox' && documentInboxCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1 min-w-[16px] h-4 text-[10px] font-bold bg-amber-400 text-gray-900 rounded-full">
                      {documentInboxCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                {isActive && <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-purple-600 dark:bg-purple-400" />}
              </Link>
            )
          })}
          {/* Více button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 ${
              mobileMenuOpen
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-400 dark:text-gray-500 active:text-purple-500'
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className={`text-[10px] mt-0.5 ${mobileMenuOpen ? 'font-semibold' : 'font-medium'}`}>Více</span>
          </button>
        </nav>
      </div>

      {/* Mobile "Více" sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute bottom-[68px] left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-2" />
            <div className="px-4 pb-4 space-y-1 max-h-[60vh] overflow-y-auto">
              {/* Správa section */}
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Správa</p>
              {(userRole === 'admin' ? managementNav : managementNav.filter(i => i.href !== '/accountant/revenue')).map((item) => {
                const Icon = item.icon
                const isActive = item.activeMatch
                  ? item.activeMatch.some(p => pathname.startsWith(p))
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                )
              })}

              {/* Nástroje section */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nástroje</p>
              {toolsNav.map((item) => {
                const Icon = item.icon
                const isActive = item.activeMatch
                  ? item.activeMatch.some(p => pathname.startsWith(p))
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                )
              })}

              {/* Admin section */}
              {showAdmin && (
                <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Admin</p>
                {adminNav.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  )
                })}
                </>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

              <Link
                href="/accountant/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800 transition-all duration-200"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">Profil</span>
              </Link>

              <button
                onClick={() => { setMobileMenuOpen(false); startTour(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800 transition-all duration-200"
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-sm font-medium">Průvodce</span>
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-purple-600 text-white text-xs font-bold">
                      {userInitials || '..'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{userName || 'Načítání...'}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{roleLabel}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Odhlásit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${collapsed ? 'md:pl-[72px]' : 'md:pl-64'}`}>
        {!pathname.startsWith('/accountant/admin') && !pathname.startsWith('/accountant/settings') && (
          <GlobalDeadlineAlert />
        )}

        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 pb-24 md:pb-6 page-enter max-w-screen-2xl mx-auto w-full">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        <QuickCaptureButton />
        <KeyboardShortcuts />
        <WelcomeModal />

        <TutorialOverlay />

        <ConfirmDialog
          open={showLogoutDialog}
          onOpenChange={setShowLogoutDialog}
          title="Odhlášení"
          description="Opravdu se chcete odhlásit?"
          confirmLabel="Odhlásit se"
          cancelLabel="Zrušit"
          onConfirm={confirmLogout}
        />
      </div>
    </div>
  )
}
