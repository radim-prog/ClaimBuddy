'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ClaimsNavbar } from '@/components/claims/claims-navbar'
import { ClaimsFooter } from '@/components/claims/claims-footer'
import { Star, Loader2, CheckCircle2, AlertCircle, Shield } from 'lucide-react'

interface ReviewData {
  id: string
  case_number: string | null
  insurance_type: string | null
  already_submitted: boolean
  rating: number | null
  comment: string | null
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0.5 transition-transform hover:scale-110"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function ReviewPageInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [clientName, setClientName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Chybí odkaz pro hodnocení.')
      setLoading(false)
      return
    }

    async function loadReview() {
      try {
        const res = await fetch(`/api/claims/reviews?token=${encodeURIComponent(token!)}`)
        if (res.status === 410) {
          setError('Platnost odkazu vypršela.')
          return
        }
        if (!res.ok) {
          setError('Neplatný odkaz pro hodnocení.')
          return
        }
        const data = await res.json()
        setReviewData(data)
        if (data.already_submitted) {
          setRating(data.rating ?? 0)
          setComment(data.comment ?? '')
          setSubmitted(true)
        }
      } catch {
        setError('Nepodařilo se načíst hodnocení.')
      } finally {
        setLoading(false)
      }
    }
    loadReview()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/claims/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, comment: comment.trim(), client_name: clientName.trim() }),
      })

      if (res.status === 409) {
        setSubmitted(true)
        return
      }

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Nepodařilo se odeslat hodnocení.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Nepodařilo se odeslat hodnocení.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{error}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
          Pokud si myslíte, že jde o chybu, kontaktujte nás na podpora@zajcon.cz.
        </p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Hodnocení bylo odesláno
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
          Děkujeme za vaše hodnocení! Pomáháte nám zlepšovat naše služby.
        </p>
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-6 w-6 ${
                  s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Ohodnoťte naši práci
          </h1>
          {reviewData?.case_number && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Spis: {reviewData.case_number}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Vaše zpětná vazba nám pomáhá zlepšovat služby.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Jak jste spokojeni s řešením vaší pojistné události?
            </label>
            <StarRating value={rating} onChange={setRating} />
            {rating === 0 && (
              <p className="text-xs text-gray-400">Vyberte 1-5 hvězdiček</p>
            )}
          </div>

          <div>
            <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Vaše jméno <span className="text-gray-400">(nepovinné)</span>
            </label>
            <input
              id="client-name"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Jan Novák"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Komentář <span className="text-gray-400">(nepovinné)</span>
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Co se vám líbilo? Co bychom mohli zlepšit?"
              rows={4}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={rating === 0 || submitting}
            className="w-full inline-flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Odesílám...
              </>
            ) : (
              'Odeslat hodnocení'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ClaimsReviewPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <ClaimsNavbar />
      <main className="flex-1 py-12">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          }
        >
          <ReviewPageInner />
        </Suspense>
      </main>
      <ClaimsFooter />
    </div>
  )
}
