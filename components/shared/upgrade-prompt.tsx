'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight } from 'lucide-react'

type UpgradePromptProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason?: string
  requiredTier?: string
  currentTier?: string
  portalType?: 'accountant' | 'client'
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Profi',
  enterprise: 'Business',
  basic: 'Basic',
  plus: 'Plus',
  premium: 'Premium',
}

export function UpgradePrompt({
  open,
  onOpenChange,
  reason,
  requiredTier,
  currentTier,
  portalType = 'accountant',
}: UpgradePromptProps) {
  const router = useRouter()

  const upgradeUrl = portalType === 'client'
    ? '/client/subscription'
    : '/accountant/firm?tab=subscription'

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push(upgradeUrl)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Vyšší tarif potřeba
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {reason || 'Tato funkce vyžaduje vyšší tarif.'}
          </p>

          {(currentTier || requiredTier) && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {currentTier && (
                <Badge variant="outline" className="text-xs">
                  {TIER_LABELS[currentTier] || currentTier}
                </Badge>
              )}
              {currentTier && requiredTier && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
              {requiredTier && (
                <Badge className="bg-amber-500 text-white text-xs">
                  {TIER_LABELS[requiredTier] || requiredTier}
                </Badge>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zavřít
          </Button>
          <Button onClick={handleUpgrade} className="bg-amber-500 hover:bg-amber-600 text-white">
            <Sparkles className="h-4 w-4 mr-2" />
            Upgradovat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook for handling 403 responses with upgrade prompt.
 * Returns { showUpgrade, upgradeProps, handleApiResponse }
 */
export function useUpgradePrompt(portalType: 'accountant' | 'client' = 'accountant') {
  const [upgradeState, setUpgradeState] = useState<{
    open: boolean
    reason?: string
    requiredTier?: string
    currentTier?: string
  }>({ open: false })

  const handleApiResponse = async (res: Response): Promise<boolean> => {
    if (res.status === 403) {
      try {
        const data = await res.json()
        if (data.requiredTier || data.reason?.includes('tarif')) {
          setUpgradeState({
            open: true,
            reason: data.error || data.reason,
            requiredTier: data.requiredTier,
            currentTier: data.currentTier,
          })
          return true // handled as upgrade prompt
        }
      } catch { /* not a JSON response */ }
    }
    return false // not an upgrade issue
  }

  const upgradeProps: UpgradePromptProps = {
    ...upgradeState,
    portalType,
    onOpenChange: (open) => setUpgradeState(prev => ({ ...prev, open })),
  }

  return { upgradeProps, handleApiResponse }
}
