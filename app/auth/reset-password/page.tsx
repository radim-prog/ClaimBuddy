'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { ArrowLeft, KeyRound } from 'lucide-react'

function ResetPasswordForm() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password.length < 8) {
      toast.error('Chyba', { description: 'Heslo musí mít alespoň 8 znaků' })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      toast.error('Chyba', { description: 'Hesla se neshodují' })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Heslo změněno', {
          description: 'Nyní se můžete přihlásit s novým heslem.',
        })
        router.push('/auth/login?reset=true')
      } else {
        toast.error('Chyba', {
          description: data.error || 'Nepodařilo se změnit heslo.',
        })
        setLoading(false)
      }
    } catch {
      toast.error('Chyba', {
        description: 'Něco se pokazilo. Zkuste to prosím znovu.',
      })
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/30 dark:via-background dark:to-blue-950/20 relative overflow-hidden px-4">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-purple-400/[0.07] blur-3xl" />
          <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full bg-blue-300/[0.06] blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo size="lg" variant="purple" />
          </div>

          <Card className="border-2 border-red-200/60 dark:border-red-800/40 shadow-soft-lg">
            <CardContent className="p-8 text-center">
              <h1 className="text-xl font-semibold text-foreground font-display mb-3">
                Neplatný odkaz
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                Odkaz pro obnovení hesla je neplatný nebo chybí token.
              </p>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                Požádat o nový odkaz
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zpět na přihlášení
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" variant="purple" />
        </div>

        {/* Card */}
        <Card className="border-2 border-purple-200/60 dark:border-purple-800/40 shadow-soft-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-xl font-semibold text-foreground font-display">
                Nové heslo
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Zadejte nové heslo pro váš účet
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Nové heslo</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 8 znaků"
                  required
                  minLength={8}
                  autoFocus
                  className="h-11 border-purple-200 dark:border-purple-800/50 focus-visible:ring-purple-500"
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
                  className="h-11 border-purple-200 dark:border-purple-800/50 focus-visible:ring-purple-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 font-semibold bg-purple-600 hover:bg-purple-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  'Ukládání...'
                ) : (
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Nastavit nové heslo
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-purple-100 dark:border-purple-800/30">
              <p className="text-xs text-muted-foreground text-center">
                <Link href="/auth/login" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Zpět na přihlášení
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
