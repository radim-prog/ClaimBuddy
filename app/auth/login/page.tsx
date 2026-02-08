'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Lock, LogIn } from 'lucide-react'
import { login } from './actions'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      const result = await login(formData)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      // Successful login redirects via server action
    } catch {
      // redirect() throws NEXT_REDIRECT - this is expected behavior
      // If we get here with a real error, show it
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
          <Lock className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Účetní portál
        </CardTitle>
        <CardDescription>
          Zadejte své přihlašovací údaje
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Jméno</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Zadejte křestní jméno"
              required
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Zadejte heslo"
              required
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
            disabled={loading}
          >
            {loading ? (
              'Přihlašování...'
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Přihlásit se
              </span>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-xs text-center text-muted-foreground w-full">
          Přihlaste se křestním jménem (Karel, Jana, Petr, Marie nebo Radim)
        </p>
      </CardFooter>
    </Card>
  )
}
