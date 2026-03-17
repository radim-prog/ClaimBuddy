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
  FileSearch, ShieldCheck, BarChart3, Users, Upload, Clock, MessageSquare, CalendarCheck,
} from 'lucide-react'
import { login } from './actions'

type Portal = 'accountant' | 'client'

const ACCOUNTANT_USP = [
  { icon: Users, title: 'Desítky firem pod kontrolou', desc: 'Přehledný dashboard s uzávěrkami, doklady a úkoly pro každého klienta.' },
  { icon: FileSearch, title: 'AI vytěžování dokladů', desc: 'Nahrajte fakturu — AI rozpozná data a navrhne předkontaci.' },
  { icon: BarChart3, title: 'Daňové přehledy a DPH matice', desc: 'Kompletní přehled DPH, daně z příjmů a pojistného na jednom místě.' },
  { icon: ShieldCheck, title: 'Krizové řízení a spisy', desc: 'Pojistné události, škody a dokumenty v přehledném workflow.' },
]

const CLIENT_USP = [
  { icon: Upload, title: 'Snadné nahrávání dokladů', desc: 'Foťte doklady mobilem nebo přetáhněte soubory — vše se zpracuje automaticky.' },
  { icon: CalendarCheck, title: 'Přehled uzávěrek a plateb', desc: 'Vidíte stav každé měsíční uzávěrky a historii všech plateb.' },
  { icon: MessageSquare, title: 'Komunikace s účetním', desc: 'Zprávy, notifikace a požadavky na jednom místě bez emailů.' },
  { icon: Clock, title: 'Daňový dotazník online', desc: 'Vyplňte daňový dotazník z pohodlí domova, přiložte doklady.' },
]

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

    if (p === 'client' || window.location.hostname === 'claims.zajcon.cz') setPortal('client')
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
  const usp = isAccountant ? ACCOUNTANT_USP : CLIENT_USP

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
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background gradients — shift with portal */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[30%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[120px] transition-colors duration-700 ${
          isAccountant ? 'bg-purple-600/15' : 'bg-blue-600/15'
        }`} />
        <div className={`absolute -bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full blur-[100px] transition-colors duration-700 ${
          isAccountant ? 'bg-violet-500/10' : 'bg-cyan-500/10'
        }`} />
      </div>

      {/* Split layout */}
      <div className="relative min-h-screen grid lg:grid-cols-2">
        {/* ── LEFT: Info panel ── */}
        <div className="hidden lg:flex flex-col justify-center px-12 xl:px-20 py-16">
          {/* Back + Logo */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-10 self-start"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zpět na hlavní stránku
          </Link>

          <div className="mb-8">
            <Logo size="lg" variant={isAccountant ? 'purple' : 'blue'} />
          </div>

          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-3 transition-all duration-500">
            {isAccountant ? (
              <>
                Správa účetnictví
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">
                  bez stresu
                </span>
              </>
            ) : (
              <>
                Vaše doklady
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  pod kontrolou
                </span>
              </>
            )}
          </h2>

          <p className="text-gray-400 text-base mb-10 max-w-md">
            {isAccountant
              ? 'Platforma nové generace pro účetní firmy. Doklady, uzávěrky, komunikace a AI na jednom místě.'
              : 'Nahrajte doklady, sledujte uzávěrky a komunikujte s účetním — vše z jednoho místa.'
            }
          </p>

          {/* USP items */}
          <div className="space-y-4">
            {usp.map((item) => (
              <div key={item.title} className="flex items-start gap-4 group">
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-500 ${
                  isAccountant
                    ? 'bg-purple-500/15 border border-purple-500/20'
                    : 'bg-blue-500/15 border border-blue-500/20'
                }`}>
                  <item.icon className={`w-4 h-4 transition-colors duration-500 ${
                    isAccountant ? 'text-purple-400' : 'text-blue-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Login form ── */}
        <div className="flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-16 py-12">
          {/* Mobile-only back + logo */}
          <div className="lg:hidden w-full max-w-md mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Zpět
            </Link>
            <div className="flex justify-center">
              <Logo size="lg" variant={isAccountant ? 'purple' : 'blue'} />
            </div>
          </div>

          <div className="w-full max-w-md">
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
                Pro účetní
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
                Pro klienty
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
                  className={`w-full h-11 font-semibold text-white transition-all duration-300 ${
                    isAccountant
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'
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
