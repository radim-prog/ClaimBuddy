'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ScoringWizard } from '@/components/gtd/scoring-wizard'

type Phase = { title: string; description: string }
type ScoreResult = {
  score_money: number
  score_fire: number
  score_time: number
  score_distance: number
  score_personal: number
  total_score: number
  priority: 'high' | 'medium' | 'low'
}

const priorityConfig = {
  high: { label: 'Vysoká', color: 'bg-red-100 text-red-700' },
  medium: { label: 'Střední', color: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Nízká', color: 'bg-green-100 text-green-700' },
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>}>
      <NewProjectContent />
    </Suspense>
  )
}

function NewProjectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromTaskId = searchParams.get('from_task')

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [outcome, setOutcome] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])

  // Step 2
  const [phases, setPhases] = useState<Phase[]>([
    { title: '', description: '' },
  ])

  // Step 3
  const [dueDate, setDueDate] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')

  // Step 4 - R-Tasks Scoring
  const [scores, setScores] = useState<ScoreResult | null>(null)

  // Load companies + prefill from task
  useEffect(() => {
    fetch('/api/accountant/companies')
      .then(r => r.json())
      .then(data => setCompanies(data.companies || []))
      .catch(() => {})

    if (fromTaskId) {
      fetch(`/api/tasks/${fromTaskId}`)
        .then(r => r.json())
        .then(data => {
          if (data.task) {
            setTitle(data.task.title || '')
            setDescription(data.task.description || '')
            if (data.task.company_id) setCompanyId(data.task.company_id)
          }
        })
        .catch(() => {})
    }
  }, [fromTaskId])

  const addPhase = () => setPhases([...phases, { title: '', description: '' }])
  const removePhase = (i: number) => setPhases(phases.filter((_, idx) => idx !== i))
  const movePhase = (i: number, dir: -1 | 1) => {
    const next = [...phases]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setPhases(next)
  }

  const handleScoringComplete = (result: ScoreResult) => {
    setScores(result)
    setStep(5) // Auto-advance to summary
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const validPhases = phases.filter(p => p.title.trim())
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          outcome: outcome || undefined,
          company_id: companyId || undefined,
          due_date: dueDate || undefined,
          estimated_hours: estimatedHours ? Number(estimatedHours) : undefined,
          phases: validPhases.map(p => ({ title: p.title, description: p.description || undefined })),
          score_money: scores?.score_money,
          score_fire: scores?.score_fire,
          score_time: scores?.score_time,
          score_distance: scores?.score_distance,
          score_personal: scores?.score_personal,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success('Projekt vytvořen!')
      router.push(`/accountant/projects/${data.project.id}`)
    } catch {
      toast.error('Chyba při vytváření projektu')
    } finally {
      setSubmitting(false)
    }
  }

  const canNext = () => {
    if (step === 1) return title.trim().length > 0
    if (step === 2) return phases.some(p => p.title.trim())
    return true
  }

  const totalSteps = 5

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
        </Button>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(s => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s === step ? 'bg-purple-600 text-white' : s < step ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s < step ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>1. Základní informace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Název projektu *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Název projektu" autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium">Popis</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Co tento projekt zahrnuje?" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Cíl (outcome)</label>
              <Input value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="Jak poznáme, že je hotovo?" />
            </div>
            <div>
              <label className="text-sm font-medium">Firma</label>
              <select
                className="w-full rounded-md border border-input dark:border-gray-600 bg-background dark:bg-gray-800 dark:text-gray-200 px-3 py-2 text-sm"
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
              >
                <option value="">-- Bez firmy --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Fáze projektu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {phases.map((phase, i) => (
              <div key={i} className="flex gap-2 items-start p-3 rounded-lg border">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => movePhase(i, -1)} disabled={i === 0}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => movePhase(i, 1)} disabled={i === phases.length - 1}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={phase.title}
                    onChange={e => {
                      const next = [...phases]
                      next[i] = { ...next[i], title: e.target.value }
                      setPhases(next)
                    }}
                    placeholder={`Fáze ${i + 1}`}
                  />
                  <Input
                    value={phase.description}
                    onChange={e => {
                      const next = [...phases]
                      next[i] = { ...next[i], description: e.target.value }
                      setPhases(next)
                    }}
                    placeholder="Popis (volitelný)"
                    className="text-sm"
                  />
                </div>
                {phases.length > 1 && (
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removePhase(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" onClick={addPhase} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Přidat fázi
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Termín a odhad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Deadline</label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Odhadovaný čas (hodin)</label>
              <Input type="number" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} placeholder="např. 20" />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>4. Priorita (R-Tasks)</CardTitle>
          </CardHeader>
          <CardContent>
            {scores ? (
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold">{scores.total_score} / 12</div>
                <Badge className={`text-lg px-4 py-1 ${priorityConfig[scores.priority].color}`}>
                  Priorita: {priorityConfig[scores.priority].label}
                </Badge>
                <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground pt-4">
                  <div className="text-center"><span className="text-lg">💰</span><div className="font-medium">{scores.score_money}</div></div>
                  <div className="text-center"><span className="text-lg">🔥</span><div className="font-medium">{scores.score_fire}</div></div>
                  <div className="text-center"><span className="text-lg">⏰</span><div className="font-medium">{scores.score_time}</div></div>
                  <div className="text-center"><span className="text-lg">📍</span><div className="font-medium">{scores.score_distance}</div></div>
                  <div className="text-center"><span className="text-lg">❤️</span><div className="font-medium">{scores.score_personal}</div></div>
                </div>
                <Button variant="outline" onClick={() => setScores(null)} className="mt-4">
                  Změnit hodnocení
                </Button>
              </div>
            ) : (
              <ScoringWizard
                onComplete={handleScoringComplete}
                onCancel={() => {
                  // Skip scoring - use defaults
                  setStep(5)
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>5. Rekapitulace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">Název:</span>
              <p className="font-medium">{title}</p>
            </div>
            {outcome && (
              <div>
                <span className="text-sm text-muted-foreground">Cíl:</span>
                <p>{outcome}</p>
              </div>
            )}
            {phases.filter(p => p.title.trim()).length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Fáze:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {phases.filter(p => p.title.trim()).map((p, i) => (
                    <Badge key={i} variant="outline">{i + 1}. {p.title}</Badge>
                  ))}
                </div>
              </div>
            )}
            {dueDate && (
              <div>
                <span className="text-sm text-muted-foreground">Deadline:</span>
                <p>{new Date(dueDate).toLocaleDateString('cs-CZ')}</p>
              </div>
            )}
            {estimatedHours && (
              <div>
                <span className="text-sm text-muted-foreground">Odhad:</span>
                <p>{estimatedHours} hodin</p>
              </div>
            )}
            {scores && (
              <div>
                <span className="text-sm text-muted-foreground">Priorita:</span>
                <div className="mt-1">
                  <Badge className={`${priorityConfig[scores.priority].color} text-sm`}>
                    {scores.total_score}/12 • {priorityConfig[scores.priority].label}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
        </Button>
        {step < totalSteps ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
            {step === 4 && !scores ? 'Přeskočit' : 'Další'} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700">
            {submitting ? 'Vytvářím...' : 'Vytvořit projekt'}
          </Button>
        )}
      </div>
    </div>
  )
}
