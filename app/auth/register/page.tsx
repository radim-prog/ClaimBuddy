'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { register } from './actions'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await register(formData)

      if (result?.error) {
        toast.error('Chyba registrace', {
          description: result.error,
        })
        setLoading(false)
      }
    } catch {
      toast.error('Chyba registrace', {
        description: 'Něco se pokazilo. Zkuste to prosím znovu.',
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-background dark:to-purple-950/20 relative overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-blue-400/[0.07] blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full bg-purple-300/[0.06] blur-3xl" />
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

        {/* Register card */}
        <Card className="border-2 border-blue-200/60 dark:border-blue-800/40 shadow-soft-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-xl font-semibold text-foreground font-display">
                Registrace
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Vytvořte si nový účet
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Jméno</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jan Novák"
                  required
                  autoFocus
                  className="h-11 border-blue-200 dark:border-blue-800/50 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vas@email.cz"
                  required
                  className="h-11 border-blue-200 dark:border-blue-800/50 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Heslo</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 8 znaků"
                  required
                  minLength={8}
                  className="h-11 border-blue-200 dark:border-blue-800/50 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Potvrdit heslo</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Zopakujte heslo"
                  required
                  minLength={8}
                  className="h-11 border-blue-200 dark:border-blue-800/50 focus-visible:ring-blue-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  'Registruji...'
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Zaregistrovat se
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-blue-100 dark:border-blue-800/30">
              <p className="text-xs text-muted-foreground text-center">
                Již máte účet?{' '}
                <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Přihlaste se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
