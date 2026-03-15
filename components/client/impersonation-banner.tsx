'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, ShieldCheck } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'

export function ImpersonationBanner() {
  const router = useRouter()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const { companies } = useClientUser()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.role === 'admin' || data.role === 'accountant') {
          setIsAdmin(true)
        }
        if (data.impersonate_company) {
          setCompanyId(data.impersonate_company)
        }
      })
      .catch(() => {})
  }, [])

  // Admin/accountant without impersonation → show "back to accountant" banner
  if (isAdmin && !companyId) {
    return (
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-sm z-[100] relative">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Prohlížíte klientský portál jako <strong>administrátor</strong></span>
        </div>
        <button
          onClick={() => router.push('/accountant/dashboard')}
          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-3 py-1 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět do účetní sekce
        </button>
      </div>
    )
  }

  // Impersonation mode
  if (!companyId) return null

  const companyName = companies.find(c => c.id === companyId)?.name || companyId

  const handleBack = async () => {
    await fetch('/api/auth/impersonate', { method: 'DELETE' })
    router.push(`/accountant/clients/${companyId}`)
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm z-[100] relative">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>
          Zobrazujete pohled klienta: <strong>{companyName}</strong>
        </span>
      </div>
      <button
        onClick={handleBack}
        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-3 py-1 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Zpět do účetní sekce
      </button>
    </div>
  )
}
