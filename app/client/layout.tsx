'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  LogOut,
  UserCircle,
  FileText,
  Car,
  ChevronRight,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Logo } from '@/components/ui/logo'
import { ThemeToggle } from '@/components/theme-toggle'
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
import { NotificationModal } from '@/components/client/notification-modal'
import { NotificationBanner } from '@/components/client/notification-banner'
import { ImpersonationBanner } from '@/components/client/impersonation-banner'

const navigation = [
  { name: 'Přehled', href: '/client/dashboard', icon: LayoutDashboard },
  { name: 'Doklady', href: '/client/documents', icon: FileText },
  { name: 'Cesťák', href: '/client/travel', icon: Car },
  { name: 'Zprávy', href: '/client/messages', icon: MessageSquare },
  { name: 'Účet', href: '/client/account', icon: UserCircle },
]

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { userName, userInitials } = useClientUser()
  const [notificationsDismissed, setNotificationsDismissed] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      <NotificationModal onDismissed={() => setNotificationsDismissed(true)} />
      <NotificationBanner dismissed={notificationsDismissed} />

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
                <p className="text-[10px] text-white/40 font-medium">Klientský portál</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="relative flex-1 px-3 py-4 space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
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
                    <Icon className={`mr-3 h-[18px] w-[18px] flex-shrink-0 transition-colors ${isActive ? 'text-amber-400' : 'text-white/40 group-hover:text-white/65'}`} />
                    {item.name}
                  </span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/30" />}
                </Link>
              )
            })}
          </nav>

          {/* Theme Toggle */}
          <div className="relative px-3 pb-2">
            <ThemeToggle variant="full" className="text-white/40 hover:text-white/70 hover:bg-white/[0.05] rounded-xl" />
          </div>

          {/* User section */}
          <div className="relative flex-shrink-0 flex border-t border-white/[0.06] p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center w-full group hover:bg-white/[0.05] rounded-xl p-2 transition-all duration-200">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-white/10 text-white/80 text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-white/90">{userName}</p>
                    <p className="text-[11px] text-white/40">Klient</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Můj účet</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/client/account" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Nastavení účtu
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
                  Nastavení účtu
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
      <div className="md:pl-64 flex flex-col min-h-screen overflow-hidden">
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 pb-20 md:pb-6 min-w-0 page-enter">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-border/50 z-50">
        <nav className="flex justify-around">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-colors
                  ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 truncate">{item.name}</span>
                {isActive && <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
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
        <ClientLayoutInner>{children}</ClientLayoutInner>
      </ClientUserProvider>
    </div>
  )
}
