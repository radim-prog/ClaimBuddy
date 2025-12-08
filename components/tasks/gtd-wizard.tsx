'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Zap, Users, Target, ListTodo } from 'lucide-react'

// GTD contexts
const GTD_CONTEXTS = [
  { value: '@telefon', label: '@telefon' },
  { value: '@email', label: '@email' },
  { value: '@počítač', label: '@počítač' },
  { value: '@klient', label: '@klient' },
  { value: '@kancelář', label: '@kancelář' },
] as const

// Energy levels
const ENERGY_LEVELS = [
  { value: 'high', label: 'Vysoká', description: 'Vyžaduje plnou koncentraci' },
  { value: 'medium', label: 'Střední', description: 'Běžná práce' },
  { value: 'low', label: 'Nízká', description: 'Můžu dělat i když jsem unavený' },
] as const

// Time estimate presets
const TIME_PRESETS = [
  { value: 15, label: '15 minut' },
  { value: 30, label: '30 minut' },
  { value: 60, label: '1 hodina' },
  { value: 120, label: '2 hodiny' },
  { value: 240, label: 'Půl dne (4 hodiny)' },
  { value: 480, label: 'Celý den (8 hodin)' },
] as const

interface Subtask {
  id: string
  text: string
  dueDate?: string
  dueTime?: string
  assignedTo?: string
  estimatedMinutes?: number
}

interface GTDWizardData {
  // Step 1: Clarify
  title: string
  description: string
  isProject: boolean
  projectOutcome: string

  // Step 2: Quick Action (2-minute rule)
  isQuickAction: boolean

  // Step 3: Delegate
  shouldDelegate: boolean
  delegateTo?: string
  delegationReason?: string

  // Step 4: Context & Energy
  contexts: string[]
  energyLevel: 'high' | 'medium' | 'low' | ''

  // Step 4b: Time Estimate
  estimatedMinutes?: number

  // Step 5: Billable
  isBillable: boolean
  hourlyRate?: number

  // Additional fields
  dueDate?: string
  dueTime?: string
  assignedTo?: string

  // For projects: subtasks
  subtasks: Subtask[]
}

