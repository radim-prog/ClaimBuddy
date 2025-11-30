'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)

  const createAdmin = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/setup/first-admin', {
        method: 'POST'
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error('Chyba', { description: data.error })
        setLoading(false)
        return
      }

      toast.success('Admin vytvořen!', {
        description: 'Můžeš se přihlásit: Radim / admin'
      })
      setCreated(true)
    } catch (error) {
      toast.error('Chyba', { description: 'Něco se pokazilo' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🚀 První spuštění</CardTitle>
          <CardDescription>
            Vytvoř prvního administrátora
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {created ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 font-semibold">
                ✅ Admin vytvořen!
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-sm">
                <div className="font-mono">
                  <div><strong>Jméno:</strong> Radim</div>
                  <div><strong>Heslo:</strong> admin</div>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = '/auth/login'}
                className="w-full"
              >
                Přejít na přihlášení
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Klikni pro vytvoření prvního admin účtu:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg text-sm">
                <div className="font-mono">
                  <div><strong>Jméno:</strong> Radim</div>
                  <div><strong>Heslo:</strong> admin</div>
                  <div className="text-xs text-red-600 mt-2">
                    ⚠️ Změň heslo po prvním přihlášení!
                  </div>
                </div>
              </div>
              <Button
                onClick={createAdmin}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Vytvářím...' : 'Vytvořit admina'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
