'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FolderKanban,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  DollarSign,
  Sparkles,
  UserPlus,
  Shield,
  CalendarCheck,
  BookOpen,
  FileSearch,
  BarChart3,
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
import { QuickAddButton } from '@/components/gtd/quick-add-button'
// Badge count - will be fetched from API in future; for now show 0

const navigation = [
  { name: 'Dashboard', href: '/accountant/dashboard', icon: LayoutDashboard },
  { name: 'Klienti', href: '/accountant/clients', icon: Users },
  { name: 'Onboarding', href: '/accountant/onboarding', icon: UserPlus },
  { name: 'Termíny', href: '/accountant/deadlines', icon: CalendarCheck },
  { name: 'Vytěžování', href: '/accountant/extraction', icon: FileSearch },
  { name: 'Reporty', href: '/accountant/reports', icon: BarChart3 },
  { name: 'Projekty', href: '/accountant/projects', icon: FolderKanban },
  { name: 'Úkoly', href: '/accountant/tasks', icon: CheckSquare, badge: 'dynamic' as const },
  { name: 'Fakturace', href: '/accountant/invoicing', icon: DollarSign },
  { name: 'Nastavení', href: '/accountant/settings', icon: Settings },
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
        <AccountantLayoutInner>{children}</AccountantLayoutInner>
      </SettingsProvider>
    </AccountantUserProvider>
  )
}

function AccountantLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { userName, userInitials, userRole, permissions } = useAccountantUser()

  const showAdmin = userRole === 'admin' || permissions?.admin_access === true

  const handleLogout = async () => {
    await logout()
  }

  const roleLabel = userRole === 'admin' ? 'Admin' : userRole === 'accountant' ? 'Účetní' : userRole === 'assistant' ? 'Asistentka' : 'Klient'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-purple-700 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white dark:bg-gray-800/10">
            <h1 className="text-2xl font-bold text-purple-700 dark:text-white">Účetní OS</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive
                      ? 'bg-purple-500 text-white'
                      : 'text-white/80 hover:bg-purple-600 hover:text-white'
                    }
                  `}
                >
                  <span className="flex items-center">
                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0`} />
                    {item.name}
                  </span>
                  {/* Task attention badge - count computed from tasks API */}
                </Link>
              )
            })}

            {/* ADMIN SECTION - visible only to admin/users with admin_access */}
            {showAdmin && (
              <div className="pt-4 mt-4 border-t border-white/20">
                <p className="px-2 text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
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
                        group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive
                          ? 'bg-gradient-to-r from-purple-400/30 to-indigo-400/30 text-white border border-purple-300/50'
                          : 'text-white/80 hover:bg-gradient-to-r hover:from-purple-400/20 hover:to-indigo-400/20 hover:text-white border border-transparent'
                        }
                      `}
                    >
                      <span className="flex items-center">
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* DEMO FEATURES SECTION */}
            {demoFeatures.length > 0 && (
              <div className="pt-4 mt-4 border-t border-white/20">
                <p className="px-2 text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Nové Funkce (Demo)
                </p>
                {demoFeatures.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive
                          ? 'bg-gradient-to-r from-yellow-400/30 to-orange-400/30 text-white border border-yellow-400/50'
                          : 'text-white/80 hover:bg-gradient-to-r hover:from-yellow-400/20 hover:to-orange-400/20 hover:text-white border border-transparent'
                        }
                      `}
                    >
                      <span className="flex items-center">
                        <Icon className={`mr-3 h-5 w-5 flex-shrink-0`} />
                        {item.name}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-bold bg-yellow-400 text-gray-900 dark:text-white rounded">
                        {item.badge}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Theme Toggle */}
            <div className="pt-4 mt-4 border-t border-white/20">
              <ThemeToggle variant="full" className="text-white/80 hover:text-white hover:bg-purple-600" />
            </div>
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 flex border-t border-white/10 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center w-full group hover:bg-purple-600/50 dark:hover:bg-gray-800/10 rounded-lg p-2 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-white dark:bg-gray-800 text-purple-600 font-bold">
                      {userInitials || '..'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-white">{userName || 'Načítání...'}</p>
                    <p className="text-xs text-white/70">{roleLabel}</p>
                  </div>
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
        <div className="flex items-center justify-between bg-purple-700 px-4 py-3">
          <h1 className="text-xl font-bold text-white">Účetní OS</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:bg-purple-600/50 dark:hover:bg-gray-800/10"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-lg">
            <nav className="px-2 py-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}

              {/* Admin section - mobile */}
              {showAdmin && (
                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administrace
                  </p>
                  {adminNavigation.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${isActive
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </nav>

            {/* Mobile user section */}
            <div className="border-t dark:border-gray-700 px-4 py-3">
              <div className="flex items-center mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-purple-600 text-white font-bold">
                    {userInitials || '..'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{userName || 'Načítání...'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  href="/accountant/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Link>
                <ThemeToggle variant="full" className="px-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Odhlásit se
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {!pathname.startsWith('/accountant/admin') && !pathname.startsWith('/accountant/settings') && (
          <GlobalDeadlineAlert />
        )}

        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <QuickAddButton />
      </div>
    </div>
  )
}
