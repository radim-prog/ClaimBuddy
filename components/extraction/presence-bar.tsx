'use client'

import { type PresenceUser } from '@/lib/hooks/use-extraction-presence'
import { cn } from '@/lib/utils'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
]

function getColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getPageLabel(page: string): string {
  switch (page) {
    case 'verify': return 'verifikace'
    case 'clients': return 'klienti'
    case 'settings': return 'nastavení'
    default: return page
  }
}

function getTimeSince(heartbeat: string): string {
  const diff = Math.floor((Date.now() - new Date(heartbeat).getTime()) / 1000)
  if (diff < 10) return 'právě teď'
  if (diff < 60) return `${diff}s`
  return `${Math.floor(diff / 60)}m`
}

interface PresenceBarProps {
  users: PresenceUser[]
  className?: string
}

export function PresenceBar({ users, className }: PresenceBarProps) {
  if (users.length === 0) return null

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center -space-x-1.5">
        {users.slice(0, 5).map(user => (
          <div
            key={user.user_id}
            title={`${user.user_name} (${getPageLabel(user.page)}) — ${getTimeSince(user.last_heartbeat)}`}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background',
              getColor(user.user_id)
            )}
          >
            {getInitials(user.user_name)}
          </div>
        ))}
      </div>
      {users.length <= 3 && (
        <span className="text-xs text-muted-foreground hidden lg:inline">
          {users.map(u => u.user_name.split(' ')[0]).join(', ')}
        </span>
      )}
      {users.length > 5 && (
        <span className="text-xs text-muted-foreground">+{users.length - 5}</span>
      )}
    </div>
  )
}

interface LockIndicatorProps {
  conflict: { userId: string; userName: string } | null
  viewers: PresenceUser[]
  onForceUnlock?: () => void
}

export function LockIndicator({ conflict, viewers, onForceUnlock }: LockIndicatorProps) {
  if (!conflict && viewers.length === 0) return null

  if (conflict) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2.5 flex items-center justify-between gap-2">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          <strong>{conflict.userName}</strong> tento doklad edituje. Vaše zmeny mohou byt prepsany.
        </p>
        {onForceUnlock && (
          <button
            onClick={onForceUnlock}
            className="text-xs font-medium text-yellow-700 dark:text-yellow-300 hover:underline whitespace-nowrap"
          >
            Prevzit
          </button>
        )}
      </div>
    )
  }

  // Other viewers (no conflict, just viewing same doc)
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      {viewers.map(v => v.user_name.split(' ')[0]).join(', ')}
      {viewers.length === 1 ? ' prohlizi' : ' prohlizeji'} tento doklad
    </div>
  )
}
