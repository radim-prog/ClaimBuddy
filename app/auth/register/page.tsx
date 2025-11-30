'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { register } from './actions'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
      } else {
        toast.success('Registrace úspěšná!', {
          description: 'Přesměrování na dashboard...',
        })
        // Redirect is handled by the action
      }
    } catch (error) {
      toast.error('Chyba registrace', {
        description: 'Něco se pokazilo. Zkuste to prosím znovu.',
      })
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Registrace
        </CardTitle>
        <CardDescription>
          Vytvořte si nový účet
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Jméno</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Jan Novák"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="vas@email.cz"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potvrdit heslo</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={loading}
          >
            {loading ? 'Registruji...' : 'Zaregistrovat se'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Již máte účet?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Přihlaste se
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
