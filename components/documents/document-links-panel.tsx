'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Link2, Plus, Loader2 } from 'lucide-react'
import { DocumentMiniCard } from './document-mini-card'
import { DocumentLinkPicker } from './document-link-picker'
import type { DocumentLinkWithDocument, LinkEntityType, DocumentLinkType } from '@/lib/types/document-links'

interface DocumentLinksPanelProps {
  entityType: LinkEntityType
  entityId: string
  companyId: string
  allowEdit?: boolean
  compact?: boolean
}

function getApiUrl(entityType: LinkEntityType, entityId: string): string {
  switch (entityType) {
    case 'task':
      return `/api/tasks/${entityId}/documents`
    case 'project':
      return `/api/projects/${entityId}/register-documents`
    default:
      return `/api/tasks/${entityId}/documents` // fallback
  }
}

export function DocumentLinksPanel({ entityType, entityId, companyId, allowEdit = false, compact = false }: DocumentLinksPanelProps) {
  const [links, setLinks] = useState<DocumentLinkWithDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)

  const apiUrl = getApiUrl(entityType, entityId)

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch(apiUrl)
      if (res.ok) {
        const data = await res.json()
        setLinks(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  const handleLink = async (documentIds: string[], linkType: DocumentLinkType) => {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: documentIds, link_type: linkType }),
      })
      if (res.ok) {
        setShowPicker(false)
        await fetchLinks()
      }
    } catch {
      // silently fail
    }
  }

  const handleUnlink = async (documentId: string) => {
    try {
      const res = await fetch(`${apiUrl}?document_id=${documentId}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchLinks()
      }
    } catch {
      // silently fail
    }
  }

  const existingDocIds = links.map(l => l.document.id)

  if (compact && !loading && links.length === 0 && !allowEdit) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
          <Link2 className="h-3 w-3" />
          Propojené doklady ({links.length})
        </h4>
        {allowEdit && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowPicker(true)}>
            <Plus className="h-3 w-3 mr-1" /> Připojit
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && links.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 py-2">Žádné propojené doklady</p>
      )}

      {links.length > 0 && (
        <div className="space-y-0.5">
          {links.map(link => (
            <DocumentMiniCard
              key={link.id}
              document={link.document}
              linkType={link.link_type}
              showUnlink={allowEdit}
              onUnlink={() => handleUnlink(link.document.id)}
            />
          ))}
        </div>
      )}

      {showPicker && (
        <DocumentLinkPicker
          companyId={companyId}
          entityType={entityType}
          entityId={entityId}
          existingDocIds={existingDocIds}
          onLink={handleLink}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
