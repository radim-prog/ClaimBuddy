'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { MessagesSection } from '@/components/client/messages-section'
import { ServiceRequestButton } from '@/components/client/service-request-button'

export default function MessagesPage() {
  const { userName, companies, loading } = useClientUser()
  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <p className="font-semibold text-gray-900 dark:text-white mb-1">Zatím žádné zprávy</p>
        <p className="text-sm text-muted-foreground mb-5">Přidejte firmu pro komunikaci s účetním.</p>
        <Link
          href="/client/account"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Přidat firmu
        </Link>
      </div>
    )
  }

  const selectedCompany = companies[selectedCompanyIndex]

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)] md:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Zprávy</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Komunikace s vaším účetním</p>
        </div>
        <ServiceRequestButton />
      </div>

      {/* Multi-company tabs */}
      {companies.length > 1 && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
          {companies.map((company, index) => (
            <button
              key={company.id}
              onClick={() => setSelectedCompanyIndex(index)}
              className={`
                filter-pill whitespace-nowrap
                ${index === selectedCompanyIndex
                  ? 'filter-pill-active'
                  : 'filter-pill-inactive'
                }
              `}
            >
              {company.name}
            </button>
          ))}
        </div>
      )}

      {/* Chat area - takes remaining space */}
      <div className="flex-1 overflow-hidden border-t border-border/50">
        <MessagesSection
          key={selectedCompany.id}
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
          userName={userName}
        />
      </div>
    </div>
  )
}
