'use client'

import React, { useState } from 'react'

type GroupCompany = {
  id: string
  name: string
}

export function BillingEntitySelector({
  groupName,
  companies,
  currentBillingId,
  onSelect,
}: {
  groupName: string
  companies: GroupCompany[]
  currentBillingId: string | null
  onSelect: (groupName: string, companyId: string) => void
}) {
  const [saving, setSaving] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = e.target.value
    if (!companyId) return
    setSaving(true)
    try {
      await onSelect(groupName, companyId)
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      value={currentBillingId || ''}
      onChange={handleChange}
      disabled={saving}
      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 max-w-[120px] truncate disabled:opacity-50"
      title={`Plátce za skupinu ${groupName}`}
    >
      <option value="">— Plátce —</option>
      {companies.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  )
}
