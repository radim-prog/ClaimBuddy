'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)

  const createAdmin = async () => {
    console.log('🚀 createAdmin called')
    setLoading(true)

    try {
      console.log('📡 Fetching /api/setup/first-admin...')
      const res = await fetch('/api/setup/first-admin', {
        method: 'POST'
      })

      const data = await res.json()
      console.log('📦 Response:', { status: res.status, data })

      if (!res.ok) {
        console.error('❌ Error response:', data.error)
        toast.error('Chyba', { description: data.error })
        setLoading(false)
        return
      }

      console.log('✅ Admin created successfully')
      toast.success('Admin vytvořen!', {
        description: 'Můžeš se přihlásit: Radim / admin'
      })
      setCreated(true)
    } catch (error) {
      console.error('💥 Exception:', error)
      toast.error('Chyba', { description: 'Něco se pokazilo' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
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
              <button
                onClick={() => window.location.href = '/auth/login'}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
              >
                Přejít na přihlášení
              </button>
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
              <button
                onClick={createAdmin}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
