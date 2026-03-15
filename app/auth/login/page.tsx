'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react'
import { login } from './actions'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await login(formData)
      if (result?.error) {
        toast.error('Chyba přihlášení', { description: result.error })
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/30 dark:via-background dark:to-blue-950/20 relative overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-purple-400/[0.07] blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full bg-blue-300/[0.06] blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zpět na hlavní stránku
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" variant="purple" />
        </div>

        {/* Login card */}
        <Card className="border-2 border-purple-200/60 dark:border-purple-800/40 shadow-soft-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-xl font-semibold text-foreground font-display">
                Přihlášení
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Klientský i účetnický portál — jeden login
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Uživatelské jméno
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Vaše jméno"
                  required
                  autoFocus
                  autoComplete="username"
                  className="h-11 border-purple-200 dark:border-purple-800/50 focus-visible:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Heslo
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Zadejte heslo"
                    required
                    autoComplete="current-password"
                    className="h-11 pr-10 border-purple-200 dark:border-purple-800/50 focus-visible:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 font-semibold bg-purple-600 hover:bg-purple-700 text-white"
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

            <div className="mt-8 pt-6 border-t border-purple-100 dark:border-purple-800/30">
              <p className="text-xs text-muted-foreground text-center">
                Nemáte účet? Kontaktujte svého účetního nebo{' '}
                <Link href="/#pricing" className="text-purple-600 dark:text-purple-400 hover:underline">
                  se podívejte na ceník
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
