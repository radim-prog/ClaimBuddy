'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ClaimsNavbar } from '@/components/claims/claims-navbar'
import { ClaimsFooter } from '@/components/claims/claims-footer'
import {
  Shield,
  Loader2,
  CheckCircle2,
  User,
  MessageSquare,
  Scale,
  ArrowRight,
  Brain,
} from 'lucide-react'

const SERVICE_OPTIONS = [
  {
    mode: 'self_service' as const,
    title: 'Samoobsluha',
    subtitle: 'Zdarma',
    price: null,
    icon: User,
    color: 'border-gray-200 dark:border-gray-700',
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-400',
    features: [
      'Sami komunikujete s pojišťovnou',
      'Přístup do klientského portálu',
      'Přehled stavu vaší události',
      'Nahrávání dokumentů online',
    ],
    note: 'Vhodné pokud máte zkušenosti s pojistnými událostmi.',
  },
  {
    mode: 'ai_processing' as const,
    title: 'AI analýza',
    subtitle: '199 Kč',
    price: 199,
    icon: Brain,
    color: 'border-purple-200 dark:border-purple-800',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    features: [
      'AI analýza všech dokumentů a fotek',
      'Posouzení oprávněnosti nároku',
      'Odhad výše plnění',
      'Doporučení dalšího postupu',
      'Zpráva do 5 minut',
    ],
    note: 'Rychlá a dostupná analýza pomocí umělé inteligence.',
  },
  {
    mode: 'consultation' as const,
    title: 'Konzultace',
    subtitle: '1 499 Kč',
    price: 1499,
    icon: MessageSquare,
    color: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    popular: true,
    features: [
      'Vše ze samoobsluhy',
      'Osobní konzultace s odborníkem',
      'Pomoc s dokumentací',
      'Doporučení postupu',
      'Kontrola před odesláním pojišťovně',
    ],
    note: 'Nejoblíbenější volba. Jednorázová platba.',
  },
  {
    mode: 'full_representation' as const,
    title: 'Plné zastoupení',
    subtitle: '1 499 Kč + success fee',
    price: 1499,
    successFee: true,
    icon: Scale,
    color: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    features: [
      'Vše z konzultace',
      'Kompletní komunikace s pojišťovnou',
      'Plná moc pro zastupování',
      'Maximalizace plnění',
      'Odvolání při zamítnutí',
      'Success fee 10 % z celkového plnění',
    ],
    note: 'Pro maximální plnění bez starostí. Platíte jen při úspěchu.',
  },
]

function ChooseServiceInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const caseId = searchParams.get('case_id')

  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [consentImmediate, setConsentImmediate] = useState(false)
  const [consentWithdrawal, setConsentWithdrawal] = useState(false)

  const selectedOption = SERVICE_OPTIONS.find((o) => o.mode === selected)
  const isPaid = selectedOption?.price != null && selectedOption.price > 0
  const consentsGiven = !isPaid || (consentImmediate && consentWithdrawal)

  async function handleContinue() {
    if (!selected || !caseId) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/claims/cases/${caseId}/service-mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_mode: selected }),
      })

      if (res.ok) {
        // Redirect to success/thank-you or client portal
        router.push(`/claims/new?submitted=true`)
      }
    } catch {
      // Silently continue — the mode can be set later
      router.push(`/claims/new?submitted=true`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="text-center mb-10">
        <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
          <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Jak chcete řešit vaši pojistnou událost?
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto">
          Vyberte úroveň služby, která vám nejlépe vyhovuje. Režim můžete kdykoliv změnit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SERVICE_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = selected === option.mode
          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => { setSelected(option.mode); setConsentImmediate(false); setConsentWithdrawal(false) }}
              className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 ring-1 ring-blue-500 dark:ring-blue-400'
                  : `${option.color} hover:shadow-md`
              }`}
            >
              {option.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                  Nejoblíbenější
                </span>
              )}

              <div className={`h-11 w-11 rounded-xl ${option.iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`h-5.5 w-5.5 ${option.iconColor}`} />
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{option.title}</h3>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{option.subtitle}</p>

              <ul className="mt-4 space-y-2">
                {option.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">{option.note}</p>

              {isSelected && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* GDPR consents for paid tiers */}
      {selected && isPaid && (
        <div className="mt-8 max-w-xl mx-auto space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={consentImmediate}
              onChange={(e) => setConsentImmediate(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 leading-snug group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
              Souhlasím se zahájením poskytování služby ihned, před uplynutím lhůty pro odstoupení od smlouvy.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={consentWithdrawal}
              onChange={(e) => setConsentWithdrawal(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 leading-snug group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
              Beru na vědomí, že u digitálních služeb (AI zpracování) tím ztrácím právo na odstoupení po dokončení služby.
            </span>
          </label>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          disabled={!selected || !consentsGiven || submitting}
          onClick={handleContinue}
          className="inline-flex items-center justify-center h-12 px-8 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Zpracovávám...
            </>
          ) : isPaid ? (
            <>
              Objednat s povinností platby
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Pokračovat
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </button>
      </div>

      {!caseId && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Tento výběr bude přiřazen k vaší pojistné události po jejím vytvoření.
        </p>
      )}
    </div>
  )
}

export default function ChooseServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <ClaimsNavbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          }
        >
          <ChooseServiceInner />
        </Suspense>
      </main>
      <ClaimsFooter />
    </div>
  )
}
