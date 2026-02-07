'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Repeat,
  Calendar,
  Clock,
  Building2,
  Play,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  TASK_TEMPLATES,
  getTemplatePreview,
  getFrequencyLabel,
  generateAllTasks,
  getExistingTasksForPeriod,
  type TaskTemplate,
} from '@/lib/task-templates'
import { mockTasks } from '@/lib/mock-data'
import { toast } from 'sonner'

const monthNames = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
]

export default function TemplatesPage() {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const period = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

  // Check if tasks already exist for this period
  const existingCount = useMemo(() =>
    getExistingTasksForPeriod(mockTasks, period),
    [period]
  )

  // Get template previews (how many companies match each)
  const previews = useMemo(() => getTemplatePreview(), [])

  // Total tasks that would be generated
  const totalTasks = useMemo(() =>
    previews.reduce((sum, p) => {
      // Only count templates applicable this month
      const tpl = p.template
      if (tpl.frequency === 'quarterly' && !tpl.months?.includes(currentMonth)) return sum
      if (tpl.frequency === 'annual' && !tpl.months?.includes(currentMonth)) return sum
      return sum + p.matchingCompanies
    }, 0),
    [previews, currentMonth]
  )

  const handleGenerate = () => {
    setGenerating(true)
    // Simulate a short delay for UX
    setTimeout(() => {
      const newTasks = generateAllTasks(currentYear, currentMonth)
      // Add to mockTasks array (mutates the exported array)
      newTasks.forEach(t => {
        if (!mockTasks.find(existing => existing.id === t.id)) {
          mockTasks.push(t)
        }
      })
      setGenerating(false)
      setGenerated(true)
      toast.success(`Vygenerováno ${newTasks.length} úkolů pro ${monthNames[currentMonth - 1]} ${currentYear}`)
    }, 500)
  }

  const getFrequencyColor = (freq: string) => {
    switch (freq) {
      case 'monthly': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'quarterly': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      case 'annual': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const isApplicableThisMonth = (tpl: TaskTemplate) => {
    if (tpl.frequency === 'monthly') return true
    if (tpl.frequency === 'quarterly') return tpl.months?.includes(currentMonth) ?? false
    if (tpl.frequency === 'annual') return tpl.months?.includes(currentMonth) ?? false
    return false
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-purple-600" />
            Šablony opakujících se úkolů
          </CardTitle>
          <CardDescription>
            Šablony automaticky generují úkoly pro klienty na základě jejich vlastností (plátce DPH, zaměstnanci, právní forma).
            Klikněte na "Generovat úkoly" pro vytvoření úkolů aktuálního měsíce.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Aktuální měsíc: </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {monthNames[currentMonth - 1]} {currentYear}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Šablon: </span>
                <span className="font-bold text-gray-900 dark:text-white">{TASK_TEMPLATES.length}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Úkolů k vygenerování: </span>
                <span className="font-bold text-purple-600">{totalTasks}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(existingCount > 0 || generated) && (
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  {existingCount > 0 ? `${existingCount} úkolů existuje` : 'Vygenerováno'}
                </span>
              )}
              <Button
                onClick={handleGenerate}
                disabled={generating || (existingCount > 0 && generated)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generuji...
                  </>
                ) : existingCount > 0 ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Přegenerovat
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generovat úkoly pro {monthNames[currentMonth - 1]}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template List */}
      <div className="space-y-3">
        {previews.map(({ template, matchingCompanies }) => {
          const isExpanded = expandedTemplate === template.id
          const applicable = isApplicableThisMonth(template)

          return (
            <div
              key={template.id}
              className={`border rounded-lg bg-white dark:bg-gray-800 transition-all ${
                !applicable ? 'opacity-50' : ''
              }`}
            >
              {/* Template header */}
              <button
                onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge className={`${getFrequencyColor(template.frequency)} text-xs`}>
                    {getFrequencyLabel(template.frequency)}
                  </Badge>
                  <span className="font-medium text-gray-900 dark:text-white">{template.title}</span>
                  {!applicable && (
                    <span className="text-xs text-gray-400">(ne tento měsíc)</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Building2 className="h-4 w-4" />
                    <span>{matchingCompanies} firem</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{template.estimated_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>{template.due_day}.</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t dark:border-gray-700">
                  <div className="pt-3 space-y-2 text-sm">
                    <p className="text-gray-600 dark:text-gray-300">{template.description}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Frekvence</span>
                        <p className="font-medium text-gray-900 dark:text-white">{getFrequencyLabel(template.frequency)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Deadline</span>
                        <p className="font-medium text-gray-900 dark:text-white">{template.due_day}. den měsíce</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Odhadovaný čas</span>
                        <p className="font-medium text-gray-900 dark:text-white">{template.estimated_minutes} minut</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Fakturace</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {template.billing_type === 'tariff' ? 'Paušál' : template.billing_type === 'extra' ? 'Zvlášť' : 'Zdarma'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">Platí pro</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.applies_to.vat_payer && (
                          <Badge variant="outline" className="text-xs">Plátci DPH</Badge>
                        )}
                        {template.applies_to.vat_period === 'monthly' && (
                          <Badge variant="outline" className="text-xs">DPH měsíčně</Badge>
                        )}
                        {template.applies_to.vat_period === 'quarterly' && (
                          <Badge variant="outline" className="text-xs">DPH kvartálně</Badge>
                        )}
                        {template.applies_to.has_employees && (
                          <Badge variant="outline" className="text-xs">Se zaměstnanci</Badge>
                        )}
                        {template.applies_to.legal_form && (
                          <Badge variant="outline" className="text-xs">{template.applies_to.legal_form.join(', ')}</Badge>
                        )}
                        {template.applies_to.is_osvc && (
                          <Badge variant="outline" className="text-xs">OSVČ</Badge>
                        )}
                        {template.applies_to.status === 'active' && !template.applies_to.vat_payer && !template.applies_to.has_employees && !template.applies_to.legal_form && !template.applies_to.is_osvc && (
                          <Badge variant="outline" className="text-xs">Všechny aktivní firmy</Badge>
                        )}
                      </div>
                    </div>
                    {template.tags.length > 0 && (
                      <div className="flex gap-1 pt-1">
                        {template.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
