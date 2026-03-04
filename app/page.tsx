'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { FileText, PieChart, Bell, ArrowRight, Eye, EyeOff, LogIn } from 'lucide-react'
import { login } from './auth/login/actions'

export default function ClientLandingPage() {
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

  const features = [
    {
      icon: FileText,
      title: 'Nahrávání dokladů',
      desc: 'Jednoduše nahrajte faktury a účtenky',
    },
    {
      icon: PieChart,
      title: 'Přehled financí',
      desc: 'DPH, daně a uzávěrky na jednom místě',
    },
    {
      icon: Bell,
      title: 'Upozornění',
      desc: 'Včas vás upozorníme na důležité termíny',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-950/30 dark:via-background dark:to-blue-900/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-blue-400/[0.07] blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full bg-sky-300/[0.06] blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">

          {/* Left side - Marketing */}
          <div className="space-y-8 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-soft">
                  <span className="text-base font-bold text-white font-display">U</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-blue-900 dark:text-blue-100 font-display tracking-tight">
                  Účetní OS
                </h1>
              </div>
              <p className="text-lg text-blue-700 dark:text-blue-300 font-medium font-display">
                Klientský portál
              </p>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed">
              Mějte přehled o svém účetnictví kdykoliv a odkudkoliv.
              Nahrávejte doklady, sledujte stav uzávěrek a komunikujte
              se svým účetním — vše na jednom místě.
            </p>

            <div className="space-y-4">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="flex items-start gap-4 group"
                  style={{ animationDelay: `${(i + 1) * 100}ms` }}
                >
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors flex-shrink-0">
                    <f.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Login */}
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <Card className="border-2 border-blue-200 dark:border-blue-800/50 shadow-soft-lg">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 font-display">Přihlášení</h2>
                  <p className="text-muted-foreground text-sm mt-1">Vstupte do svého účtu</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">Jméno</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Vaše jméno"
                      required
                      autoFocus
                      className="h-11 border-blue-200 dark:border-blue-800/50 focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Heslo</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Zadejte heslo"
                        required
                        className="h-11 pr-10 border-blue-200 dark:border-blue-800/50 focus-visible:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
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

                <div className="mt-8 pt-6 border-t border-blue-100 dark:border-blue-800/30">
                  <p className="text-xs text-muted-foreground text-center">
                    Nemáte účet? Kontaktujte svého účetního.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Switch to accountant */}
            <div className="mt-6 text-center">
              <Link
                href="/ucetni"
                className="inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors group"
              >
                Jste účetní? Přejít na portál pro účetní
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
