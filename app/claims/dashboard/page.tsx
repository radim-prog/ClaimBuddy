'use client'

import { Shield, FolderOpen, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function ClaimsDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pojistné události</h1>
        <p className="text-muted-foreground mt-1">Přehled a správa pojistných událostí</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Celkem spisů</p>
              <p className="text-2xl font-bold mt-1">0</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aktivní</p>
              <p className="text-2xl font-bold mt-1">0</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Schváleno</p>
              <p className="text-2xl font-bold mt-1">0</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Čekají na doplnění</p>
              <p className="text-2xl font-bold mt-1">0</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      <div className="border border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold">Modul pojistných událostí</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          Správa pojistných událostí, komunikace s pojišťovnami, dokumentace a sledování plnění.
          Vytvořte první spis pro zahájení práce.
        </p>
      </div>
    </div>
  )
}
