'use client'

import { useState, useEffect, useCallback } from 'react'
import { CapacityOverview } from '@/components/capacity/capacity-overview'
import { UserScheduleEditor } from '@/components/capacity/user-schedule-editor'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users } from 'lucide-react'
import type { UserCapacity } from '@/lib/types/project'

export default function CapacityPage() {
  const [capacities, setCapacities] = useState<UserCapacity[]>([])
  const [selectedUser, setSelectedUser] = useState<UserCapacity | null>(null)

  const fetchCapacities = useCallback(async () => {
    try {
      const res = await fetch('/api/accountant/capacity')
      const data = await res.json()
      setCapacities(data.capacities || [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchCapacities()
  }, [fetchCapacities])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-purple-600" />
        <h1 className="text-2xl font-bold">Kapacitní plánování</h1>
      </div>

      <CapacityOverview />

      {/* User capacity cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {capacities.map(cap => (
          <div
            key={cap.user_id}
            className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setSelectedUser(cap)}
          >
            <div className="font-medium">{cap.user_name}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {cap.weekly_hours_capacity}h/týden
              {cap.overrides.length > 0 && (
                <span className="ml-2 text-yellow-600">
                  {cap.overrides.length} plánovaných výjimek
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Úprava kapacity</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserScheduleEditor
              capacity={selectedUser}
              onUpdated={() => {
                fetchCapacities()
                setSelectedUser(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
