'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Users, LayoutDashboard, Clock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { login } from '../auth/login/actions'

export default function AccountantLandingPage() {
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
    } catch (error) {
      toast.error('Něco se pokazilo')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">

          {/* Levá strana - Marketing */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-purple-900 dark:text-purple-100 mb-4">
                Účetní OS
              </h1>
              <p className="text-xl text-purple-700 dark:text-purple-300">
                Portál pro účetní
              </p>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-300">
              Spravujte desítky klientů bez stresu. Master dashboard,
              automatické urgování, time tracking a fakturace - vše
              co potřebujete pro efektivní práci.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <LayoutDashboard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Master Dashboard</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Přehled všech klientů na jednom místě</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Správa klientů</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Dokumenty, schvalování, komunikace</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Time Tracking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Sledování času a automatická fakturace</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pravá strana - Login */}
          <div>
            <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">Přihlášení</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Vstupte do svého účtu</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Jméno</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Vaše jméno"
                      required
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Heslo</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        className="border-purple-200 focus:border-purple-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-11"
                    disabled={loading}
                  >
                    {loading ? 'Přihlašování...' : 'Přihlásit se'}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
                    Účty vytváří administrátor systému.
                  </p>
                  <Link href="/accountant/dashboard">
                    <Button variant="outline" className="w-full border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30">
                      Demo přístup (bez přihlášení)
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Přepínač na klientskou verzi */}
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Jste klient? Přejít na klientský portál
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
