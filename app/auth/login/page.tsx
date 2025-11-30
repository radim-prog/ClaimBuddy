'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { User, Briefcase } from 'lucide-react'
import { login } from './actions'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await login(formData)

      if (result?.error) {
        toast.error('Chyba přihlášení', {
          description: result.error,
        })
        setLoading(false)
      } else {
        toast.success('Přihlášení úspěšné!')
        // Redirect is handled by the action
      }
    } catch (error) {
      toast.error('Chyba přihlášení', {
        description: 'Něco se pokazilo. Zkuste to prosím znovu.',
      })
      setLoading(false)
    }
  }

  const handleDemoLogin = (role: 'client' | 'accountant') => {
    toast.success(`Demo přihlášení (${role === 'client' ? 'Klient' : 'Účetní'})`)
    if (role === 'accountant') {
      router.push('/accountant/dashboard')
    } else {
      router.push('/client/dashboard')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Přihlášení
        </CardTitle>
        <CardDescription>
          Zadejte své přihlašovací údaje nebo použijte demo přístup
        </CardDescription>
      </CardHeader>

      {/* Demo Mode - Quick Access */}
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-center">🎯 Demo režim - Rychlý přístup:</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleDemoLogin('client')}
              variant="outline"
              className="h-auto flex-col gap-2 py-4 border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <User className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-blue-700">Klient</span>
              <span className="text-xs text-muted-foreground">Karel Novák</span>
            </Button>
            <Button
              onClick={() => handleDemoLogin('accountant')}
              variant="outline"
              className="h-auto flex-col gap-2 py-4 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <Briefcase className="h-6 w-6 text-purple-600" />
              <span className="font-semibold text-purple-700">Účetní</span>
              <span className="text-xs text-muted-foreground">Jana Svobodová</span>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">
              Nebo se přihlaste účtem
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Jméno</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Radim"
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
            disabled={loading}
          >
            {loading ? 'Přihlašování...' : 'Přihlásit se'}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-center text-muted-foreground w-full">
          Uživatelské účty vytváří pouze administrátor
        </p>
      </CardFooter>
    </Card>
  )
}
