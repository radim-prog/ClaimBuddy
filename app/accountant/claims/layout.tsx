'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { logout } from '@/app/auth/login/actions'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { useActiveModule } from '@/lib/contexts/active-module-context'
import { AppSwitcher } from '@/components/app-switcher'
import { ErrorBoundary } from '@/components/error-boundary'

// Claims navigation
const claimsNav = [
  { name: 'Přehled', href: '/accountant/claims/dashboard', icon: LayoutDashboard },
  { name: 'Spisy', href: '/accountant/claims/cases', icon: FolderOpen },
  { name: 'Pojišťovny', href: '/accountant/claims/insurers', icon: Building2 },
  { name: 'Statistiky', href: '/accountant/claims/stats', icon: BarChart3 },
  { name: 'Nastavení', href: '/accountant/claims/settings', icon: Settings },
]

// Clean URLs for claims.zajcon.cz hostname
const CLAIMS_CLEAN_URLS: Record<string, string> = {
  '/accountant/claims/dashboard': '/dashboard',
  '/accountant/claims/cases': '/cases',
  '/accountant/claims/insurers': '/insurers',
  '/accountant/claims/stats': '/stats',
  '/accountant/claims/settings': '/settings',
}

export default function ClaimsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ClaimsLayoutInner>{children}</ClaimsLayoutInner>
    </ErrorBoundary>
  )
}

function ClaimsLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const { userName, userInitials, userRole, userModules } = useAccountantUser()
  const { activeModule } = useActiveModule()
  const isClaimsHostname = typeof window !== 'undefined' && window.location.hostname === 'claims.zajcon.cz'
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  // Apply clean URLs for claims hostname
  const navItems = isClaimsHostname
    ? claimsNav.map(item => ({ ...item, href: CLAIMS_CLEAN_URLS[item.href] || item.href }))
    : claimsNav

  // Claims branding: favicon + title
  useEffect(() => {
    document.title = document.title.replace('Účetní OS', 'Pojistná Pomoc')
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (favicon) favicon.href = '/favicon-claims.svg'
  }, [pathname])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Odhlášeno')
    } catch {
      toast.error('Chyba při odhlašování')
    }
  }

  const isActive = (item: typeof claimsNav[0]) => {
    const href = isClaimsHostname ? (CLAIMS_CLEAN_URLS[item.href] || item.href) : item.href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}>
        <div className="flex flex-col h-full bg-gradient-to-b from-blue-900 via-blue-800 to-blue-950 text-white shadow-xl">
          {/* Logo */}
          <div className="relative flex-shrink-0 px-3 py-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
                <Shield className="h-4 w-4 text-white" />
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-base font-semibold text-white font-display tracking-tight whitespace-nowrap">
                    Správa pojistných událostí
                  </h1>
                  <p className="text-[10px] text-blue-300/70 font-medium whitespace-nowrap">
                    Pojistné události
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* App Switcher */}
          {userModules.length > 1 && (
            <div className="relative px-3 py-2 border-b border-blue-700/50">
              <AppSwitcher userModules={userModules} collapsed={collapsed} />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item)
              const link = (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-blue-500/20 text-white shadow-sm'
                      : 'text-blue-200/70 hover:bg-blue-700/30 hover:text-white'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-blue-300' : ''}`} />
                  {!collapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">{item.name}</TooltipContent>
                  </Tooltip>
                )
              }
              return link
            })}
          </nav>

          {/* Bottom tools */}
          <div className="flex-shrink-0 border-t border-blue-700/50 px-3 py-3 space-y-0.5">
            <div className={collapsed ? 'flex justify-center' : ''}>
              <ThemeToggle
                variant={collapsed ? 'icon' : 'full'}
                className="text-blue-200/70 hover:bg-blue-700/30 rounded-xl"
              />
            </div>
          </div>

          {/* User section */}
          <div className="flex-shrink-0 border-t border-blue-700/50 px-3 py-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-2 py-2 rounded-xl hover:bg-blue-700/30 transition-all duration-200`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-500/30 text-blue-200 text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">{userName}</p>
                      <p className="text-[10px] text-blue-300/70 capitalize">{userRole}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={collapsed ? 'center' : 'end'} side={collapsed ? 'right' : 'top'} className="w-56">
                <DropdownMenuLabel>{userName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Odhlásit se
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full bg-blue-800 border border-blue-600 shadow-md flex items-center justify-center hover:bg-blue-700 transition-all z-50"
          >
            {collapsed ? <ChevronRight className="h-3 w-3 text-blue-300" /> : <ChevronLeft className="h-3 w-3 text-blue-300" />}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-500">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/90 font-display">Pojistné události</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" className="text-white/50 hover:text-white hover:bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
        <nav className="flex items-center justify-around px-1 py-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 relative ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 active:text-blue-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className={`text-[10px] mt-0.5 ${active ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                {active && <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
              </Link>
            )
          })}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 ${
              mobileMenuOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 active:text-blue-500'
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
            <div className="px-4 pb-4 space-y-1">
              {navItems.slice(4).map((item) => {
                const Icon = item.icon
                const active = isActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                )
              })}
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 active:bg-red-50 dark:active:bg-red-900/30 w-full"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Odhlásit se</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={`transition-all duration-300 ease-in-out ${collapsed ? 'md:ml-[72px]' : 'md:ml-[240px]'} pb-20 md:pb-0`}>
        {children}
      </main>
    </div>
  )
}