interface GTDWizardProps {
  companyId: string
  companyName: string
  onComplete: (data: GTDWizardData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<GTDWizardData>
  availableUsers?: Array<{ id: string; name: string }>
}

export function GTDWizard({
  companyId,
  companyName,
  onComplete,
  onCancel,
  initialData,
  availableUsers = [],
}: GTDWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [data, setData] = useState<GTDWizardData>({
    title: '',
    description: '',
    isProject: false,
    projectOutcome: '',
    isQuickAction: false,
    shouldDelegate: false,
    contexts: [],
    energyLevel: '',
    isBillable: false,
    subtasks: [],
    ...initialData,
  })

  const totalSteps = data.isProject ? 6 : 5

  // Update data helper
  const updateData = (updates: Partial<GTDWizardData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  // Navigation
  const goNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onComplete(data)
    } catch (error) {
      console.error('Error submitting GTD wizard:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add subtask
  const addSubtask = () => {
    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      text: '',
    }
    updateData({ subtasks: [...data.subtasks, newSubtask] })
  }

  // Update subtask
  const updateSubtask = (id: string, updates: Partial<Subtask>) => {
    updateData({
      subtasks: data.subtasks.map(st =>
        st.id === id ? { ...st, ...updates } : st
      )
    })
  }

  // Remove subtask
  const removeSubtask = (id: string) => {
    updateData({
      subtasks: data.subtasks.filter(st => st.id !== id)
    })
  }

  // Toggle context
  const toggleContext = (context: string) => {
    const newContexts = data.contexts.includes(context)
      ? data.contexts.filter(c => c !== context)
      : [...data.contexts, context]
    updateData({ contexts: newContexts })
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-2xl">GTD Wizard - Zpracování úkolu</CardTitle>
          <div className="text-sm text-muted-foreground">
            Krok {currentStep} / {totalSteps}
          </div>
        </div>
        <CardDescription>
          Projdeme úkol metodou Getting Things Done
        </CardDescription>

        {/* Progress indicator */}
        <div className="flex gap-1 mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                i + 1 <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="min-h-[400px]">
        {/* Step 1: Clarify - Task vs Project */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Krok 1: Upřesnění úkolu</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Co přesně potřebuji udělat? Je to jednoduchý úkol, nebo projekt s více kroky?
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Název úkolu *</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => updateData({ title: e.target.value })}
                  placeholder="Např. Poslat email klientovi"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description">Popis (volitelné)</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => updateData({ description: e.target.value })}
                  placeholder="Další detaily o úkolu..."
                  className="mt-1.5 min-h-[100px]"
                />
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isProject" className="text-base">Je to projekt?</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Projekt = více než jeden krok k dokončení
                    </p>
                  </div>
                  <Switch
                    id="isProject"
                    checked={data.isProject}
                    onCheckedChange={(checked) => updateData({ isProject: checked })}
                  />
                </div>

                {data.isProject && (
                  <div className="pl-4 border-l-2 border-blue-200 animate-in fade-in-50 duration-200">
                    <Label htmlFor="projectOutcome">Jaký je požadovaný výsledek projektu? *</Label>
                    <Textarea
                      id="projectOutcome"
                      value={data.projectOutcome}
                      onChange={(e) => updateData({ projectOutcome: e.target.value })}
                      placeholder="Např. Kompletní roční uzávěrka odevzdaná na finanční úřad"
                      className="mt-1.5"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Quick Action - 2 minute rule */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Zap className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900">Krok 2: 2 MINUTOVÉ PRAVIDLO</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Pokud úkol zabere méně než 2 minuty, udělejte ho HNED!
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center py-8">
                <Zap className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Dá se tento úkol udělat za MÉNĚ NEŽ 2 MINUTY?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Vše co můžeš udělat za méně než 2 minuty, udělej okamžitě bez plánování
                </p>

                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    variant={data.isQuickAction === true ? "default" : "outline"}
                    onClick={() => updateData({ isQuickAction: true })}
                    className="min-w-[140px]"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Ano - Udělám HNED
                  </Button>
                  <Button
                    size="lg"
                    variant={data.isQuickAction === false ? "default" : "outline"}
                    onClick={() => updateData({ isQuickAction: false })}
                    className="min-w-[140px]"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Ne - Pokračuj v plánování
                  </Button>
                </div>
              </div>

              {data.isQuickAction && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in-50 duration-200">
                  <p className="text-sm text-green-800">
                    <strong>GTD doporučení:</strong> Udělejte tento úkol hned! Čas strávený plánováním by byl delší než samotné provedení.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Delegate */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-purple-900">Krok 3: Delegování</h3>
                <p className="text-sm text-purple-700 mt-1">
                  Je někdo jiný vhodnější pro tento úkol?
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Delegovat na někoho jiného?</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Měl by tento úkol dělat někdo jiný?
                  </p>
                </div>
                <Switch
                  checked={data.shouldDelegate}
                  onCheckedChange={(checked) => updateData({
                    shouldDelegate: checked,
                    delegateTo: checked ? data.delegateTo : undefined,
                    delegationReason: checked ? data.delegationReason : undefined,
                  })}
                />
              </div>

              {data.shouldDelegate && (
                <div className="space-y-4 pl-4 border-l-2 border-purple-200 animate-in fade-in-50 duration-200">
                  <div>
                    <Label htmlFor="delegateTo">Delegovat komu? *</Label>
                    <Select
                      value={data.delegateTo}
                      onValueChange={(value) => updateData({ delegateTo: value })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Vyberte osobu..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="delegationReason">Důvod delegování (volitelné)</Label>
                    <Textarea
                      id="delegationReason"
                      value={data.delegationReason}
                      onChange={(e) => updateData({ delegationReason: e.target.value })}
                      placeholder="Např. Jana má lepší vztah s tímto klientem"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              )}

              {!data.shouldDelegate && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Poznámka:</strong> Úkol si ponechám a zpracuji ho sám.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Context & Energy */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <ListTodo className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900">Krok 4: Kontext a energie</h3>
                <p className="text-sm text-green-700 mt-1">
                  Kde a za jakých podmínek mohu tento úkol udělat?
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Contexts */}
              <div>
                <Label className="text-base mb-3 block">Kontext - Kde/jak budu úkol dělat?</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {GTD_CONTEXTS.map(context => (
                    <button
                      key={context.value}
                      onClick={() => toggleContext(context.value)}
                      className={cn(
                        "p-3 border rounded-lg text-sm font-medium transition-colors",
                        data.contexts.includes(context.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input"
                      )}
                    >
                      {context.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Můžete vybrat více kontextů
                </p>
              </div>

              {/* Energy Level */}
              <div>
                <Label className="text-base mb-3 block">Úroveň energie - Kolik energie potřebuji?</Label>
                <div className="space-y-2">
                  {ENERGY_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => updateData({ energyLevel: level.value })}
                      className={cn(
                        "w-full p-4 border rounded-lg text-left transition-colors",
                        data.energyLevel === level.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input"
                      )}
                    >
                      <div className="font-medium">{level.label}</div>
                      <div className={cn(
                        "text-sm mt-1",
                        data.energyLevel === level.value
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}>
                        {level.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Estimate */}
              <div>
                <Label className="text-base mb-3 block">Kolik času tento úkol zabere?</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  {TIME_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => updateData({ estimatedMinutes: preset.value })}
                      className={cn(
                        "p-3 border rounded-lg text-sm font-medium transition-colors",
                        data.estimatedMinutes === preset.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="customMinutes" className="text-sm whitespace-nowrap">Vlastní:</Label>
                  <Input
                    id="customMinutes"
                    type="number"
                    min="1"
                    value={data.estimatedMinutes || ''}
                    onChange={(e) => updateData({ estimatedMinutes: parseInt(e.target.value) || undefined })}
                    placeholder="Počet minut"
                    className="max-w-[200px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Billable */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <Clock className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-emerald-900">Krok 5: Fakturace klientovi</h3>
                <p className="text-sm text-emerald-700 mt-1">
                  Je tento úkol fakturovatelný klientovi?
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Fakturovatelný klientovi?</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Je to klientský projekt nebo interní práce?
                  </p>
                </div>
                <Switch
                  checked={data.isBillable}
                  onCheckedChange={(checked) => updateData({
                    isBillable: checked,
                    hourlyRate: checked ? data.hourlyRate : undefined,
                  })}
                />
              </div>

              {data.isBillable && (
                <div className="space-y-4 pl-4 border-l-2 border-emerald-200 animate-in fade-in-50 duration-200">
                  <div>
                    <Label htmlFor="hourlyRate">Hodinová sazba (Kč/hod) *</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min="0"
                      value={data.hourlyRate || ''}
                      onChange={(e) => updateData({ hourlyRate: parseInt(e.target.value) || undefined })}
                      placeholder="Např. 800"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-800">
                      <strong>Klientský projekt:</strong> Odpracovaný čas bude fakturován měsíčně, nemusíme čekat na konec projektu.
                    </p>
                  </div>
                </div>
              )}

              {!data.isBillable && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Interní práce:</strong> Čas nebude fakturován klientovi.
                  </p>
                </div>
              )}

              {/* Due date and assignment */}
              <div className="pt-4 border-t space-y-4">
                <div>
                  <Label htmlFor="dueDate">Termín dokončení (volitelné)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={data.dueDate || ''}
                    onChange={(e) => updateData({ dueDate: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                {!data.shouldDelegate && (
                  <div>
                    <Label htmlFor="assignedTo">Přiřadit komu? (volitelné)</Label>
                    <Select
                      value={data.assignedTo}
                      onValueChange={(value) => updateData({ assignedTo: value })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Ponechat nepřiřazené" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Break into Steps (only for projects) */}
        {currentStep === 6 && data.isProject && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <ListTodo className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-indigo-900">Krok 6: Rozdělit na dílčí kroky</h3>
                <p className="text-sm text-indigo-700 mt-1">
                  Jaké konkrétní kroky jsou potřeba k dokončení projektu?
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Dílčí úkoly projektu</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubtask}
                >
                  Přidat krok
                </Button>
              </div>

              {data.subtasks.length === 0 ? (
                <div className="p-8 border-2 border-dashed rounded-lg text-center">
                  <p className="text-muted-foreground mb-4">
                    Zatím nebyly přidány žádné dílčí úkoly
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSubtask}
                  >
                    Přidat první krok
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.subtasks.map((subtask, index) => (
                    <div key={subtask.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Krok {index + 1}</Label>
                          <Input
                            value={subtask.text}
                            onChange={(e) => updateSubtask(subtask.id, { text: e.target.value })}
                            placeholder="Název dílčího úkolu"
                            className="mt-1"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubtask(subtask.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Smazat
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Termín</Label>
                          <Input
                            type="date"
                            value={subtask.dueDate || ''}
                            onChange={(e) => updateSubtask(subtask.id, { dueDate: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Odhad (minuty)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={subtask.estimatedMinutes || ''}
                            onChange={(e) => updateSubtask(subtask.id, { estimatedMinutes: parseInt(e.target.value) || undefined })}
                            placeholder="60"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 1 ? onCancel : goBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Zrušit' : 'Zpět'}
        </Button>

        {currentStep < totalSteps ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={!canProceed()}
          >
            Další
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? 'Ukládám...' : 'Dokončit'}
            <CheckCircle2 className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )

  // Validation helper
  function canProceed(): boolean {
    switch (currentStep) {
      case 1:
        return data.title.trim().length > 0 && (!data.isProject || data.projectOutcome.trim().length > 0)
      case 2:
        return data.isQuickAction !== undefined
      case 3:
        return !data.shouldDelegate || (!!data.delegateTo)
      case 4:
        return data.contexts.length > 0 && !!data.energyLevel
      case 5:
        return !data.isBillable || (!!data.hourlyRate && data.hourlyRate > 0)
      case 6:
        return data.subtasks.length > 0 && data.subtasks.every(st => st.text.trim().length > 0)
      default:
        return true
    }
  }
}
