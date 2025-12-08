'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export default function AccountantSettingsPage() {
  return (
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
          <div className="space-y-2">
            <Label htmlFor="closure-deadline">Výchozí deadline pro měsíční uzávěrky</Label>
            <Input id="closure-deadline" type="number" defaultValue="15" placeholder="15. den v měsíci" />
            <p className="text-xs text-muted-foreground">Den v měsíci kdy musí být uzávěrka hotová</p>
          </div>
        </CardContent>
      </Card>

      {/* Automatizace */}
      <Card>
        <CardHeader>
          <CardTitle>Automatizace</CardTitle>
          <CardDescription>
            Automatické připomínky a upozornění
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatické připomínky klientům</Label>
              <p className="text-sm text-muted-foreground">
                Posílat klientům automatické připomínky před deadlinem
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatické schvalování dokumentů</Label>
              <p className="text-sm text-muted-foreground">
                Automaticky schválit dokumenty které prošly kontrolou AI
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Uložit změny */}
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Uložit změny</Button>
      </div>
    </div>
  )
}
