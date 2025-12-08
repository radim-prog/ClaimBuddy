'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Phone,
  Mail,
  Building2,
  FileText,
  Upload,
  Save,
  ArrowRight,
  Calendar,
  User,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { OnboardingClient, OnboardingStage, STAGE_CONFIG } from '@/lib/types/onboarding'
import { toast } from 'sonner'

// Mock data - v produkci by se načítalo z API
const MOCK_CLIENT: OnboardingClient = {
  id: '3',
  stage: 'contracts',
  priority: 'high',
  company_name: 'TechSolutions a.s.',
  contact_person: 'Petr Svoboda',
  email: 'petr.svoboda@techsolutions.cz',
  phone: '+420 721 456 789',
  ico: '87654321',
  dic: 'CZ87654321',
  legal_form: 'a.s.',
  vat_payer: true,
  vat_registration_date: '2020-01-01',
  address: 'Václavské náměstí 123, 110 00 Praha 1',
  bank_name: 'Česká spořitelna',
  bank_account: '123456789/0800',
  progress_percentage: 75,
  completed_steps: ['Smlouva o vedení účetnictví', 'Plná moc pro úřady'],
  created_at: '2025-11-25T11:00:00Z',
  updated_at: '2025-12-03T08:00:00Z',
  assigned_to_name: 'Jana Svobodová',
  expected_start_date: '2025-12-15',
  service_scope: 'Měsíční uzávěrka, DPH, roční uzávěrka',
  estimated_documents_monthly: 150,
  notes: 'Klient přechází od jiného účetního. Potřebuje rychlý onboarding do konce roku.',
}

