'use client'

import { AccountantMessagesSection } from '@/components/accountant/messages-section'
import { useCompany } from '../layout'

export default function MessagesPage() {
  const { companyId, company } = useCompany()

  return (
    <AccountantMessagesSection
      companyId={companyId}
      companyName={company.name}
    />
  )
}
