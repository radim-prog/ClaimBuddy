'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { MessagesSection } from '@/components/client/messages-section'

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
      <div className="text-center py-12">
        <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">Nemáte žádné firmy.</p>
      </div>
    )
  }

  const selectedCompany = companies[selectedCompanyIndex]

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)] md:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Zprávy</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Komunikace s vaším účetním</p>
      </div>

      {/* Multi-company tabs */}
      {companies.length > 1 && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
          {companies.map((company, index) => (
            <button
              key={company.id}
              onClick={() => setSelectedCompanyIndex(index)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${index === selectedCompanyIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
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
