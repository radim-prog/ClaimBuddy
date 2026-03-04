'use client'

import { useState } from 'react'
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
  Sparkles,
  Shield,
  CalendarCheck,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GlobalDeadlineAlert } from '@/components/global-deadline-alert'
import { ThemeToggle } from '@/components/theme-toggle'
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
import { QuickAddButton } from '@/components/gtd/quick-add-button'
import { useInboxCount } from '@/components/gtd/use-inbox-count'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { WelcomeModal } from '@/components/accountant/welcome-modal'
import { TutorialOverlay } from '@/components/accountant/tutorial-overlay'
import { TutorialProvider, useTutorialContext } from '@/lib/contexts/tutorial-context'
import { BookOpen } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

const navigation = [
  { name: 'Přehled', href: '/accountant/dashboard', icon: LayoutDashboard, tourId: 'nav-dashboard' },
  { name: 'Klienti', href: '/accountant/clients', icon: Users, badge: 'attention' as const, tourId: 'nav-clients' },
  { name: 'Práce', href: '/accountant/tasks', icon: Briefcase, badge: 'dynamic' as const, activeMatch: ['/accountant/tasks', '/accountant/projects'] },
  { name: 'Termíny', href: '/accountant/deadlines', icon: CalendarCheck },
  { name: 'Fakturace', href: '/accountant/invoicing', icon: Receipt, activeMatch: ['/accountant/invoicing', '/accountant/invoices'], tourId: 'nav-invoicing' },
  { name: 'Nastavení', href: '/accountant/settings', icon: Settings, tourId: 'nav-settings' },
]

const adminNavigation = [
  { name: 'Administrace', href: '/accountant/admin', icon: Shield },
]

const demoFeatures: { name: string; href: string; icon: typeof Sparkles; badge: string }[] = []

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
            <AccountantLayoutInner>{children}</AccountantLayoutInner>
          </TutorialProvider>
        </AttentionProvider>
      </SettingsProvider>
    </AccountantUserProvider>
  )
}

function AccountantLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { userName, userInitials, userRole, permissions } = useAccountantUser()
  const { startTour } = useTutorialContext()
  const inboxCount = useInboxCount()
  const { totals: attentionTotals } = useAttention()

  const showAdmin = userRole === 'admin' || permissions?.admin_access === true

  const handleLogout = async () => {
    if (!confirm('Opravdu se chcete odhlásit?')) return
    await logout()
  }

  const roleLabel = userRole === 'admin' ? 'Admin' : userRole === 'accountant' ? 'Účetní' : userRole === 'assistant' ? 'Asistentka' : 'Klient'

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-30">
        <div className="flex flex-col flex-grow sidebar-gradient shadow-sidebar overflow-y-auto custom-scrollbar">
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }}
          />

          {/* Logo */}
          <div className="relative flex items-center h-16 flex-shrink-0 px-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-soft-sm">
                <span className="text-sm font-bold text-white font-display">U</span>
              </div>
              <div>
                <h1 className="text-base font-semibold text-white/95 font-display tracking-tight">Účetní OS</h1>
                <p className="text-[10px] text-white/40 font-medium">Portál pro účetní</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="relative flex-1 px-3 py-4 space-y-0.5">
            {navigation.map((item) => {
              const isActive = item.activeMatch
                ? item.activeMatch.some(p => pathname.startsWith(p))
                : pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  data-tour={item.tourId}
                  className={`
                    group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-white/[0.08] text-white nav-active-indicator'
                      : 'text-white/55 hover:bg-white/[0.05] hover:text-white/85'
                    }
                  `}
                >
                  <span className="flex items-center">
                    <Icon className={`mr-3 h-[18px] w-[18px] flex-shrink-0 transition-colors ${isActive ? 'text-amber-400' : 'text-white/40 group-hover:text-white/65'}`} />
                    {item.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {item.badge === 'dynamic' && inboxCount > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-gray-900 rounded-full min-w-[1.25rem]">
                        {inboxCount}
                      </span>
                    )}
                    {item.badge === 'attention' && attentionTotals.total > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[1.25rem]">
                        {attentionTotals.total}
                      </span>
                    )}
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/30" />}
                  </span>
                </Link>
              )
            })}

            {/* ADMIN SECTION */}
            {showAdmin && (
              <div className="pt-3 mt-3 border-t border-white/[0.06]">
                <p className="px-3 text-[10px] font-semibold text-amber-400/60 uppercase tracking-widest mb-1.5">
                  Administrace
                </p>
                {adminNavigation.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                        ${isActive
                          ? 'bg-white/[0.08] text-white nav-active-indicator'
                          : 'text-white/55 hover:bg-white/[0.05] hover:text-white/85'
                        }
                      `}
                    >
                      <span className="flex items-center">
                        <Icon className={`mr-3 h-[18px] w-[18px] flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-white/40'}`} />
                        {item.name}
                      </span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/30" />}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* DEMO FEATURES SECTION */}
            {demoFeatures.length > 0 && (
              <div className="pt-3 mt-3 border-t border-white/[0.06]">
                <p className="px-3 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                  Nové Funkce
                </p>
                {demoFeatures.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                        ${isActive
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/55 hover:bg-white/[0.05] hover:text-white/85'
                        }
                      `}
                    >
                      <span className="flex items-center">
                        <Icon className={`mr-3 h-[18px] w-[18px] flex-shrink-0`} />
                        {item.name}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-gray-900 rounded-full">
                        {item.badge}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Tools */}
            <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-0.5">
              <button
                onClick={() => startTour()}
                className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-xl text-white/40 hover:bg-white/[0.05] hover:text-white/70 transition-all duration-200"
              >
                <BookOpen className="mr-3 h-[18px] w-[18px] flex-shrink-0" />
                Průvodce
              </button>
              <ThemeToggle variant="full" className="text-white/40 hover:text-white/70 hover:bg-white/[0.05] rounded-xl" />
            </div>
          </nav>

          {/* User section */}
          <div className="relative flex-shrink-0 flex border-t border-white/[0.06] p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center w-full group hover:bg-white/[0.05] rounded-xl p-2 transition-all duration-200">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-white/10 text-white/80 text-sm font-semibold">
                      {userInitials || '..'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-white/90">{userName || 'Načítání...'}</p>
                    <p className="text-[11px] text-white/40">{roleLabel}</p>
                  </div>
                  {userRole === 'admin' && (
                    <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold bg-amber-400/20 text-amber-300 rounded-md border border-amber-400/20">
                      ADMIN
                    </span>
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
        <div className="flex items-center justify-between sidebar-gradient px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white font-display">U</span>
            </div>
            <span className="text-sm font-semibold text-white/90 font-display">Účetní OS</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" className="text-white/50 hover:text-white hover:bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
        <nav className="flex items-center justify-around px-1 py-1">
          {navigation.slice(0, 4).map((item) => {
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
                  {item.badge === 'attention' && attentionTotals.total > 0 && (
                    <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center px-1 min-w-[16px] h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                      {attentionTotals.total}
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
            <div className="px-4 pb-4 space-y-1">
              <Link
                href="/accountant/invoicing"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  pathname.startsWith('/accountant/invoicing')
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800'
                }`}
              >
                <Receipt className="h-5 w-5" />
                <span className="text-sm font-medium">Fakturace</span>
              </Link>

              <Link
                href="/accountant/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  pathname.startsWith('/accountant/settings')
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span className="text-sm font-medium">Nastavení</span>
              </Link>

              {showAdmin && (
                <Link
                  href="/accountant/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    pathname.startsWith('/accountant/admin')
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span className="text-sm font-medium">Administrace</span>
                </Link>
              )}

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
      <div className="md:pl-64 flex flex-col min-h-screen">
        {!pathname.startsWith('/accountant/admin') && !pathname.startsWith('/accountant/settings') && (
          <GlobalDeadlineAlert />
        )}

        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 pb-24 md:pb-6 page-enter">
          {children}
        </main>
        <QuickAddButton />
        <KeyboardShortcuts />
        <WelcomeModal />

        <TutorialOverlay />
      </div>
    </div>
  )
}
