'use client'

import { useState, useEffect, useCallback } from 'react'
import { CapacityOverview } from '@/components/capacity/capacity-overview'
import { UserScheduleEditor } from '@/components/capacity/user-schedule-editor'
import type { UserCapacity } from '@/lib/types/project'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function PeopleCapacity() {
  const [capacities, setCapacities] = useState<UserCapacity[]>([])
  const [selectedCapUser, setSelectedCapUser] = useState<UserCapacity | null>(null)

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
      <CapacityOverview />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {capacities.map(cap => (
          <div
            key={cap.user_id}
            className="border rounded-xl p-4 cursor-pointer hover:shadow-soft-md hover:-translate-y-0.5 transition-all"
            onClick={() => setSelectedCapUser(cap)}
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

      <Dialog open={!!selectedCapUser} onOpenChange={(open) => !open && setSelectedCapUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Úprava kapacity</DialogTitle>
          </DialogHeader>
          {selectedCapUser && (
            <UserScheduleEditor
              capacity={selectedCapUser}
              onUpdated={() => {
                fetchCapacities()
                setSelectedCapUser(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
