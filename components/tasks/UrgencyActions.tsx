'use client'

import { useState } from 'react'
import type { Task } from '@/lib/types/tasks'
import { urgeTask, escalateTask, shouldEscalate, needsUrgency, URGENCY_CONFIG } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Bell, ArrowUpCircle, AlertTriangle, Phone, Mail, MessageSquare, UserCheck, RotateCcw, Ban, ThumbsDown } from 'lucide-react'
import { toast } from 'sonner'

interface UrgencyActionsProps {
  task: Task
  onTaskUpdate?: (updatedTask: Task) => void
  managerId?: string
  compact?: boolean
}

/**
 * Akční tlačítka pro urgování a eskalaci úkolu
 */
export function UrgencyActions({
  task,
  onTaskUpdate,
  managerId = 'user-3-manager',
  compact = false,
}: UrgencyActionsProps) {
  const [showEscalateDialog, setShowEscalateDialog] = useState(false)
  const [escalationReason, setEscalationReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const canUrge = needsUrgency(task) || (task.status === 'waiting_for' || task.status === 'waiting_client')
  const shouldShowEscalate = shouldEscalate(task)
  const isEscalated = !!task.escalated_to

  const handleUrge = async () => {
    setIsLoading(true)
    try {
      const updatedTask = urgeTask(task)
      onTaskUpdate?.(updatedTask)

      toast.success(`Klient urgován (${updatedTask.urgency_count}×)`, {
        description: 'Urgence byla zaznamenána',
      })

      // Pokud dosáhl limitu, upozornit
      if (updatedTask.urgency_count && updatedTask.urgency_count >= URGENCY_CONFIG.MAX_URGENCIES_BEFORE_ESCALATION) {
        toast.warning('Dosažen limit urgencí', {
          description: 'Doporučujeme eskalovat na manažera',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEscalate = async () => {
    if (!escalationReason.trim()) {
      toast.error('Zadejte důvod eskalace')
      return
    }

    setIsLoading(true)
    try {
      const updatedTask = escalateTask(task, managerId, escalationReason)
      onTaskUpdate?.(updatedTask)

      toast.success('Úkol eskalován na manažera', {
        description: 'Manažer bude informován',
      })

      setShowEscalateDialog(false)
      setEscalationReason('')
    } finally {
      setIsLoading(false)
    }
  }

  if (isEscalated) {
    return (
      <div className="flex items-center gap-2 text-purple-600">
        <ArrowUpCircle size={16} />
        <span className="text-sm">Eskalováno</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {canUrge && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUrge}
            disabled={isLoading}
            title="Urgovat klienta"
          >
            <Bell size={14} />
          </Button>
        )}
        {shouldShowEscalate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEscalateDialog(true)}
            className="text-red-600 hover:text-red-700"
            title="Eskalovat na manažera"
          >
            <ArrowUpCircle size={14} />
          </Button>
        )}

        <EscalateDialog
          open={showEscalateDialog}
          onOpenChange={setShowEscalateDialog}
          task={task}
          reason={escalationReason}
          onReasonChange={setEscalationReason}
          onConfirm={handleEscalate}
          isLoading={isLoading}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {canUrge && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUrge}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Phone size={14} />
              Zavolat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUrge}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Mail size={14} />
              Poslat email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUrge}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <MessageSquare size={14} />
              SMS
            </Button>
          </>
        )}
      </div>

      {shouldShowEscalate && (
        <div className="pt-2 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowEscalateDialog(true)}
            className="flex items-center gap-2"
          >
            <ArrowUpCircle size={14} />
            Eskalovat na manažera
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Urgováno {task.urgency_count}× bez odezvy
          </p>
        </div>
      )}

      {!canUrge && !shouldShowEscalate && task.urgency_count && task.urgency_count > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <Bell size={14} className="inline mr-1" />
          Urgováno {task.urgency_count}× - počkejte min. {URGENCY_CONFIG.DAYS_BETWEEN_URGENCIES} dny
        </p>
      )}

      <EscalateDialog
        open={showEscalateDialog}
        onOpenChange={setShowEscalateDialog}
        task={task}
        reason={escalationReason}
        onReasonChange={setEscalationReason}
        onConfirm={handleEscalate}
        isLoading={isLoading}
      />
    </div>
  )
}

interface EscalateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  reason: string
  onReasonChange: (reason: string) => void
  onConfirm: () => void
  isLoading: boolean
}

