'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DollarSign, Settings as SettingsIcon } from 'lucide-react'
import Link from 'next/link'

export default function AccountantSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'pricing'>('general')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nastavení</h1>
        <p className="text-muted-foreground">
          Spravujte své předvolby a nastavení účtu
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Obecné nastavení
          </div>
        </button>
        <Link
          href="/accountant/settings/pricing"
          className="px-4 py-2 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Ceník a Sazby
          </div>
        </Link>
      </div>

      <div className="grid gap-6">
        {/* Notifikace */}
        <Card>
          <CardHeader>
            <CardTitle>Notifikace</CardTitle>
            <CardDescription>
              Nastavte jak chcete dostávat upozornění
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email notifikace</Label>
                <p className="text-sm text-muted-foreground">
                  Dostávejte emailové upozornění o nových dokumentech
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS notifikace</Label>
                <p className="text-sm text-muted-foreground">
                  Dostávejte SMS upozornění o urgentních záležitostech
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Výchozí nastavení */}
        <Card>
          <CardHeader>
            <CardTitle>Výchozí nastavení</CardTitle>
            <CardDescription>
              Nastavte výchozí hodnoty pro nové klienty
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-vat">Výchozí sazba DPH (%)</Label>
              <Input id="default-vat" type="number" defaultValue="21" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-days">Počet dní před urgováním</Label>
              <Input id="reminder-days" type="number" defaultValue="7" />
            </div>
          </CardContent>
        </Card>

        {/* Uložit změny */}
        <div className="flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Uložit změny</Button>
        </div>
      </div>
    </div>
  )
}
