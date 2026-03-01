'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Briefcase } from 'lucide-react'
import { toast } from 'sonner'

interface EmailAssignDialogProps {
  emailId: string
  emailSubject: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssigned: () => void
}

type CaseOption = {
  id: string
  title: string
  case_number?: string
  company_id?: string
}

export function EmailAssignDialog({ emailId, emailSubject, open, onOpenChange, onAssigned }: EmailAssignDialogProps) {
  const [cases, setCases] = useState<CaseOption[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      // Fetch all active cases
      fetch('/api/projects?is_case=true&status=active')
        .then(r => r.json())
        .then(data => {
          const projects = (data.projects || []).filter((p: CaseOption & { is_case: boolean }) => p.is_case)
          setCases(projects)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open])

  const handleAssign = async () => {
    if (!selectedCaseId) return
    setSubmitting(true)
    try {
      const selectedCase = cases.find(c => c.id === selectedCaseId)
      const res = await fetch(`/api/case-emails/${emailId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedCaseId,
          company_id: selectedCase?.company_id || null,
        }),
      })
      if (res.ok) {
        toast.success('Email přiřazen ke spisu')
        onAssigned()
        onOpenChange(false)
      } else {
        toast.error('Chyba při přiřazení')
      }
    } catch {
      toast.error('Chyba při přiřazení')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Přiřadit email ke spisu
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="text-sm font-medium">{emailSubject}</p>
          </div>

          <div className="space-y-2">
            <Label>Spis</Label>
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Načítání...' : 'Vyberte spis'} />
              </SelectTrigger>
              <SelectContent>
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.case_number ? `${c.case_number} — ` : ''}{c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAssign} disabled={!selectedCaseId || submitting}>
              {submitting ? 'Přiřazuji...' : 'Přiřadit'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
