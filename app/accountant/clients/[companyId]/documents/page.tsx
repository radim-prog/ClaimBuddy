'use client'

import { useCompany } from '../layout'
import { DocumentsSection } from '@/components/accountant/documents-section'

export default function DocumentsPage() {
  const { company, companyId } = useCompany()

  return (
    <DocumentsSection
      companyId={companyId}
      companyName={company.name}
      vatPayer={company.vat_payer}
    />
  )
}
