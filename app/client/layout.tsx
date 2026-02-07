'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  FileText,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Receipt
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

const navigation = [
  { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { name: 'Moje firmy', href: '/client/companies', icon: Building2 },
  { name: 'Faktury', href: '/client/invoices', icon: Receipt },
  { name: 'Dokumenty', href: '/client/documents', icon: FileText },
  { name: 'Nahrát dokumenty', href: '/client/upload', icon: Upload },
  { name: 'Nastavení', href: '/client/settings', icon: Settings },
]

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-600 to-purple-600 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white dark:bg-gray-800/10">
            <h1 className="text-2xl font-bold text-white">Účetní OS</h1>
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
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive
                      ? 'bg-white dark:bg-gray-800/20 text-white'
                      : 'text-white/80 hover:bg-white dark:bg-gray-800/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`mr-3 h-5 w-5 flex-shrink-0`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 flex border-t border-white/10 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center w-full group hover:bg-white dark:bg-gray-800/10 rounded-lg p-2 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-white dark:bg-gray-800 text-purple-600 font-bold">
                      KN
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-white">Karel Novák</p>
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
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client/settings" className="cursor-pointer">
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
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
          <h1 className="text-xl font-bold text-white">Účetní OS</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:bg-white dark:bg-gray-800/10"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="bg-white dark:bg-gray-800 border-b shadow-lg">
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
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700'
                      }
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Mobile user section */}
            <div className="border-t px-4 py-3">
              <div className="flex items-center mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold">
                    KN
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Karel Novák</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Klient</p>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  href="/client/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-md"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
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
      <div className="md:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
