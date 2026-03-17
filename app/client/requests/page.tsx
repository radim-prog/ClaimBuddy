'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle,
  Loader2,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface ServiceRequest {
  id: string
  type: string
  priority: string
  subject: string
  description: string
  status: string
  created_at: string
  assigned_user?: { id: string; name: string } | null
}

const TYPE_LABELS: Record<string, string> = {
  general: 'Obecný',
  documents: 'Doklady',
  tax: 'Daně',
  payroll: 'Mzdy',
  invoice: 'Fakturace',
  consultation: 'Konzultace',
  urgent: 'Urgentní',
  other: 'Jiný',
}

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'Nízká', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  normal: { label: 'Normální', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  high: { label: 'Vysoká', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  urgent: { label: 'Urgentní', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  new: { label: 'Nový', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: MessageSquare },
  in_progress: { label: 'Řeší se', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
  waiting: { label: 'Čeká', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: AlertTriangle },
  resolved: { label: 'Vyřešeno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
  closed: { label: 'Uzavřeno', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: CheckCircle },
}

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formType, setFormType] = useState('general')
  const [formPriority, setFormPriority] = useState('normal')
  const [formSubject, setFormSubject] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const fetchRequests = () => {
    setLoading(true)
    fetch('/api/client/requests')
      .then(r => r.ok ? r.json() : null)
      .then(data => setRequests(data?.requests ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRequests() }, [])

  const handleSubmit = async () => {
    if (!formSubject.trim() || !formDescription.trim()) {
      toast.error('Vyplňte předmět a popis požadavku')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/client/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          priority: formPriority,
          subject: formSubject.trim(),
          description: formDescription.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Chyba při vytváření požadavku')
        return
      }

      toast.success('Požadavek odeslán')
      setDialogOpen(false)
      setFormType('general')
      setFormPriority('normal')
      setFormSubject('')
      setFormDescription('')
      fetchRequests()
    } catch {
      toast.error('Nepodařilo se odeslat požadavek')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Požadavky</h1>
          <p className="text-sm text-muted-foreground mt-1">Servisní požadavky a dotazy na účetní</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nový požadavek
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <HelpCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-foreground">Žádné požadavky</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Potřebujete pomoct? Vytvořte nový požadavek a váš účetní se vám ozve.
            </p>
            <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Vytvořit požadavek
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.new
            const StatusIcon = statusCfg.icon
            const priorityCfg = PRIORITY_LABELS[req.priority] || PRIORITY_LABELS.normal

            return (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">{req.subject}</h3>
                        <Badge variant="secondary" className={`text-xs ${statusCfg.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusCfg.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABELS[req.type] || req.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(req.created_at).toLocaleDateString('cs-CZ')}</span>
                        <Badge variant="outline" className={`text-[10px] ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </Badge>
                        {req.assigned_user && (
                          <span>Řeší: {req.assigned_user.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* New Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nový požadavek</DialogTitle>
            <DialogDescription>
              Popište svůj požadavek a my se vám ozveme co nejdříve.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Typ</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorita</Label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([val, cfg]) => (
                      <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Předmět</Label>
              <Input
                value={formSubject}
                onChange={e => setFormSubject(e.target.value)}
                placeholder="Stručný popis požadavku..."
              />
            </div>

            <div className="space-y-2">
              <Label>Popis</Label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Podrobný popis vašeho požadavku..."
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Odesílám...
                </>
              ) : (
                'Odeslat požadavek'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
