'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

interface LeadCaptureFormProps {
  source: string
  variant: 'accountant' | 'client'
}

export function LeadCaptureForm({ source, variant }: LeadCaptureFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [clientCount, setClientCount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const isAccountant = variant === 'accountant'
  const accentColor = isAccountant ? 'purple' : 'blue'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          client_count: clientCount || undefined,
          source,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Nastala chyba. Zkuste to prosím znovu.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Nepodařilo se odeslat. Zkontrolujte připojení.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className={`rounded-2xl border border-${accentColor}-200 dark:border-${accentColor}-800/50 bg-card p-8 text-center`}>
        <div className={`mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center`}>
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Děkujeme!</h3>
        <p className="text-muted-foreground">
          Brzy se vám ozveme s přístupovými údaji. Zkontrolujte svůj email.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 shadow-soft-lg"
    >
      <h3 className="text-xl font-bold text-foreground mb-1">
        {isAccountant ? 'Vyzkoušejte zdarma na 30 dní' : 'Začněte zdarma'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {isAccountant
          ? 'Vyplňte formulář a získáte plný přístup k portálu pro účetní.'
          : 'Vyplňte formulář a ozveme se vám s přístupem.'}
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="lead-name" className="block text-sm font-medium text-foreground mb-1.5">
            Jméno a příjmení *
          </label>
          <input
            id="lead-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jan Novák"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="lead-email" className="block text-sm font-medium text-foreground mb-1.5">
            Email *
          </label>
          <input
            id="lead-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan@firma.cz"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="lead-company" className="block text-sm font-medium text-foreground mb-1.5">
            Firma
          </label>
          <input
            id="lead-company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={isAccountant ? 'Název účetní kanceláře' : 'Název firmy'}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
          />
        </div>

        {isAccountant && (
          <div>
            <label htmlFor="lead-clients" className="block text-sm font-medium text-foreground mb-1.5">
              Kolik klientů spravujete?
            </label>
            <select
              id="lead-clients"
              value={clientCount}
              onChange={(e) => setClientCount(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
            >
              <option value="">Vyberte...</option>
              <option value="10">Do 10</option>
              <option value="30">10 - 30</option>
              <option value="50">30 - 50</option>
              <option value="100">50 - 100</option>
              <option value="200">100+</option>
            </select>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className={`w-full h-11 text-base font-semibold ${
            isAccountant
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Odesílám...
            </>
          ) : (
            'Vyzkoušet zdarma'
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Bez platební karty. Odesláním souhlasíte se{' '}
          <a href="/legal/terms" className="underline hover:text-foreground">zpracováním údajů</a>.
        </p>
      </div>
    </form>
  )
}
