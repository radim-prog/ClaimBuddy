'use client'

import { useState, useEffect } from 'react'
import { Users, Network, Calendar } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { PeopleUsers } from '@/components/admin/people-users'
import { PeopleHierarchy } from '@/components/admin/people-hierarchy'
import { PeopleSubstitutions } from '@/components/admin/people-substitutions'

const sections = [
  { id: 'users', label: 'Uživatelé', icon: Users, Component: PeopleUsers },
  { id: 'hierarchy', label: 'Organizační struktura', icon: Network, Component: PeopleHierarchy },
  { id: 'substitutions', label: 'Zastupování', icon: Calendar, Component: PeopleSubstitutions },
] as const

type QuickStats = {
  totalUsers: number
  onlineUsers: number
  monthHours: number
  activeSubstitutions: number
}

export default function PeoplePage() {
  const [expanded, setExpanded] = useState('users')
  const [stats, setStats] = useState<QuickStats>({
    totalUsers: 0,
    onlineUsers: 0,
    monthHours: 0,
    activeSubstitutions: 0,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/accountant/admin/stats').then(r => r.ok ? r.json() : null),
      fetch('/api/accountant/users').then(r => r.ok ? r.json() : null),
      fetch('/api/accountant/admin/substitutions').then(r => r.ok ? r.json() : null),
    ]).then(([adminStats, usersData, subsData]) => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      const users = usersData?.users ?? []
      const onlineCount = users.filter((u: any) => u.last_login_at && u.last_login_at >= twoHoursAgo).length
      const activeRules = (subsData?.rules ?? []).filter((s: any) => s.is_active).length

      setStats({
        totalUsers: adminStats?.users?.total ?? users.length,
        onlineUsers: onlineCount,
        monthHours: adminStats?.time_logs?.month_hours ?? 0,
        activeSubstitutions: activeRules,
      })
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      {/* Compact stat row */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>{stats.totalUsers} lidí</span>
        <span className="text-green-600">{stats.onlineUsers} online</span>
        <span>{stats.monthHours}h měsíc</span>
        <span>{stats.activeSubstitutions} {stats.activeSubstitutions === 1 ? 'zástup' : 'zástupů'}</span>
      </div>

      {/* Accordion sections */}
      <div className="space-y-2">
        {sections.map(({ id, label, icon, Component }) => (
          <CollapsibleSection
            key={id}
            id={id}
            label={label}
            icon={icon}
            expanded={expanded === id}
            onToggle={() => setExpanded(expanded === id ? '' : id)}
          >
            <Component />
          </CollapsibleSection>
        ))}
      </div>
    </div>
  )
}
