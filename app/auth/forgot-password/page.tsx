'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { forgotPassword } from './actions'

function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const sent = searchParams.get('sent') === 'true'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await forgotPassword(formData)
      if (result?.error) {
        toast.error('Chyba', { description: result.error })
        setLoading(false)
      }
    } catch {
      // redirect throws -- this is expected on success
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/30 dark:via-background dark:to-blue-950/20 relative overflow-hidden px-4">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-purple-400/[0.07] blur-3xl" />
          <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full bg-blue-300/[0.06] blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zpět na přihlášení
          </Link>

          <div className="flex justify-center mb-8">
            <Logo size="lg" variant="purple" />
          </div>

          <Card className="border-2 border-purple-200/60 dark:border-purple-800/40 shadow-soft-lg">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-xl font-semibold text-foreground font-display mb-3">
                  Email odeslán
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                  Pokud u nás existuje účet s tímto emailem, odeslali jsme vám odkaz pro obnovení hesla.
                </p>
                <p className="text-muted-foreground text-xs">
                  Odkaz je platný 1 hodinu. Zkontrolujte i složku spam.
                </p>
              </div>

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
                Obnovení hesla
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Zadejte email a my vám pošleme odkaz pro obnovení hesla
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vas@email.cz"
                  required
                  autoFocus
                  className="h-11 border-purple-200 dark:border-purple-800/50 focus-visible:ring-purple-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 font-semibold bg-purple-600 hover:bg-purple-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  'Odesílání...'
                ) : (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Odeslat odkaz
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-purple-100 dark:border-purple-800/30">
              <p className="text-xs text-muted-foreground text-center">
                Vzpomněli jste si?{' '}
                <Link href="/auth/login" className="text-purple-600 dark:text-purple-400 hover:underline">
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

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
