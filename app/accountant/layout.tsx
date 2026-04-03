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
import { toast } from 'sonner'
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
import { ActiveModuleProvider } from '@/lib/contexts/active-module-context'
import { Building2, UserCog, X, Star, Plus } from 'lucide-react'
import { getSavedThemeId, getTheme } from '@/lib/sidebar-themes'
import type { SidebarThemeId, SidebarTheme } from '@/lib/sidebar-themes'
import { BugReportButton } from '@/components/shared/bug-report-button'
import { logBuffer } from '@/lib/client-log-buffer'

// === NAVIGATION GROUPS ===

// Group 1: Daily work — always visible (5 items)
const dailyWorkNav = [
  { name: 'Přehled', href: '/accountant/dashboard', icon: LayoutDashboard, tourId: 'nav-dashboard' },
  { name: 'Klienti', href: '/accountant/clients', icon: Users, badge: 'attention' as const, tourId: 'nav-clients' },
  { name: 'Komunikace', href: '/accountant/komunikace', icon: MessageCircle, badge: 'messages' as const, feature: 'messages', tourId: 'nav-komunikace' },
  { name: 'Doklady', href: '/accountant/extraction', icon: ScanLine, badge: 'inbox' as const, activeMatch: ['/accountant/extraction', '/accountant/inbox'], feature: 'extraction', tourId: 'nav-extraction' },
  { name: 'Práce', href: '/accountant/work', icon: Briefcase, badge: 'dynamic' as const, activeMatch: ['/accountant/work', '/accountant/tasks', '/accountant/projects'], tourId: 'nav-work' },
]

// Group 2: Management — collapsible (6 items)
const managementNav = [
  { name: 'Kalendář', href: '/accountant/calendar', icon: CalendarCheck, activeMatch: ['/accountant/calendar', '/accountant/deadlines', '/accountant/reminders'], tourId: 'nav-deadlines', label: 'Ve vývoji' },
  { name: 'Fakturace', href: '/accountant/invoicing', icon: Receipt, activeMatch: ['/accountant/invoicing', '/accountant/invoices', '/accountant/billing'], tourId: 'nav-invoicing', feature: 'client_invoicing' },
  { name: 'Analytika', href: '/accountant/analytics', icon: BarChart3, activeMatch: ['/accountant/analytics', '/accountant/revenue'], feature: 'analytics' },
  { name: 'Tržiště', href: '/accountant/marketplace-requests', icon: UserPlus, activeMatch: ['/accountant/marketplace-requests'], label: 'Demo' },
]

// Group 3: Tools — collapsible (2 items)
const toolsNav = [
  { name: 'Znalostní báze', href: '/accountant/knowledge-base', icon: BookOpen, activeMatch: ['/accountant/knowledge-base'], tourId: 'nav-knowledge-base' },
  { name: 'Podepisování', href: '/accountant/signing', icon: FileSignature, activeMatch: ['/accountant/signing'] },
]

// Group 4a: Firm admin — admin-only (Nastavení, Moje firma)
const firmAdminNav = [
  { name: 'Nastavení', href: '/accountant/settings', icon: Settings, tourId: 'nav-settings' },
  { name: 'Moje firma', href: '/accountant/firm', icon: Building2, activeMatch: ['/accountant/firm'] },
]

// Group 4b: System admin — system admin only (Administrace)
const systemAdminNav = [
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
  label?: string
}

// === TAB SYSTEM ===
const TAB_EXCLUDED_PREFIXES = ['/accountant/settings', '/accountant/admin', '/accountant/firm']

function getTabLabelFromPathname(pathname: string): string {
  const allNavItems = [...dailyWorkNav, ...managementNav, ...toolsNav, ...firmAdminNav, ...systemAdminNav]
  for (const item of allNavItems) {
    if (pathname === item.href) return item.name
    if (item.activeMatch?.some(p => pathname.startsWith(p))) return item.name
    if (pathname.startsWith(item.href + '/')) return item.name
  }
  const segments = pathname.split('/').filter(Boolean)
  const last = segments[segments.length - 1] || 'Stránka'
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
}

