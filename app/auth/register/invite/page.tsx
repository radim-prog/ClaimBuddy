'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { ArrowLeft, Building2, UserPlus, AlertCircle, Loader2 } from 'lucide-react'

interface InviteInfo {
  valid: boolean
  email?: string
  companyName?: string
  companyIco?: string
  inviterName?: string
  error?: string
}

export default function InviteRegisterPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [gdprConsent, setGdprConsent] = useState(false)

  useEffect(() => {
    if (!token) {
      setInfo({ valid: false, error: 'Chybí token pozvánky' })
      setLoading(false)
      return
    }

    fetch(`/api/auth/invite-info?token=${token}`)
      .then(r => r.json())
      .then(data => setInfo(data))
      .catch(() => setInfo({ valid: false, error: 'Nepodařilo se ověřit pozvánku' }))
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Hesla se neshodují')
      return
    }
    if (password.length < 8) {
      toast.error('Heslo musí mít alespoň 8 znaků')
      return
    }
    if (!gdprConsent) {
      toast.error('Musíte souhlasit se zpracováním osobních údajů')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, name: name.trim(), gdprConsent }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Registrace dokončena! Nyní se můžete přihlásit.')
        window.location.href = '/auth/login?registered=true'
      } else {
        toast.error(data.error || 'Nepodařilo se dokončit registraci')
        setSubmitting(false)
      }
    } catch {
      toast.error('Chyba při registraci')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!info?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold">Neplatná pozvánka</h2>
            <p className="text-muted-foreground">{info?.error || 'Pozvánka je neplatná nebo vypršela.'}</p>
            <Link href="/auth/login">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Zpět na přihlášení
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-display">Přijměte pozvánku</h1>
          <p className="text-muted-foreground mt-1">
            Registrujte se a získejte přístup ke správě vaší firmy
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Invite info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{info.companyName}</span>
                {info.companyIco && (
                  <span className="text-muted-foreground">IČO: {info.companyIco}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Pozvánku odesílá: <strong>{info.inviterName}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={info.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Vaše jméno</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jan Novák"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Alespoň 8 znaků"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Potvrzení hesla</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Zopakujte heslo"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="gdpr"
                  type="checkbox"
                  checked={gdprConsent}
                  onChange={e => setGdprConsent(e.target.checked)}
                  className="mt-1 rounded border-gray-300"
                />
                <label htmlFor="gdpr" className="text-xs text-muted-foreground leading-relaxed">
                  Souhlasím se{' '}
                  <Link href="/legal/privacy" className="text-blue-600 underline" target="_blank">
                    zpracováním osobních údajů
                  </Link>{' '}
                  a{' '}
                  <Link href="/legal/terms" className="text-blue-600 underline" target="_blank">
                    obchodními podmínkami
                  </Link>.
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {submitting ? 'Registruji...' : 'Dokončit registraci'}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Již máte účet?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                Přihlaste se
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
