'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Phone, UserCheck, XCircle, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

type Lead = {
  id: string
  status: string
  preferred_location: string | null
  business_type: string | null
  budget_range: string | null
  note: string | null
  source: string | null
  admin_note: string | null
  created_at: string
  users: { name: string; email: string } | null
  companies: { name: string; ico: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'Nový', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  contacted: { label: 'Kontaktován', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  converted: { label: 'Konvertován', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: 'Zamítnuto', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

const BUDGET_LABELS: Record<string, string> = {
  do_2000: 'Do 2 000 Kč',
  '2000_5000': '2–5 tis. Kč',
  '5000_10000': '5–10 tis. Kč',
  nad_10000: '10 tis.+ Kč',
  neznam: 'Neví',
}

export function LeadsList() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/admin/leads?status=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeads() }, [filter])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    try {
      const res = await fetch('/api/accountant/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(`Status změněn na: ${STATUS_CONFIG[status]?.label}`)
        fetchLeads()
      }
    } catch {
      toast.error('Chyba při aktualizaci')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'new', 'contacted', 'converted', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              filter === s
                ? 'bg-purple-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? 'Vše' : STATUS_CONFIG[s]?.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{leads.length} leadů</span>
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Žádné leady</p>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => {
            const statusInfo = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
            return (
              <div key={lead.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-sm">
                      {lead.users?.name || 'Neznámý'}
                    </span>
                    {lead.users?.email && (
                      <span className="text-xs text-muted-foreground ml-2">{lead.users.email}</span>
                    )}
                    {lead.companies && (
                      <span className="text-xs text-muted-foreground block">
                        {lead.companies.name} {lead.companies.ico && `(IČO: ${lead.companies.ico})`}
                      </span>
                    )}
                  </div>
                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {lead.preferred_location && (
                    <div><span className="text-muted-foreground">Lokalita:</span> {lead.preferred_location}</div>
                  )}
                  {lead.business_type && (
                    <div><span className="text-muted-foreground">Typ:</span> {lead.business_type}</div>
                  )}
                  {lead.budget_range && (
                    <div><span className="text-muted-foreground">Rozpočet:</span> {BUDGET_LABELS[lead.budget_range] || lead.budget_range}</div>
                  )}
                </div>

                {lead.note && (
                  <div className="flex items-start gap-1.5 text-xs">
                    <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                    <span>{lead.note}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(lead.created_at).toLocaleString('cs-CZ')}
                    {lead.source && ` · ${lead.source}`}
                  </span>
                  <div className="flex items-center gap-1">
                    {lead.status === 'new' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={updating === lead.id}
                        onClick={() => updateStatus(lead.id, 'contacted')}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Kontaktovat
                      </Button>
                    )}
                    {(lead.status === 'new' || lead.status === 'contacted') && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-green-600 hover:text-green-700"
                          disabled={updating === lead.id}
                          onClick={() => updateStatus(lead.id, 'converted')}
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Konvertovat
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-600 hover:text-red-700"
                          disabled={updating === lead.id}
                          onClick={() => updateStatus(lead.id, 'rejected')}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Zamítnout
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
