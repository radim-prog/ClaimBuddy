'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export default function ClientSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nastavení</h1>
        <p className="text-muted-foreground">
          Spravujte své předvolby a nastavení účtu
        </p>
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
                <Label>Email připomínky</Label>
                <p className="text-sm text-muted-foreground">
                  Dostávejte emailové připomínky o chybějících dokladech
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS upozornění</Label>
                <p className="text-sm text-muted-foreground">
                  Dostávejte SMS upozornění 3 dny před termínem
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Měsíční souhrn</Label>
                <p className="text-sm text-muted-foreground">
                  Dostávejte měsíční souhrn vašeho účetnictví
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Předvolby uploadu */}
        <Card>
          <CardHeader>
            <CardTitle>Předvolby nahrávání</CardTitle>
            <CardDescription>
              Nastavte výchozí hodnoty pro nahrávání dokumentů
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-company">Výchozí firma</Label>
              <Input id="default-company" defaultValue="ABC s.r.o." disabled />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automaticky spustit OCR</Label>
                <p className="text-sm text-muted-foreground">
                  Automaticky rozpoznat text z nahraných dokumentů
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Uložit změny */}
        <div className="flex justify-end">
          <Button>Uložit změny</Button>
        </div>
      </div>
    </div>
  )
}
