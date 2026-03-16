'use client'

import { useState, useEffect } from 'react'
import { useAttention } from '@/lib/contexts/attention-context'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { useRouter, usePathname } from 'next/navigation'
import { MessageCircle, FileX, Upload, Bell, ClipboardList, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const { totals, loading } = useAttention()
  const { userName } = useAccountantUser()
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const isOnDashboard = pathname === '/accountant/dashboard'

  useEffect(() => {
    if (loading) return
    if (totals.total === 0) return

    const shown = sessionStorage.getItem('accountant-welcome-shown')
    if (shown) return

    setOpen(true)
    sessionStorage.setItem('accountant-welcome-shown', '1')
  }, [loading, totals.total])

  if (!open) return null

  const items = [
    { label: 'Nepřečtených zpráv', value: totals.unread_messages, icon: MessageCircle, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Chybějících dokladů', value: totals.missing_documents, icon: FileX, color: 'text-red-600 dark:text-red-400' },
    { label: 'K dokončení', value: totals.pending_uploads, icon: Upload, color: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Aktivních notifikací', value: totals.active_notifications, icon: Bell, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Aktivních úkolů', value: totals.active_tasks, icon: ClipboardList, color: 'text-orange-600 dark:text-orange-400' },
  ].filter(i => i.value > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Dobrý den, {userName || 'účetní'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {totals.companies_needing_attention} firem vyžaduje vaši pozornost
        </p>

        <div className="space-y-3 mb-6">
          {items.map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item.label}</span>
              <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {isOnDashboard ? (
            <Button
              onClick={() => setOpen(false)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              OK
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Zavřít
              </Button>
              <Button
                onClick={() => {
                  setOpen(false)
                  router.push('/accountant/dashboard')
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Přejít na dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
