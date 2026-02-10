'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  Flame,
  Clock,
  MapPin,
  Heart,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react'

type ScoreResult = {
  score_money: number
  score_fire: number
  score_time: number
  score_distance: number
  score_personal: number
  total_score: number
  priority: 'high' | 'medium' | 'low'
}

type ScoringWizardProps = {
  onComplete: (result: ScoreResult) => void
  onCancel?: () => void
}

const questions = [
  {
    key: 'score_money',
    title: 'Kolik to vydělá/ušetří?',
    icon: DollarSign,
    iconColor: 'text-green-600',
    options: [
      { value: 0, label: 'Nic / pod 5 000 Kč', emoji: '💸' },
      { value: 1, label: '5 000 – 15 000 Kč', emoji: '💰' },
      { value: 2, label: '15 000 – 50 000 Kč', emoji: '🤑' },
      { value: 3, label: 'Nad 50 000 Kč', emoji: '🏦' },
    ],
  },
  {
    key: 'score_fire',
    title: 'Jak je to naléhavé?',
    icon: Flame,
    iconColor: 'text-orange-600',
    options: [
      { value: 0, label: 'Klidně, čas je dost', emoji: '😌' },
      { value: 1, label: 'Normální, bez stresu', emoji: '🙂' },
      { value: 2, label: 'Hořící, brzy deadline', emoji: '🔥' },
      { value: 3, label: 'Kritické! Dnes/zítra!', emoji: '🚨' },
    ],
  },
  {
    key: 'score_time',
    title: 'Jak dlouho to zabere?',
    icon: Clock,
    iconColor: 'text-blue-600',
    options: [
      { value: 0, label: 'Den a více', emoji: '📅' },
      { value: 1, label: '2–4 hodiny', emoji: '⏰' },
      { value: 2, label: 'Pod 1 hodinu', emoji: '⚡' },
      { value: 3, label: 'Pod 30 minut', emoji: '🚀' },
    ],
  },
  {
    key: 'score_distance',
    title: 'Kde to udělat?',
    icon: MapPin,
    iconColor: 'text-purple-600',
    options: [
      { value: 0, label: 'Musím někam jet', emoji: '🚗' },
      { value: 1, label: 'Lokálně v kanceláři', emoji: '🏢' },
      { value: 2, label: 'U počítače, bez cestování', emoji: '💻' },
    ],
  },
  {
    key: 'score_personal',
    title: 'Jak se u toho cítím?',
    icon: Heart,
    iconColor: 'text-pink-600',
    options: [
      { value: 0, label: 'Nechce se mi, otravné', emoji: '😩' },
      { value: 1, label: 'OK, normální práce', emoji: '👍' },
    ],
  },
] as const

function getPriority(score: number): 'high' | 'medium' | 'low' {
  if (score >= 9) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
}

const priorityConfig = {
  high: { label: 'Vysoká', color: 'bg-red-100 text-red-700 border-red-200', barColor: 'bg-red-500' },
  medium: { label: 'Střední', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', barColor: 'bg-yellow-500' },
  low: { label: 'Nízká', color: 'bg-green-100 text-green-700 border-green-200', barColor: 'bg-green-500' },
}

export function ScoringWizard({ onComplete, onCancel }: ScoringWizardProps) {
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState(false)

  const currentQuestion = questions[step]

  const handleSelect = (value: number) => {
    const newScores = { ...scores, [currentQuestion.key]: value }
    setScores(newScores)

    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      setShowResult(true)
    }
  }

  const handleBack = () => {
    if (showResult) {
      setShowResult(false)
    } else if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleConfirm = () => {
    const total = Object.values(scores).reduce((sum, v) => sum + v, 0)
    onComplete({
      score_money: scores.score_money ?? 0,
      score_fire: scores.score_fire ?? 0,
      score_time: scores.score_time ?? 0,
      score_distance: scores.score_distance ?? 0,
      score_personal: scores.score_personal ?? 0,
      total_score: total,
      priority: getPriority(total),
    })
  }

  if (showResult) {
    const total = Object.values(scores).reduce((sum, v) => sum + v, 0)
    const priority = getPriority(total)
    const config = priorityConfig[priority]

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
          </Button>
          <span className="text-sm text-muted-foreground">Výsledek</span>
        </div>

        <Card className={`border-2 ${config.color}`}>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl font-bold">{total} / 12</div>
            <Badge className={`text-lg px-4 py-1 ${config.color}`}>
              Priorita: {config.label}
            </Badge>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${config.barColor}`}
                style={{ width: `${(total / 12) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground pt-2">
              {questions.map((q) => (
                <div key={q.key} className="text-center">
                  <q.icon className={`h-4 w-4 mx-auto mb-1 ${q.iconColor}`} />
                  <div className="font-medium">{scores[q.key] ?? 0}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleConfirm} className="w-full" size="lg">
          <CheckCircle className="h-5 w-5 mr-2" />
          Potvrdit hodnocení
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Zrušit
          </Button>
        )}
      </div>
    )
  }

  const Icon = currentQuestion.icon

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBack} disabled={step === 0 && !onCancel}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {step === 0 ? 'Zrušit' : 'Zpět'}
        </Button>
        <span className="text-sm text-muted-foreground">
          Otázka {step + 1} z {questions.length}
        </span>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < step ? 'bg-purple-600' : i === step ? 'bg-purple-400' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="text-center py-2">
        <Icon className={`h-8 w-8 mx-auto mb-2 ${currentQuestion.iconColor}`} />
        <h3 className="text-lg font-semibold">{currentQuestion.title}</h3>
      </div>

      <div className="grid gap-3">
        {currentQuestion.options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${
              scores[currentQuestion.key] === option.value
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <span className="text-xl mr-3">{option.emoji}</span>
            <span className="font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
