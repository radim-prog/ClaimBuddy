'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export function ImpersonationBanner() {
  const router = useRouter()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const { companies } = useClientUser()

  useEffect(() => {
    const id = getCookie('impersonate_company')
    if (id) setCompanyId(id)
  }, [])

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