function isTabActiveForPath(tabUrl: string, pathname: string): boolean {
  if (pathname === tabUrl || pathname.startsWith(tabUrl + '/')) return true
  const allNavItems = [...dailyWorkNav, ...managementNav, ...toolsNav]
  const navItem = allNavItems.find(item => item.href === tabUrl)
  if (navItem?.activeMatch) {
    return navItem.activeMatch.some(p => pathname.startsWith(p))
  }
  return false
}

// Extracted NavContent to avoid hook issues with renderNavItem
function NavContent({
  dailyWorkNav,
  managementNav,
  toolsNav,
  firmAdminNav,
  systemAdminNav,
  pathname,
  collapsed,
  showAdmin,
  isSystemAdmin,
  managementOpen,
  toolsOpen,
  toggleManagement,
  toggleTools,
  isLocked,
  inboxCount,
  clientsAttentionCount,
  needsResponseCount,
  documentInboxCount,
  theme,
}: {
  dailyWorkNav: NavItem[]
  managementNav: NavItem[]
  toolsNav: NavItem[]
  firmAdminNav: NavItem[]
  systemAdminNav: NavItem[]
  pathname: string
  collapsed: boolean
  showAdmin: boolean
  isSystemAdmin: boolean
  managementOpen: boolean
  toolsOpen: boolean
  toggleManagement: () => void
  toggleTools: () => void
  isLocked: (feature: string) => boolean
  inboxCount: number
  clientsAttentionCount: number
  needsResponseCount: number
  documentInboxCount: number
  theme: SidebarTheme
}) {
  const renderNavItem = (item: NavItem, _index?: number, groupKey?: string) => {
    const isActive = item.activeMatch
      ? item.activeMatch.some(p => pathname.startsWith(p))
      : pathname === item.href || pathname.startsWith(item.href + '/')
    const Icon = item.icon
    const locked = item.feature ? isLocked(item.feature) : false
    const iconGroupColor = theme.iconGroups && groupKey ? theme.iconGroups[groupKey as keyof typeof theme.iconGroups] : undefined
    const linkEl = (
      <Link
        href={locked ? '/accountant/admin/subscription' : item.href}
        data-tour={item.tourId}
        className={`
          group flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
          ${locked
            ? `${theme.textMuted} hover:bg-white/[0.03] cursor-default`
            : isActive
              ? `${theme.activeBg} ${theme.textActive} ${theme.activeIndicator}`
              : `${theme.textDefault} ${theme.hoverBg} ${theme.hoverText}`
          }
        `}
      >
        <span className={`flex items-center ${collapsed ? 'relative' : ''}`}>
          <Icon className={`${collapsed ? '' : 'mr-3'} h-[18px] w-[18px] flex-shrink-0 transition-colors ${locked ? theme.textMuted : isActive ? theme.activeIcon : iconGroupColor || `${theme.textMuted} ${theme.hoverText.replace('hover:', 'group-hover:')}`}`} />
          {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
          {!collapsed && item.label && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{item.label}</span>
          )}
          {!collapsed && locked && <Lock className={`ml-1.5 h-3 w-3 ${theme.textMuted}`} />}
          {collapsed && item.badge === 'dynamic' && inboxCount > 0 && (
            <span className={`absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1 min-w-[16px] h-4 text-[10px] font-bold ${theme.badgeAccent} text-white rounded-full`}>{inboxCount}</span>
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
              <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold ${theme.badgeAccent} text-white rounded-full min-w-[1.25rem]`}>{inboxCount}</span>
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
            {isActive && <ChevronRight className={`h-3.5 w-3.5 ${theme.textMuted}`} />}
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
      {dailyWorkNav.map((item, i) => renderNavItem(item, i, 'daily'))}

      {/* Správa — collapsible */}
      <div className={`pt-3 mt-3 border-t ${theme.border}`}>
        {!collapsed ? (
          <button
            onClick={toggleManagement}
            className="w-full flex items-center justify-between px-3 mb-1.5 group"
          >
            <p className={`text-[10px] font-semibold ${theme.groupLabel} uppercase tracking-widest`}>
              Správa
            </p>
            <ChevronDown className={`h-3 w-3 ${theme.textMuted} transition-transform duration-200 ${managementOpen ? '' : '-rotate-90'}`} />
          </button>
        ) : (
          <div className={`w-full h-px ${theme.border.replace('border-', 'bg-')} mb-1`} />
        )}
        {(managementOpen || collapsed) && managementNav.map((item, i) => renderNavItem(item, i, 'management'))}
      </div>

      {/* Nástroje — collapsible (hidden when empty) */}
      {toolsNav.length > 0 && (
        <div className={`pt-3 mt-3 border-t ${theme.border}`}>
          {!collapsed ? (
            <button
              onClick={toggleTools}
              className="w-full flex items-center justify-between px-3 mb-1.5 group"
            >
              <p className={`text-[10px] font-semibold ${theme.groupLabel} uppercase tracking-widest`}>
                Nástroje
              </p>
              <ChevronDown className={`h-3 w-3 ${theme.textMuted} transition-transform duration-200 ${toolsOpen ? '' : '-rotate-90'}`} />
            </button>
          ) : (
            <div className={`w-full h-px ${theme.border.replace('border-', 'bg-')} mb-1`} />
          )}
          {(toolsOpen || collapsed) && toolsNav.map((item, i) => renderNavItem(item, i, 'tools'))}
        </div>
      )}

      {/* Admin — bottom, role-based visibility */}
      {showAdmin && (
        <div className={`pt-3 mt-3 border-t ${theme.border}`}>
          {!collapsed && (
            <p className={`px-3 text-[10px] font-semibold ${theme.groupLabel} uppercase tracking-widest mb-1.5`}>
              Admin
            </p>
          )}
          {firmAdminNav.map((item, i) => renderNavItem(item, i, 'admin'))}
          {isSystemAdmin && systemAdminNav.map((item, i) => renderNavItem(item, i, 'admin'))}
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
      <ActiveModuleProvider>
        <AccountantLayoutRouter>{children}</AccountantLayoutRouter>
      </ActiveModuleProvider>
    </AccountantUserProvider>
  )
}

function AccountantLayoutRouter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const isClaims = pathname.startsWith('/accountant/claims')

  // Claims has its own lightweight layout — skip heavy providers
  if (isClaims) return <>{children}</>

  return (
    <SettingsProvider>
      <AttentionProvider>
        <TutorialProvider>
          <TooltipProvider delayDuration={0}>
            <AccountantLayoutInner>{children}</AccountantLayoutInner>
          </TooltipProvider>
        </TutorialProvider>
      </AttentionProvider>
    </SettingsProvider>
  )
}

function AccountantLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { userName, userInitials, userRole, permissions, userModules, firmId, isSystemAdmin } = useAccountantUser()
  const { startTour } = useTutorialContext()
  const inboxCount = useInboxCount()
  const { totals: attentionTotals } = useAttention()
  const { needsResponseCount } = useUnreadMessages()
  const documentInboxCount = useDocumentInboxCount()
  const { isLocked } = usePlanFeatures()
  // Attention for Klienti badge: exclude unread_messages (shown on Komunikace instead)
  const clientsAttentionCount = attentionTotals.total - attentionTotals.unread_messages
  const [sidebarThemeId, setSidebarThemeId] = useState<SidebarThemeId>('classic')
  const sidebarTheme = getTheme(sidebarThemeId)

  useEffect(() => {
    setSidebarThemeId(getSavedThemeId())
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail
      if (id) setSidebarThemeId(id)
    }
    window.addEventListener('sidebar-theme-change', handler)
    return () => window.removeEventListener('sidebar-theme-change', handler)
  }, [])

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
  const [staffUsers, setStaffUsers] = useState<{ id: string; name: string }[]>([])
  const [impersonatedUser, setImpersonatedUser] = useState<{ id: string; name: string } | null>(null)

  // Bookmarks
  interface UserBookmark { id: string; label: string; url: string; icon: string | null; position: number }
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>([])

  const fetchBookmarks = () => {
    fetch('/api/accountant/bookmarks')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.bookmarks) setBookmarks(data.bookmarks) })
      .catch(() => {})
  }

  useEffect(() => { fetchBookmarks() }, [])

  // Context menu for bookmark tabs
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; url: string; label: string; bookmarkId?: string } | null>(null)

  // Close context menu on click/right-click outside
  useEffect(() => {
    if (!tabContextMenu) return
    const handler = () => setTabContextMenu(null)
    document.addEventListener('click', handler)
    document.addEventListener('contextmenu', handler)
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('contextmenu', handler)
    }
  }, [tabContextMenu])

  const isCurrentPageBookmarked = bookmarks.some(b => b.url === pathname)

  const handleAddBookmark = async () => {
    const label = getTabLabelFromPathname(pathname)

    try {
      const res = await fetch('/api/accountant/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, url: pathname }),
      })
      if (res.ok) {
        fetchBookmarks()
      } else {
        const data = await res.json().catch(() => ({}))
        console.error('Bookmark add failed:', res.status, data)
        toast.error(data.error || 'Nepodařilo se přidat záložku')
      }
    } catch (err) {
      console.error('Bookmark add error:', err)
      toast.error('Nepodařilo se přidat záložku')
    }
  }

  const handleRemoveBookmark = async (id: string) => {
    try {
      const res = await fetch('/api/accountant/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        fetchBookmarks()
      } else {
        toast.error('Nepodařilo se odebrat záložku')
      }
    } catch {
      toast.error('Nepodařilo se odebrat záložku')
    }
  }

  // Fetch staff users list + check if currently impersonating (admin only)
  useEffect(() => {
    if (userRole !== 'admin') return
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { if (data.users) setStaffUsers(data.users) })
      .catch(() => {})
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.impersonate_user) {
          // Find user name from staff list or fetch it
          fetch('/api/users')
            .then(r => r.json())
            .then(uData => {
              const found = (uData.users || []).find((u: { id: string }) => u.id === data.impersonate_user)
              if (found) setImpersonatedUser({ id: found.id, name: found.name })
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [userRole])

  const handleImpersonateUser = async (userId: string) => {
    const res = await fetch('/api/auth/impersonate-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (data.success) {
      setImpersonatedUser(data.user)
      window.location.reload()
    }
  }

  const handleStopImpersonation = async () => {
    await fetch('/api/auth/impersonate-user', { method: 'DELETE' })
    setImpersonatedUser(null)
    window.location.reload()
  }

  useEffect(() => {
    const saved = localStorage.getItem('accountant-sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
    logBuffer.init()
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

        <div className={`flex flex-col flex-grow ${sidebarTheme.sidebarClass} shadow-sidebar overflow-y-auto custom-scrollbar`}>
          {/* Subtle texture overlay (skip on minimal) */}
          {sidebarThemeId !== 'minimal' && (
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }}
            />
          )}

          {/* Logo */}
          <div className={`relative flex items-center h-16 flex-shrink-0 border-b ${sidebarTheme.border} transition-all duration-300 ${collapsed ? 'justify-center px-3' : 'px-5'}`}>
            <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-soft-sm flex-shrink-0 bg-gradient-to-br ${sidebarTheme.logoGradient}`}>
                <span className="text-sm font-bold font-display text-white">U</span>
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <h1 className={`text-base font-semibold ${sidebarTheme.textActive} font-display tracking-tight whitespace-nowrap`}>
                    Účetní OS
                  </h1>
                  <p className={`text-[10px] ${sidebarTheme.textMuted} font-medium whitespace-nowrap`}>
                    Portál pro účetní
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* App Switcher */}
          {userModules.length > 1 && (
            <div className={`relative px-3 py-2 border-b ${sidebarTheme.border}`}>
              <AppSwitcher userModules={userModules} collapsed={collapsed} />
            </div>
          )}

          {/* Navigation */}
          <TooltipProvider delayDuration={0}>
            <NavContent
              dailyWorkNav={dailyWorkNav}
              managementNav={showAdmin ? managementNav : managementNav.filter(item => !['Fakturace', 'Analytika', 'Tržiště'].includes(item.name))}
              toolsNav={showAdmin ? toolsNav : toolsNav.filter(item => item.name !== 'Podepisování')}
              firmAdminNav={firmAdminNav}
              systemAdminNav={systemAdminNav}
              pathname={pathname}
              collapsed={collapsed}
              showAdmin={showAdmin}
              isSystemAdmin={isSystemAdmin}
              managementOpen={managementOpen}
              toolsOpen={toolsOpen}
              toggleManagement={toggleManagement}
              toggleTools={toggleTools}
              isLocked={isLocked}
              inboxCount={inboxCount}
              clientsAttentionCount={clientsAttentionCount}
              needsResponseCount={needsResponseCount}
              documentInboxCount={documentInboxCount}
              theme={sidebarTheme}
            />
          </TooltipProvider>

          {/* Tools - Průvodce, Tmavý režim */}
          <div className={`relative flex-shrink-0 border-t ${sidebarTheme.border} px-3 py-3 space-y-0.5`}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => startTour()}
                    className={`w-full group flex items-center justify-center px-3 py-2 text-sm font-medium rounded-xl ${sidebarTheme.textMuted} ${sidebarTheme.hoverBg} transition-all duration-200`}
                  >
                    <BookOpen className="h-[18px] w-[18px] flex-shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">Průvodce</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => startTour()}
                className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-xl ${sidebarTheme.textMuted} ${sidebarTheme.hoverBg} transition-all duration-200`}
              >
                <BookOpen className="mr-3 h-[18px] w-[18px] flex-shrink-0" />
                Průvodce
              </button>
            )}
            <div className={`${collapsed ? 'flex justify-center' : ''}`}>
              <ThemeToggle
                variant={collapsed ? 'icon' : 'full'}
                className={`${sidebarTheme.textMuted} ${sidebarTheme.hoverBg} rounded-xl`}
              />
            </div>
          </div>

          {/* User impersonation — admin only */}
          {showAdmin && staffUsers.length > 0 && collapsed && (
            <div className={`relative flex-shrink-0 border-t ${sidebarTheme.border} px-3 py-2`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className={`w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                        impersonatedUser ? 'text-amber-400 bg-amber-400/10' : `${sidebarTheme.textMuted} ${sidebarTheme.hoverBg} ${sidebarTheme.hoverText}`
                      }`}>
                        <UserCog className="h-[18px] w-[18px] flex-shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {impersonatedUser ? `Jako: ${impersonatedUser.name}` : 'Přepnout pohled'}
                    </TooltipContent>
                  </Tooltip>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
                  <DropdownMenuLabel>Přepnout na účetního</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {impersonatedUser && (
                    <>
                      <DropdownMenuItem onClick={handleStopImpersonation} className="text-amber-600 focus:text-amber-600 cursor-pointer">
                        <X className="mr-2 h-4 w-4" />
                        Zpět na admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {staffUsers.map(u => (
                    <DropdownMenuItem
                      key={u.id}
                      onClick={() => handleImpersonateUser(u.id)}
                      className={`cursor-pointer ${impersonatedUser?.id === u.id ? 'bg-amber-50 dark:bg-amber-900/20 font-semibold' : ''}`}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {u.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {showAdmin && staffUsers.length > 0 && !collapsed && (
            <div className={`relative flex-shrink-0 border-t ${sidebarTheme.border} px-3 py-2`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl ${sidebarTheme.textMuted} ${sidebarTheme.hoverBg} ${sidebarTheme.hoverText} transition-all duration-200`}>
                    <UserCog className="h-[18px] w-[18px] flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {impersonatedUser ? `Jako: ${impersonatedUser.name}` : 'Přepnout pohled'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
                  <DropdownMenuLabel>Přepnout na účetního</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {impersonatedUser && (
                    <>
                      <DropdownMenuItem onClick={handleStopImpersonation} className="text-amber-600 focus:text-amber-600 cursor-pointer">
                        <X className="mr-2 h-4 w-4" />
                        Zpět na admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {staffUsers.map(u => (
                    <DropdownMenuItem
                      key={u.id}
                      onClick={() => handleImpersonateUser(u.id)}
                      className={`cursor-pointer ${impersonatedUser?.id === u.id ? 'bg-amber-50 dark:bg-amber-900/20 font-semibold' : ''}`}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {u.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* User section */}
          <div className={`relative flex-shrink-0 border-t ${sidebarTheme.border} p-3`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center ${collapsed ? 'justify-center' : ''} w-full group ${sidebarTheme.hoverBg} rounded-xl p-2 transition-all duration-200`}>
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className={`${sidebarThemeId === 'minimal' ? 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/80' : 'bg-white/10 text-white/80'} text-sm font-semibold`}>
                      {userInitials || '..'}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <>
                      <div className="ml-3 text-left overflow-hidden">
                        <p className={`text-sm font-medium ${sidebarTheme.textActive} truncate`}>{userName || 'Načítání...'}</p>
                        <p className={`text-[11px] ${sidebarTheme.textMuted}`}>{roleLabel}</p>
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-400 to-violet-500">
              <span className="text-xs font-bold text-white font-display">U</span>
            </div>
            <span className="text-sm font-semibold text-white/[0.90] font-display">Účetní OS</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" className="text-white/[0.50] hover:text-white hover:bg-white/10 rounded-lg" />
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
                {firmAdminNav.map((item) => {
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
                {isSystemAdmin && systemAdminNav.map((item) => {
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
        {/* Impersonation banner */}
        {impersonatedUser && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm z-[100] relative">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              <span>Pracujete jako: <strong>{impersonatedUser.name}</strong></span>
            </div>
            <button
              onClick={handleStopImpersonation}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-3 py-1 transition-colors"
            >
              <X className="h-4 w-4" />
              Zpět na admin
            </button>
          </div>
        )}

        {!pathname.startsWith('/accountant/admin') && !pathname.startsWith('/accountant/settings') && (
          <GlobalDeadlineAlert />
        )}

        {/* Bookmark tab bar: pinned bookmarks only (fixed width) */}
        {bookmarks.length > 0 && (
          <div className="border-b border-border/60 bg-muted/20 hidden md:block">
            <div className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8">
              <div className="flex items-center overflow-x-auto scrollbar-none">
                {bookmarks.map(bm => {
                  const isActive = isTabActiveForPath(bm.url, pathname)
                  return (
                    <div
                      key={bm.id}
                      className="relative w-[140px] flex-shrink-0"
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setTabContextMenu({ x: e.clientX, y: e.clientY, url: bm.url, label: bm.label, bookmarkId: bm.id })
                      }}
                    >
                      <Link
                        href={bm.url}
                        className={`flex items-center gap-1.5 w-full pl-3 pr-7 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 ${
                          isActive
                            ? 'bg-background text-foreground border-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent'
                        }`}
                      >
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                        <span className="truncate">{bm.label}</span>
                      </Link>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveBookmark(bm.id) }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                        title="Odebrat záložku"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
                {/* Pin current page */}
                <button
                  onClick={handleAddBookmark}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 border-b-2 border-transparent transition-all duration-150 flex-shrink-0"
                  title={isCurrentPageBookmarked ? 'Stránka již připnuta' : 'Připnout tuto stránku'}
                  disabled={isCurrentPageBookmarked}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab context menu */}
        {tabContextMenu && (
          <div
            className="fixed z-[200] bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[180px] animate-in fade-in-0 zoom-in-95 duration-100"
            style={{ left: tabContextMenu.x, top: tabContextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { if (tabContextMenu.bookmarkId) handleRemoveBookmark(tabContextMenu.bookmarkId); setTabContextMenu(null) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors"
            >
              <Star className="h-3.5 w-3.5" />
              Odebrat záložku
            </button>
          </div>
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

        <BugReportButton />

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
