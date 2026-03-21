'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { ArrowLeft, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function CancelDeletionPage() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<'success' | 'error' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/client/account/cancel-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Neplatný token')
      }

      setResult('success')
      toast.success('Účet byl obnoven')
    } catch (err) {
      setResult('error')
      toast.error(err instanceof Error ? err.message : 'Chyba při rušení smazání')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-background dark:to-purple-950/20 relative overflow-hidden px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-blue-400/[0.07] blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full bg-purple-300/[0.06] blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zpět na hlavní stránku
        </Link>

        <div className="flex justify-center mb-8">
          <Logo size="lg" variant="purple" />
        </div>

        <Card className="border-2 border-blue-200/60 dark:border-blue-800/40 shadow-soft-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <h1 className="text-xl font-semibold text-foreground font-display">
                Zrušit smazání účtu
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Zadejte kód, který jste obdrželi při žádosti o smazání
              </p>
            </div>

            {result === 'success' ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                <p className="font-medium text-green-700 dark:text-green-400">
                  Váš účet byl úspěšně obnoven!
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/login">Přihlásit se</Link>
                </Button>
              </div>
            ) : result === 'error' ? (
              <div className="text-center space-y-4">
                <XCircle className="h-12 w-12 mx-auto text-red-500" />
                <p className="font-medium text-red-700 dark:text-red-400">
                  Neplatný nebo expirovaný kód
                </p>
                <Button onClick={() => setResult(null)} variant="outline" className="w-full">
                  Zkusit znovu
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-sm font-medium">Kód pro zrušení</Label>
                  <Input
                    id="token"
                    name="token"
                    type="text"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    required
                    autoFocus
                    className="h-11 font-mono text-sm border-blue-200 dark:border-blue-800/50 focus-visible:ring-blue-500"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading || !token.trim()}
                >
                  {loading ? 'Zpracovávám...' : 'Zrušit smazání účtu'}
                </Button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-blue-100 dark:border-blue-800/30">
              <p className="text-xs text-muted-foreground text-center">
                Potřebujete pomoc?{' '}
                <a href="mailto:podpora@zajcon.cz" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Kontaktujte podporu
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
