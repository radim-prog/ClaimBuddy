'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, CreditCard } from 'lucide-react'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { FirmSettings } from '@/components/firm/firm-settings'
import { FirmBilling } from '@/components/firm/firm-billing'

export default function FirmPage() {
  const { userRole } = useAccountantUser()
  const isAdmin = userRole === 'admin'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Moje firma</h1>
        <p className="text-sm text-muted-foreground">Správa účetní firmy a předplatného</p>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1.5" /> Nastavení
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="billing">
              <CreditCard className="h-4 w-4 mr-1.5" /> Předplatné
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="settings"><FirmSettings /></TabsContent>
        {isAdmin && <TabsContent value="billing"><FirmBilling /></TabsContent>}
      </Tabs>
    </div>
  )
}