export default function OnboardingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<OnboardingClient>(MOCK_CLIENT)
  const [formData, setFormData] = useState(client)
  const [saving, setSaving] = useState(false)

  const stageConfig = STAGE_CONFIG[client.stage]
  const currentStageIndex = Object.keys(STAGE_CONFIG).indexOf(client.stage)
  const nextStage = Object.keys(STAGE_CONFIG)[currentStageIndex + 1] as OnboardingStage | undefined

  const handleStepToggle = (step: string) => {
    const isCompleted = client.completed_steps.includes(step)
    const newSteps = isCompleted
      ? client.completed_steps.filter((s) => s !== step)
      : [...client.completed_steps, step]

    const newProgress = Math.round((newSteps.length / stageConfig.requiredSteps.length) * 100)

    setClient({
      ...client,
      completed_steps: newSteps,
      progress_percentage: newProgress,
    })

    toast.success(isCompleted ? 'Krok zrušen' : 'Krok dokončen')
  }

  const handleSave = async () => {
    setSaving(true)
    // V produkci: await fetch('/api/accountant/onboarding/${clientId}', { method: 'PATCH', body: JSON.stringify(formData) })
    setTimeout(() => {
      setClient(formData)
      setSaving(false)
      toast.success('Údaje uloženy')
    }, 500)
  }

  const handleMoveToNextStage = () => {
    if (!nextStage) {
      toast.error('Klient je již v poslední etapě')
      return
    }

    const allStepsCompleted = client.completed_steps.length === stageConfig.requiredSteps.length

    if (!allStepsCompleted) {
      toast.error('Nejprve dokončete všechny kroky aktuální etapy')
      return
    }

    // V produkci: await fetch('/api/accountant/onboarding/${clientId}/move', { method: 'POST', body: JSON.stringify({ stage: nextStage }) })
    setClient({
      ...client,
      stage: nextStage,
      completed_steps: [],
      progress_percentage: 0,
    })

    toast.success(`Klient přesunut do etapy: ${STAGE_CONFIG[nextStage].label}`)
  }

  const getDaysInStage = () => {
    const updated = new Date(client.updated_at)
    const now = new Date()
    const diff = now.getTime() - updated.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/accountant/onboarding">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zpět na pipeline
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{client.company_name}</h1>
              <Badge variant="outline" className={`${getPriorityColor(client.priority)}`}>
                {client.priority === 'high' ? 'Vysoká priorita' : client.priority === 'medium' ? 'Střední priorita' : 'Nízká priorita'}
              </Badge>
            </div>
            <p className="text-gray-600">
              {client.ico && `IČO: ${client.ico}`}
              {client.dic && ` • DIČ: ${client.dic}`}
              {client.legal_form && ` • ${client.legal_form}`}
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-600 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              {getDaysInStage()} dní v této etapě
            </div>
            {client.expected_start_date && (
              <div className="text-sm text-blue-600">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start: {new Date(client.expected_start_date).toLocaleDateString('cs-CZ')}
              </div>
            )}
          </div>
        </div>

        {/* Stage Progress */}
        <Card className={`mt-4 ${stageConfig.borderColor} border-2`}>
          <CardContent className={`${stageConfig.bgColor} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{stageConfig.icon}</span>
                <div>
                  <h3 className={`font-semibold ${stageConfig.color}`}>{stageConfig.label}</h3>
                  <p className="text-xs text-gray-600">{stageConfig.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{client.progress_percentage}%</div>
                <div className="text-xs text-gray-600">
                  {client.completed_steps.length} / {stageConfig.requiredSteps.length} kroků
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all"
                style={{ width: `${client.progress_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Checklist */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Checklist kroků
              </CardTitle>
              <CardDescription>Dokončete všechny kroky pro přesun do další etapy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stageConfig.requiredSteps.map((step) => {
                const isCompleted = client.completed_steps.includes(step)
                return (
                  <div
                    key={step}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      isCompleted
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => handleStepToggle(step)}
                  >
                    <Checkbox checked={isCompleted} className="mt-0.5" />
                    <div className="flex-1">
                      <span className={`text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {step}
                      </span>
                    </div>
                  </div>
                )
              })}

              {client.completed_steps.length === stageConfig.requiredSteps.length && nextStage && (
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={handleMoveToNextStage}
                >
                  Přesunout do: {STAGE_CONFIG[nextStage].label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dokumenty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Smlouva o vedení účetnictví</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Plná moc</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Nahrát dokument
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Základní údaje */}
          <Card>
            <CardHeader>
              <CardTitle>Základní údaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Název firmy *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="legal_form">Právní forma</Label>
                  <Select
                    value={formData.legal_form}
                    onValueChange={(value) => setFormData({ ...formData, legal_form: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s.r.o.">s.r.o.</SelectItem>
                      <SelectItem value="a.s.">a.s.</SelectItem>
                      <SelectItem value="OSVČ">OSVČ</SelectItem>
                      <SelectItem value="v.o.s.">v.o.s.</SelectItem>
                      <SelectItem value="k.s.">k.s.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ico">IČO *</Label>
                  <Input
                    id="ico"
                    value={formData.ico || ''}
                    onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="dic">DIČ</Label>
                  <Input
                    id="dic"
                    value={formData.dic || ''}
                    onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
                    placeholder="CZ12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="vat_payer">Plátce DPH</Label>
                  <Select
                    value={formData.vat_payer ? 'yes' : 'no'}
                    onValueChange={(value) => setFormData({ ...formData, vat_payer: value === 'yes' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Ano</SelectItem>
                      <SelectItem value="no">Ne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Sídlo firmy</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ulice 123, 110 00 Praha 1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Kontaktní údaje */}
          <Card>
            <CardHeader>
              <CardTitle>Kontaktní údaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contact_person">Kontaktní osoba *</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bankovní údaje */}
          <Card>
            <CardHeader>
              <CardTitle>Bankovní údaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_name">Název banky</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name || ''}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bank_account">Číslo účtu</Label>
                  <Input
                    id="bank_account"
                    value={formData.bank_account || ''}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    placeholder="123456789/0800"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ostatní */}
          <Card>
            <CardHeader>
              <CardTitle>Další informace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expected_start_date">Očekávaný začátek vedení účetnictví</Label>
                  <Input
                    id="expected_start_date"
                    type="date"
                    value={formData.expected_start_date || ''}
                    onChange={(e) => setFormData({ ...formData, expected_start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_documents_monthly">Odhadovaný počet dokladů/měsíc</Label>
                  <Input
                    id="estimated_documents_monthly"
                    type="number"
                    value={formData.estimated_documents_monthly || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, estimated_documents_monthly: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="service_scope">Rozsah služeb</Label>
                <Input
                  id="service_scope"
                  value={formData.service_scope || ''}
                  onChange={(e) => setFormData({ ...formData, service_scope: e.target.value })}
                  placeholder="Měsíční uzávěrka, DPH, mzdy..."
                />
              </div>

              <div>
                <Label htmlFor="notes">Poznámky</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Speciální požadavky, důležité informace..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="mr-2 h-5 w-5" />
            {saving ? 'Ukládám...' : 'Uložit změny'}
          </Button>
        </div>
      </div>
    </div>
  )
}
