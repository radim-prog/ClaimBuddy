'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function OperationsClosureSettings() {
  const [requireManagerApproval, setRequireManagerApproval] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/accountant/firm/closure-settings')
      .then(r => r.json())
      .then(data => {
        setRequireManagerApproval(data.require_manager_approval ?? false)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (checked: boolean) => {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/firm/closure-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ require_manager_approval: checked }),
      })
      if (!res.ok) throw new Error('Save failed')
      setRequireManagerApproval(checked)
      toast.success(checked
        ? 'Dvoustupňové schvalování zapnuto'
        : 'Dvoustupňové schvalování vypnuto'
      )
    } catch {
      toast.error('Chyba při ukládání nastavení')
    } finally {
      setSaving(false)
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
      <Card className="shadow-soft-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 dark:text-white">Dvoustupňové schvalování</h3>
                <Badge variant={requireManagerApproval ? 'default' : 'secondary'} className="text-xs">
                  {requireManagerApproval ? 'Zapnuto' : 'Vypnuto'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {requireManagerApproval
                  ? 'Účetní může označit doklady jako "Ke kontrole", ale finální schválení může provést pouze manažer nebo admin.'
                  : 'Účetní mohou schvalovat uzávěrky přímo bez nutnosti schválení manažerem.'
                }
              </p>
            </div>
            <Switch
              checked={requireManagerApproval}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
