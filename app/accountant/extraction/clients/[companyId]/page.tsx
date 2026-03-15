'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
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
  const companyId = params.companyId as string
  const { userId } = useAccountantUser()
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCompany = useCallback(async () => {
    if (!userId || !companyId) return
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}`, {
        headers: { 'x-user-id': userId },
      })
      if (res.ok) {
        const data = await res.json()
        setCompany(data.company)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId, companyId])

  useEffect(() => {
    fetchCompany()
  }, [fetchCompany])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

      {/* Document Register — reuse existing component */}
      <DocumentRegisterTab companyId={companyId} extractableOnly />
    </div>
  )
}
