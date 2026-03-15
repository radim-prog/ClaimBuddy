'use client'

import { useState } from 'react'
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
        description: 'Přihlašovací údaje byly nastaveny.'
      })
      setCreated(true)
    } catch {
      toast.error('Chyba', { description: 'Něco se pokazilo' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader>
          <CardTitle className="font-display">První spuštění</CardTitle>
          <CardDescription>
            Vytvoř prvního administrátora
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {created ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 font-semibold font-display">
                Admin vytvořen!
              </div>
              <p className="text-sm text-muted-foreground">
                Přihlašovací údaje byly nastaveny. Změňte heslo po prvním přihlášení.
              </p>
              <button
                onClick={() => window.location.href = '/auth/login'}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Přejít na přihlášení
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Klikni pro vytvoření prvního admin účtu. Přihlašovací údaje budou zobrazeny po vytvoření.
              </p>
              <button
                onClick={createAdmin}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Vytvářím...' : 'Vytvořit admina'}
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
