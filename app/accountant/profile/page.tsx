'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function AccountantProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profil</h1>
        <p className="text-muted-foreground">
          Spravujte své osobní údaje
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        {/* Avatar */}
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <Avatar className="h-32 w-32 mb-4">
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-3xl">
                JS
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              Změnit foto
            </Button>
          </CardContent>
        </Card>

        {/* Osobní údaje */}
        <Card>
          <CardHeader>
            <CardTitle>Osobní údaje</CardTitle>
            <CardDescription>
              Aktualizujte své kontaktní informace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Jméno a příjmení</Label>
                <Input id="name" defaultValue="Jana Svobodová" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="jana@ucetni.cz" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" type="tel" defaultValue="+420 777 654 321" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ic">IČ (jako OSVČ)</Label>
                <Input id="ic" defaultValue="12345678" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresa</Label>
              <Input id="address" defaultValue="Hlavní 123, Praha 1, 110 00" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Změna hesla */}
      <Card>
        <CardHeader>
          <CardTitle>Změna hesla</CardTitle>
          <CardDescription>
            Aktualizujte své přihlašovací heslo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Současné heslo</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nové heslo</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Potvrdit heslo</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uložit změny */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Zrušit</Button>
        <Button>Uložit změny</Button>
      </div>
    </div>
  )
}
