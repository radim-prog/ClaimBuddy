'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { DocumentRegisterTab } from '@/components/accountant/documents/document-register-tab'
import {
  ArrowLeft,
  Building2,
  Loader2,
} from 'lucide-react'

type CompanyInfo = {
  id: string
  name: string
  ico: string
  dic: string | null
  legal_form: string
}

export default function ExtractionClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const { userId, loading: userLoading } = useAccountantUser()
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompany = useCallback(async () => {
    if (userLoading) return
    if (!userId || !companyId) {
      setLoading(false)
      setError(!userId ? 'Nepodařilo se ověřit uživatele' : 'Chybí ID firmy')
      return
    }
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}`, {
        headers: { 'x-user-id': userId },
      })
      if (res.ok) {
        const data = await res.json()
        setCompany(data.company)
        setError(null)
      } else if (res.status === 404) {
        setError('Firma nenalezena')
      } else {
        setError('Chyba při načítání dat firmy')
      }
    } catch {
      setError('Chyba připojení k serveru')
    } finally {
      setLoading(false)
    }
  }, [userId, userLoading, companyId])

  useEffect(() => {
    fetchCompany()
  }, [fetchCompany])

  // Safety timeout — prevent infinite spinner
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setError('Načítání trvá příliš dlouho — zkuste to znovu')
      }
    }, 15000)
    return () => clearTimeout(timer)
  }, [loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/accountant/extraction/clients')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zpět
          </Button>
          <Button size="sm" onClick={() => { setLoading(true); setError(null); fetchCompany() }}>
            Zkusit znovu
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/accountant/extraction/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zpět
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <Link href={`/accountant/clients/${companyId}`} className="hover:underline">
                <h2 className="font-semibold text-lg">{company?.name || 'Neznámá firma'}</h2>
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {company?.ico && <span>IČ: {company.ico}</span>}
                {company?.dic && <span>DIČ: {company.dic}</span>}
                {company?.legal_form && (
                  <Badge variant="outline" className="text-[10px]">{company.legal_form}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Register — with navigation to verify */}
      <DocumentRegisterTab
        companyId={companyId}
        onDocumentNavigate={(id) => router.push(`/accountant/extraction/verify?doc=${id}`)}
      />
    </div>
  )
}
