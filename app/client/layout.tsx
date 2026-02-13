'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  MessageCircle,
  Building2,
  LogOut,
  User,
  BarChart3,
  ScanSearch,
  FileText,
  Receipt,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

const navigation = [
  { name: 'Přehled', href: '/client/dashboard', icon: LayoutDashboard },
  { name: 'Nahrát doklady', href: '/client/upload', icon: Upload },
  { name: 'Dokumenty', href: '/client/documents', icon: FileText },
  { name: 'Faktury', href: '/client/invoices', icon: Receipt },
  { name: 'Zprávy', href: '/client/messages', icon: MessageCircle },
  { name: 'Vytěžování', href: '/client/extraction', icon: ScanSearch },
  { name: 'Reporty', href: '/client/reports', icon: BarChart3 },
  { name: 'Moje firma', href: '/client/company', icon: Building2 },
]

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { userName, userInitials } = useClientUser()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-blue-600 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4">
            <h1 className="text-2xl font-bold text-white">Účetní OS</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                    ${isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-white/80 hover:bg-blue-500/50 hover:text-white'
                    }
                  `}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Theme Toggle */}
          <div className="px-2 pb-2">
            <ThemeToggle variant="full" className="text-white/80 hover:text-white hover:bg-blue-500/50" />
          </div>

          {/* User section */}
          <div className="flex-shrink-0 flex border-t border-white/10 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center w-full group hover:bg-blue-500/50 rounded-lg p-2 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-white text-blue-600 font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <p className="text-xs text-white/70">Klient</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Můj účet</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/client/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Můj profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/company" className="cursor-pointer">
                    <Building2 className="mr-2 h-4 w-4" />
                    Moje firma
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
        <div className="flex items-center justify-between bg-blue-600 px-4 py-3">
          <h1 className="text-xl font-bold text-white">Účetní OS</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-white/90 hover:text-white">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-white text-blue-600 font-bold text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/client/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Můj profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/client/company" className="cursor-pointer">
                  <Building2 className="mr-2 h-4 w-4" />
                  Moje firma
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
      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <nav className="flex justify-around">
          {navigation.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center py-2 px-3 min-w-0 flex-1
                  ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 truncate">{item.name}</span>
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
    <ClientUserProvider>
      <ClientLayoutInner>{children}</ClientLayoutInner>
    </ClientUserProvider>
  )
}
