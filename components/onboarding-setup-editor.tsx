'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  GripVertical,
  Plus,
  Trash2,
  Check,
  X,
  Star,
} from 'lucide-react'
import {
  OnboardingStep,
  DEFAULT_ONBOARDING_STEPS,
  DefaultOnboardingStep,
} from '@/lib/types/onboarding'

interface SortableStepProps {
  step: OnboardingStep
  onRemove: (id: string) => void
}

function SortableStep({ step, onRemove }: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border rounded-lg ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{step.label}</span>
          {step.custom && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
              Vlastní
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {step.required ? (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" /> Povinný
            </span>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">Volitelný</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onRemove(step.id)}
        className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

interface OnboardingSetupEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSteps?: OnboardingStep[]
  onConfirm: (steps: OnboardingStep[]) => void
  title?: string
}

export function OnboardingSetupEditor({
  open,
  onOpenChange,
  initialSteps,
  onConfirm,
  title = 'Nastavení onboarding kroků',
}: OnboardingSetupEditorProps) {
  // Vybrané kroky
  const [selectedSteps, setSelectedSteps] = useState<OnboardingStep[]>(() => {
    if (initialSteps && initialSteps.length > 0) {
      return initialSteps.map((step, index) => ({ ...step, order: index }))
    }
    // Výchozí: všechny povinné kroky
    return DEFAULT_ONBOARDING_STEPS
      .filter(s => s.required)
      .map((step, index) => ({
        ...step,
        completed: false,
        order: index,
      }))
  })

  // Stav pro přidání vlastního kroku
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [customRequired, setCustomRequired] = useState(false)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Je krok vybraný?
  const isStepSelected = useCallback(
    (stepId: string) => selectedSteps.some(s => s.id === stepId),
    [selectedSteps]
  )

  // Přidat/odebrat předpřipravený krok
  const toggleStep = useCallback((step: DefaultOnboardingStep) => {
    setSelectedSteps(prev => {
      const existing = prev.find(s => s.id === step.id)
      if (existing) {
        return prev.filter(s => s.id !== step.id)
      } else {
        return [
          ...prev,
          {
            ...step,
            completed: false,
            order: prev.length,
          },
        ]
      }
    })
  }, [])

  // Odebrat krok
  const removeStep = useCallback((stepId: string) => {
    setSelectedSteps(prev => prev.filter(s => s.id !== stepId))
  }, [])

  // Přidat vlastní krok
  const addCustomStep = useCallback(() => {
    if (!customLabel.trim()) return

    const newStep: OnboardingStep = {
      id: `custom-${Date.now()}`,
      label: customLabel.trim(),
      required: customRequired,
      completed: false,
      custom: true,
      order: selectedSteps.length,
    }

    setSelectedSteps(prev => [...prev, newStep])
    setCustomLabel('')
    setCustomRequired(false)
    setShowAddCustom(false)
  }, [customLabel, customRequired, selectedSteps.length])

  // Drag end handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSelectedSteps(prev => {
        const oldIndex = prev.findIndex(s => s.id === active.id)
        const newIndex = prev.findIndex(s => s.id === over.id)
        const newArray = arrayMove(prev, oldIndex, newIndex)
        // Aktualizovat order
        return newArray.map((step, index) => ({ ...step, order: index }))
      })
    }
  }, [])

  // Potvrdit výběr
  const handleConfirm = useCallback(() => {
    onConfirm(selectedSteps)
    onOpenChange(false)
  }, [selectedSteps, onConfirm, onOpenChange])

  // Reset při otevření
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen && initialSteps) {
      setSelectedSteps(initialSteps.map((step, index) => ({ ...step, order: index })))
    } else if (isOpen) {
      setSelectedSteps(
        DEFAULT_ONBOARDING_STEPS
          .filter(s => s.required)
          .map((step, index) => ({
            ...step,
            completed: false,
            order: index,
          }))
      )
    }
    setShowAddCustom(false)
    setCustomLabel('')
    setCustomRequired(false)
    onOpenChange(isOpen)
  }, [initialSteps, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Levý panel - dostupné kroky */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Dostupné kroky
            </h3>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {DEFAULT_ONBOARDING_STEPS.map(step => {
                  const selected = isStepSelected(step.id)
                  return (
                    <div
                      key={step.id}
                      onClick={() => toggleStep(step)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selected
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleStep(step)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{step.label}</span>
                            {step.required && (
                              <Star className="h-3 w-3 text-red-500 fill-current" />
                            )}
                          </div>
                          {step.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Pravý panel - vybrané kroky */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Vybrané kroky ({selectedSteps.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCustom(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Vlastní krok
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {/* Přidání vlastního kroku */}
              {showAddCustom && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="space-y-2">
                    <Input
                      placeholder="Název kroku..."
                      value={customLabel}
                      onChange={e => setCustomLabel(e.target.value)}
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={customRequired}
                          onCheckedChange={(checked) => setCustomRequired(checked === true)}
                        />
                        Povinný krok
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAddCustom(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={addCustomStep}
                          disabled={!customLabel.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Seznam vybraných kroků s drag & drop */}
              {selectedSteps.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">Žádné kroky nevybrány</p>
                  <p className="text-xs mt-1">Vyberte kroky z levého panelu</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedSteps.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedSteps.map(step => (
                        <SortableStep
                          key={step.id}
                          step={step}
                          onRemove={removeStep}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedSteps.filter(s => s.required).length} povinných,{' '}
              {selectedSteps.filter(s => !s.required).length} volitelných
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Zrušit
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedSteps.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Potvrdit
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
