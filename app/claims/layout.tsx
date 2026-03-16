'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  User,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/app/auth/login/actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AppSwitcher } from '@/components/app-switcher'

const claimsNavigation = [
  { name: 'Přehled', href: '/claims/dashboard', icon: LayoutDashboard },
  { name: 'Spisy', href: '/claims/cases', icon: FolderOpen, activeMatch: ['/claims/cases'] },
  { name: 'Pojišťovny', href: '/claims/insurers', icon: Building2, activeMatch: ['/claims/insurers'] },
  { name: 'Dokumenty', href: '/claims/documents', icon: FileText, activeMatch: ['/claims/documents'] },
  { name: 'Statistiky', href: '/claims/stats', icon: BarChart3, activeMatch: ['/claims/stats'] },
  { name: 'Nastavení', href: '/claims/settings', icon: Settings, activeMatch: ['/claims/settings'] },
]

export default function ClaimsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <ClaimsLayoutInner>{children}</ClaimsLayoutInner>
    </TooltipProvider>
  )
}

function ClaimsLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [userName, setUserName] = useState('')
  const [userInitials, setUserInitials] = useState('')
  const [userModules, setUserModules] = useState<string[]>(['accounting'])

  useEffect(() => {
    const saved = localStorage.getItem('claims-sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUserName(data.user?.name || '')
          const parts = (data.user?.name || '').split(' ')
          setUserInitials(parts.map((p: string) => p[0]).join('').toUpperCase().slice(0, 2))
          setUserModules(data.user?.modules || ['accounting'])
        }
      } catch { /* ignore */ }
    }
    fetchUser()
  }, [])

  const toggleSidebar = () => {
    setCollapsed(prev => {
      localStorage.setItem('claims-sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  const handleLogout = () => setShowLogoutDialog(true)
  const confirmLogout = async () => {
    setShowLogoutDialog(false)
    await logout()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:fixed md:inset-y-0 md:flex md:flex-col z-30 transition-all duration-300 ease-in-out ${collapsed ? 'md:w-[72px]' : 'md:w-64'}`}>
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
            <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-soft-sm flex-shrink-0">
                <Shield className="h-5 w-5 text-white" />
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-base font-semibold text-white/95 font-display tracking-tight whitespace-nowrap">Pojistné události</h1>
                  <p className="text-[10px] text-white/40 font-medium whitespace-nowrap">Claims Management</p>
                </div>
              )}
            </div>
          </div>

          {/* App Switcher */}
          {!collapsed && (
            <div className="relative px-3 py-2 border-b border-white/[0.06]">
              <AppSwitcher userModules={userModules} />
            </div>
          )}

          {/* Navigation */}
          <TooltipProvider delayDuration={0}>
            <nav className="relative flex-1 px-3 py-4 space-y-0.5">
              {claimsNavigation.map((item) => {
                const isActive = item.activeMatch
                  ? item.activeMatch.some(p => pathname.startsWith(p))
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                const linkEl = (
                  <Link
                    href={item.href}
                    className={`
                      group flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                      ${isActive
                        ? 'bg-white/[0.08] text-white nav-active-indicator'
                        : 'text-white/55 hover:bg-white/[0.05] hover:text-white/85'
                      }
                    `}
                  >
                    <span className="flex items-center">
                      <Icon className={`${collapsed ? '' : 'mr-3'} h-[18px] w-[18px] flex-shrink-0 transition-colors ${isActive ? 'text-blue-300' : 'text-white/40 group-hover:text-white/65'}`} />
                      {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                    </span>
                    {!collapsed && isActive && <ChevronRight className="h-3.5 w-3.5 text-white/30" />}
                  </Link>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return <React.Fragment key={item.name}>{linkEl}</React.Fragment>
              })}
            </nav>
          </TooltipProvider>

          {/* Theme toggle */}
          <div className="relative flex-shrink-0 border-t border-white/[0.06] px-3 py-3">
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
                    <div className="ml-3 text-left overflow-hidden">
                      <p className="text-sm font-medium text-white/90 truncate">{userName || 'Načítání...'}</p>
                      <p className="text-[11px] text-white/40">Claims</p>
                    </div>
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
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
          {claimsNavigation.slice(0, 5).map((item) => {
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
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 active:text-blue-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                {isActive && <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
              </Link>
            )
          })}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 ${
              mobileMenuOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
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
              {claimsNavigation.slice(5).map((item) => {
                const Icon = item.icon
                const isActive = item.activeMatch
                  ? item.activeMatch.some(p => pathname.startsWith(p))
                  : pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
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
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                      {userInitials || '..'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{userName || 'Načítání...'}</p>
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
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 pb-24 md:pb-6 page-enter max-w-screen-2xl mx-auto w-full">
          {children}
        </main>

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
