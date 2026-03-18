'use client'

import { Calendar } from 'lucide-react'

export default function CalendarViewPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg mb-6">
        <Calendar className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold font-display mb-2">Kalendář</h2>
      <p className="text-muted-foreground max-w-md">
        Připravujeme — Google Calendar integrace
      </p>
    </div>
  )
}
