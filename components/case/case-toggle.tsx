'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Briefcase, Eye } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { CaseType } from '@/lib/types/project'
import { toast } from 'sonner'

interface CaseToggleProps {
  projectId: string
  project: {
    is_case?: boolean
    case_number?: string
    case_type_id?: string
    case_opposing_party?: string
    case_reference?: string
    hourly_rate?: number
    client_visible?: boolean
    client_visible_tabs?: string[]
  }
  onUpdate: (updated: Record<string, unknown>) => void
}

export function CaseToggle({ projectId, project, onUpdate }: CaseToggleProps) {
  const [isCase, setIsCase] = useState(project.is_case || false)
  const [caseTypeId, setCaseTypeId] = useState(project.case_type_id || '')
  const [opposingParty, setOpposingParty] = useState(project.case_opposing_party || '')
  const [reference, setReference] = useState(project.case_reference || '')
  const [hourlyRate, setHourlyRate] = useState(project.hourly_rate || 1500)
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([])
  const [clientVisible, setClientVisible] = useState(project.client_visible || false)
  const [clientVisibleTabs, setClientVisibleTabs] = useState<string[]>(project.client_visible_tabs || ['timeline', 'documents'])
  const [loading, setLoading] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [showForm, setShowForm] = useState(project.is_case || false)

  useEffect(() => {
    fetch('/api/case-types')
      .then(r => r.json())
      .then(data => setCaseTypes(data.case_types || []))
      .catch(() => {})
  }, [])

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      setShowDisableConfirm(true)
      return
    }
    setIsCase(true)
    setShowForm(true)
  }

  const handleDisableConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_case: false, client_visible: false }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsCase(false)
        setShowForm(false)
        setClientVisible(false)
        onUpdate(data.project || data)
        toast.success('Spisový režim vypnut')
      } else {
        toast.error('Chyba při vypínání spisu')
      }
    } catch {
      toast.error('Chyba při vypínání spisu')
    } finally {
      setLoading(false)
      setShowDisableConfirm(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_case: true,
          case_type_id: caseTypeId || null,
          case_opposing_party: opposingParty || null,
          case_reference: reference || null,
          hourly_rate: hourlyRate,
          client_visible: clientVisible,
          client_visible_tabs: clientVisibleTabs,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        onUpdate(data.project || data)
        toast.success('Nastavení spisu uloženo')
      } else {
        toast.error('Chyba při ukládání nastavení')
      }
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" />
            Spisový systém
            {project.case_number && (
              <Badge variant="outline">{project.case_number}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Povolit spisový systém</Label>
              <p className="text-sm text-muted-foreground">
                {isCase
                  ? 'Tento projekt je veden jako spis'
                  : 'Převést projekt na spis s číselnou řadou'}
              </p>
            </div>
            <Switch checked={isCase} onCheckedChange={handleToggle} />
          </div>

          {showForm && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Typ spisu</Label>
                <Select value={caseTypeId} onValueChange={setCaseTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte typ spisu" />
                  </SelectTrigger>
                  <SelectContent>
                    {caseTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                        {type.default_hourly_rate && (
                          <span className="text-muted-foreground text-xs ml-2">
                            ({type.default_hourly_rate} Kč/h)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Protistrana</Label>
                <Input
                  placeholder="Např. Finanční úřad, Klient XYZ"
                  value={opposingParty}
                  onChange={(e) => setOpposingParty(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Reference / spisová značka</Label>
                <Input
                  placeholder="Externí reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Hodinová sazba (Kč)</Label>
                <Input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                />
              </div>

              {/* Client Visibility Section */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Viditelnost pro klienta
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {clientVisible ? 'Klient vidí tento spis ve svém portálu' : 'Spis je skrytý pro klienta'}
                    </p>
                  </div>
                  <Switch checked={clientVisible} onCheckedChange={setClientVisible} />
                </div>

                {clientVisible && (
                  <div className="space-y-2 pl-6">
                    <Label className="text-xs text-muted-foreground">Viditelné záložky:</Label>
                    {[
                      { value: 'timeline', label: 'Časová osa' },
                      { value: 'documents', label: 'Dokumenty' },
                      { value: 'budget', label: 'Rozpočet' },
                    ].map(tab => (
                      <div key={tab.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`tab-${tab.value}`}
                          checked={clientVisibleTabs.includes(tab.value)}
                          onCheckedChange={(checked) => {
                            setClientVisibleTabs(prev =>
                              checked
                                ? [...prev, tab.value]
                                : prev.filter(t => t !== tab.value)
                            )
                          }}
                        />
                        <label htmlFor={`tab-${tab.value}`} className="text-sm">{tab.label}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading ? 'Ukládání...' : 'Uložit nastavení spisu'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vypnout spisový systém?</DialogTitle>
            <DialogDescription>
              Tento projekt přestane být veden jako spis. Data zůstanou zachována.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableConfirm(false)}>
              Zrušit
            </Button>
            <Button variant="destructive" onClick={handleDisableConfirm} disabled={loading}>
              Vypnout spis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
