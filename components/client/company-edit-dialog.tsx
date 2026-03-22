'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2 } from 'lucide-react'
import { useState, useEffect } from 'react'

type Company = {
  id: string
  name: string
  ico: string
  dic?: string
  legal_form: string
  vat_payer: boolean
  has_employees: boolean
  status: string
  managing_director?: string | null
}

interface Props {
  company: Company | null
  hidden: boolean
  onToggleHidden: (companyId: string, hidden: boolean) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompanyEditDialog({ company, hidden, onToggleHidden, open, onOpenChange }: Props) {
  const [saving, setSaving] = useState(false)
  const [localHidden, setLocalHidden] = useState(hidden)
  useEffect(() => { setLocalHidden(hidden) }, [hidden])

  const handleSave = async () => {
    if (!company || localHidden === hidden) {
      onOpenChange(false)
      return
    }
    setSaving(true)
    try {
      await onToggleHidden(company.id, localHidden)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  if (!company) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) setLocalHidden(hidden)
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Building2 className="h-5 w-5 text-blue-600" />
            {company.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">IČO</dt>
              <dd className="font-medium">{company.ico}</dd>
            </div>
            {company.dic && (
              <div>
                <dt className="text-muted-foreground">DIČ</dt>
                <dd className="font-medium">{company.dic}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Právní forma</dt>
              <dd className="font-medium">{company.legal_form}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                  {company.status === 'active' ? 'Aktivní' : company.status === 'pending_review' ? 'Čeká na schválení' : 'Neaktivní'}
                </Badge>
              </dd>
            </div>
          </dl>

          <div className="border-t pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localHidden}
                onChange={e => setLocalHidden(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <div>
                <p className="text-sm font-medium">Nezobrazovat v aplikaci</p>
                <p className="text-xs text-muted-foreground">Firma nebude viditelná v přehledech a výběru</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Ukládám...' : 'Uložit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
