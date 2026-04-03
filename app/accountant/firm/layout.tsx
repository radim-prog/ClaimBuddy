'use client'

import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { Shield } from 'lucide-react'

export default function FirmLayout({ children }: { children: React.ReactNode }) {
  const { userRole, loading } = useAccountantUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nedostatečná oprávnění</h2>
        <p className="text-gray-500 dark:text-gray-400">Tato sekce je dostupná pouze pro administrátory.</p>
      </div>
    )
  }

  return <>{children}</>
}
