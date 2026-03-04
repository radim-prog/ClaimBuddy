'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

export default function AccountantProfilePage() {
  const { userName, userInitials } = useAccountantUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Profil</h1>
        <p className="text-muted-foreground">
          Spravujte sv\u00e9 osobn\u00ed \u00fadaje
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        {/* Avatar */}
        <Card className="rounded-xl shadow-soft">
          <CardContent className="flex flex-col items-center pt-6">
            <Avatar className="h-32 w-32 mb-4">
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-3xl">
                {userInitials || '..'}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              Zm\u011bnit foto
            </Button>
          </CardContent>
        </Card>

        {/* Osobn\u00ed \u00fadaje */}
        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Osobn\u00ed \u00fadaje</CardTitle>
            <CardDescription>
              Aktualizujte sv\u00e9 kontaktn\u00ed informace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Jm\u00e9no a p\u0159\u00edjmen\u00ed</Label>
                <Input id="name" defaultValue={userName || ''} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="jana@ucetni.cz" className="h-11" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" type="tel" defaultValue="+420 777 654 321" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ic">I\u010c (jako OSV\u010c)</Label>
                <Input id="ic" defaultValue="12345678" className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresa</Label>
              <Input id="address" defaultValue="Hlavn\u00ed 123, Praha 1, 110 00" className="h-11" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zm\u011bna hesla */}
      <Card className="rounded-xl shadow-soft">
        <CardHeader>
          <CardTitle className="font-display">Zm\u011bna hesla</CardTitle>
          <CardDescription>
            Aktualizujte sv\u00e9 p\u0159ihla\u0161ovac\u00ed heslo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Sou\u010dasn\u00e9 heslo</Label>
            <Input id="current-password" type="password" className="h-11" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nov\u00e9 heslo</Label>
              <Input id="new-password" type="password" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Potvrdit heslo</Label>
              <Input id="confirm-password" type="password" className="h-11" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ulo\u017eit zm\u011bny */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Zru\u0161it</Button>
        <Button>Ulo\u017eit zm\u011bny</Button>
      </div>
    </div>
  )
}
