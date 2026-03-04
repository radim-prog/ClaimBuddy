'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { LogIn, ArrowRight } from 'lucide-react'
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
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <Card className="border border-border/60 shadow-soft-lg">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-soft">
            <span className="text-lg font-bold text-white font-display">U</span>
          </div>
          <CardTitle className="text-xl font-semibold text-foreground font-display">
            Přihlášení
          </CardTitle>
          <CardDescription>
            Zadejte své přihlašovací údaje
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Jméno</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Zadejte křestní jméno"
                required
                autoComplete="username"
                autoFocus
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Heslo</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Zadejte heslo"
                required
                autoComplete="current-password"
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold"
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

        <CardFooter className="flex-col gap-4">
          <div className="w-full border-t border-border pt-4">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Nebo přejděte na přihlašovací stránku:
            </p>
            <div className="flex gap-2">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full text-xs h-9 group">
                  Klientský portál
                  <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Link href="/ucetni" className="flex-1">
                <Button variant="outline" className="w-full text-xs h-9 group">
                  Portál pro účetní
                  <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
