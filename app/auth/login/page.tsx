'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'
import {
  Eye, EyeOff, LogIn, ArrowLeft, Calculator, Briefcase,
} from 'lucide-react'
import { login } from './actions'

type Portal = 'accountant' | 'client'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [portal, setPortal] = useState<Portal>('accountant')
  const searchParams = useSearchParams()

  useEffect(() => {
    const verified = searchParams.get('verified')
    const reset = searchParams.get('reset')
    const error = searchParams.get('error')
    const p = searchParams.get('portal')

    if (p === 'client') setPortal('client')
    if (verified === 'true') {
      toast.success('Email ověřen', {
        description: 'Váš účet byl úspěšně ověřen. Nyní se můžete přihlásit.',
      })
    }
    if (reset === 'true') {
      toast.success('Heslo změněno', {
        description: 'Vaše heslo bylo úspěšně změněno. Přihlaste se novým heslem.',
      })
    }
    if (error === 'invalid_token') {
      toast.error('Neplatný odkaz', {
        description: 'Ověřovací odkaz je neplatný nebo vypršel.',
      })
    }
  }, [searchParams])

  const isAccountant = portal === 'accountant'

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
      toast.error('Chyba přihlášení', {
        description: 'Přihlášení se nezdařilo. Zkuste to znovu.',
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden px-4">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full blur-3xl transition-colors duration-700 ${
          isAccountant ? 'bg-purple-500/[0.07]' : 'bg-blue-500/[0.07]'
        }`} />
        <div className={`absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full blur-3xl transition-colors duration-700 ${
          isAccountant ? 'bg-violet-400/[0.05]' : 'bg-cyan-400/[0.05]'
        }`} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zpět na hlavní stránku
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" variant="purple" />
        </div>

        {/* Portal switcher */}
        <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.08] p-1 mb-6">
          <button
            type="button"
            onClick={() => setPortal('accountant')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              isAccountant
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Calculator className="h-4 w-4" />
            Účetní
          </button>
          <button
            type="button"
            onClick={() => setPortal('client')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
              !isAccountant
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Klient
          </button>
        </div>

        {/* Login card */}
        <div className={`rounded-2xl border bg-white/[0.03] backdrop-blur-sm p-8 transition-colors duration-300 ${
          isAccountant
            ? 'border-purple-500/20'
            : 'border-blue-500/20'
        }`}>
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-white font-display">
              {isAccountant ? 'Portál pro účetní' : 'Klientský portál'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {isAccountant
                ? 'Přihlaste se ke správě klientů a uzávěrek'
                : 'Přihlaste se ke správě dokladů a faktur'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-300">
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
                className={`h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-gray-500 transition-colors duration-300 ${
                  isAccountant
                    ? 'focus-visible:ring-purple-500 focus-visible:border-purple-500/50'
                    : 'focus-visible:ring-blue-500 focus-visible:border-blue-500/50'
                }`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-300">
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
                  className={`h-11 pr-10 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-gray-500 transition-colors duration-300 ${
                    isAccountant
                      ? 'focus-visible:ring-purple-500 focus-visible:border-purple-500/50'
                      : 'focus-visible:ring-blue-500 focus-visible:border-blue-500/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className={`w-full h-11 font-semibold text-white transition-colors duration-300 ${
                isAccountant
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
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

          <div className="mt-4 text-center">
            <Link
              href="/auth/forgot-password"
              className={`text-xs transition-colors ${
                isAccountant
                  ? 'text-purple-400 hover:text-purple-300'
                  : 'text-blue-400 hover:text-blue-300'
              }`}
            >
              Zapomněli jste heslo?
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-2">
            <p className="text-xs text-gray-500 text-center">
              Nemáte účet?{' '}
              <Link href="/auth/register" className={`hover:underline ${
                isAccountant ? 'text-purple-400' : 'text-blue-400'
              }`}>
                Zaregistrujte se
              </Link>
            </p>
            <p className="text-xs text-gray-500 text-center">
              nebo{' '}
              <Link href="/pricing" className={`hover:underline ${
                isAccountant ? 'text-purple-400' : 'text-blue-400'
              }`}>
                se podívejte na ceník
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Jeden účet, dva portály — systém vás přesměruje automaticky.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
