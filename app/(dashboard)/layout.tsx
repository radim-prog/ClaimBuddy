'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/firebase/auth';
import { FileText, Home, Settings, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Načítání...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const navigation = [
    { name: 'Přehled', href: '/dashboard', icon: Home },
    { name: 'Moje případy', href: '/dashboard/cases', icon: FileText },
    { name: 'Nastavení', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">CB</span>
          </div>
          <span className="font-bold">ClaimBuddy</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b hidden lg:block">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-xl font-bold">CB</span>
              </div>
              <span className="text-xl font-bold">ClaimBuddy</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 mt-16 lg:mt-0">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5 text-gray-500" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="font-semibold">
                  {userData?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userData?.name}</p>
                <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Odhlásit se
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-4 lg:p-8 pt-20 lg:pt-8">{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