function EscalateDialog({
  open,
  onOpenChange,
  task,
  reason,
  onReasonChange,
  onConfirm,
  isLoading,
}: EscalateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Eskalovat na manažera
          </DialogTitle>
          <DialogDescription>
            Úkol bude předán manažerovi k řešení.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
            <p className="font-medium">{task.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{task.company_name}</p>
            {task.urgency_count && (
              <p className="text-sm text-amber-600 mt-1">
                Urgováno {task.urgency_count}×
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="escalation-reason">Důvod eskalace *</Label>
            <Textarea
              id="escalation-reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Proč eskalujete tento úkol? (např. Klient nereaguje na opakované výzvy...)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? 'Eskaluji...' : 'Eskalovat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Widget pro rychlé akce s urgencí v seznamu
 */
export function QuickUrgencyButton({
  task,
  onTaskUpdate,
}: {
  task: Task
  onTaskUpdate?: (updatedTask: Task) => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleQuickUrge = async () => {
    setIsLoading(true)
    try {
      const updatedTask = urgeTask(task)
      onTaskUpdate?.(updatedTask)
      toast.success(`Urgováno (${updatedTask.urgency_count}×)`)
    } finally {
      setIsLoading(false)
    }
  }

  if (task.escalated_to) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        handleQuickUrge()
      }}
      disabled={isLoading}
      className="h-6 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
    >
      <Bell size={12} className="mr-1" />
      Urgovat
    </Button>
  )
}

/**
 * Manažerské akce pro eskalované úkoly
 */
interface ManagerActionsProps {
  task: Task
  onTaskUpdate?: (updatedTask: Task) => void
  currentUserId?: string
}

export function ManagerActions({
  task,
  onTaskUpdate,
  currentUserId = 'user-3-manager',
}: ManagerActionsProps) {
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [showMarkBadDialog, setShowMarkBadDialog] = useState(false)
  const [returnInstructions, setReturnInstructions] = useState('')
  const [badClientReason, setBadClientReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Only show if task is escalated to current user
  if (task.escalated_to !== currentUserId) {
    return null
  }

  const handleTakeOver = async () => {
    setIsLoading(true)
    try {
      const updatedTask: Task = {
        ...task,
        assigned_to: currentUserId,
        assigned_to_name: 'Manažer', // In real app, get from user data
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      }
      onTaskUpdate?.(updatedTask)
      toast.success('Úkol převzat', {
        description: 'Úkol je nyní přiřazen vám',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturnToAccountant = async () => {
    if (!returnInstructions.trim()) {
      toast.error('Zadejte instrukce pro účetního')
      return
    }

    setIsLoading(true)
    try {
      const updatedTask: Task = {
        ...task,
        escalated_to: undefined,
        escalated_at: undefined,
        escalation_reason: undefined,
        status: 'accepted',
        // Add instructions as a note (in real app, this would be a proper notes system)
        description: task.description + `\n\n---\n**Instrukce od manažera:**\n${returnInstructions}`,
        updated_at: new Date().toISOString(),
      }
      onTaskUpdate?.(updatedTask)
      toast.success('Úkol vrácen účetnímu', {
        description: 'Účetní bude informován',
      })
      setShowReturnDialog(false)
      setReturnInstructions('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkClientBad = async () => {
    if (!badClientReason.trim()) {
      toast.error('Zadejte důvod')
      return
    }

    setIsLoading(true)
    try {
      // Mark task as cancelled due to bad client
      const updatedTask: Task = {
        ...task,
        status: 'cancelled',
        escalated_to: undefined,
        escalation_reason: `BEZNADĚJNÝ KLIENT: ${badClientReason}`,
        updated_at: new Date().toISOString(),
      }
      onTaskUpdate?.(updatedTask)

      toast.warning('Klient označen jako beznadějný', {
        description: 'Úkol byl zrušen, klient bude označen v systému',
      })
      setShowMarkBadDialog(false)
      setBadClientReason('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Escalation info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-purple-700 font-medium mb-1">
          <ArrowUpCircle size={16} />
          Eskalováno na vás
        </div>
        {task.escalation_reason && (
          <p className="text-sm text-purple-600">
            Důvod: {task.escalation_reason}
          </p>
        )}
        {task.escalated_at && (
          <p className="text-xs text-purple-500 mt-1">
            {new Date(task.escalated_at).toLocaleDateString('cs-CZ')}
          </p>
        )}
      </div>

      {/* Manager actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleTakeOver}
          disabled={isLoading}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
        >
          <UserCheck size={14} />
          Převzít úkol
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReturnDialog(true)}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RotateCcw size={14} />
          Vrátit účetnímu
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMarkBadDialog(true)}
          disabled={isLoading}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
        >
          <ThumbsDown size={14} />
          Beznadějný klient
        </Button>
      </div>

      {/* Return to accountant dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="text-blue-500" size={20} />
              Vrátit účetnímu
            </DialogTitle>
            <DialogDescription>
              Úkol bude vrácen původnímu účetnímu s vašimi instrukcemi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{task.company_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Původně přiřazeno: {task.assigned_to_name}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="return-instructions">Instrukce pro účetního *</Label>
              <Textarea
                id="return-instructions"
                value={returnInstructions}
                onChange={(e) => setReturnInstructions(e.target.value)}
                placeholder="Jak má účetní postupovat dále? (např. Zkuste kontaktovat jednatele přímo...)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              Zrušit
            </Button>
            <Button
              onClick={handleReturnToAccountant}
              disabled={isLoading || !returnInstructions.trim()}
            >
              {isLoading ? 'Vracím...' : 'Vrátit s instrukcemi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark client as bad dialog */}
      <Dialog open={showMarkBadDialog} onOpenChange={setShowMarkBadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="text-red-500" size={20} />
              Označit klienta jako beznadějného
            </DialogTitle>
            <DialogDescription>
              Tato akce označí klienta jako nespolupracujícího a zruší úkol.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="font-medium text-red-700">{task.company_name}</p>
              <p className="text-sm text-red-600 mt-1">
                Urgováno {task.urgency_count}× bez odezvy
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bad-client-reason">Důvod *</Label>
              <Textarea
                id="bad-client-reason"
                value={badClientReason}
                onChange={(e) => setBadClientReason(e.target.value)}
                placeholder="Popište důvod (např. Klient opakovaně ignoruje výzvy, nereaguje na telefon ani email...)"
                rows={3}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-700">
              <AlertTriangle size={16} className="inline mr-1" />
              Tato akce je nevratná. Klient bude označen v systému a spolupráce může být ukončena.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkBadDialog(false)}>
              Zrušit
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkClientBad}
              disabled={isLoading || !badClientReason.trim()}
            >
              {isLoading ? 'Označuji...' : 'Označit jako beznadějného'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
