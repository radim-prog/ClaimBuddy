'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Search, Building2, MapPin, Users, SlidersHorizontal, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// --- Types ---

interface Provider {
  id: string
  name: string
  ico: string
  city: string | null
  region: string | null
  description: string | null
  specializations: string[] | null
  capacity_status: 'accepting' | 'limited' | 'full'
  min_price: number | null
  max_price: number | null
  services: string[] | null
  logo_url: string | null
  featured: boolean
  sort_order: number
}

// --- Constants ---

const SPECIALIZATIONS = [
  'Daně',
  'Mzdy',
  'DPH',
  'OSVČ',
  's.r.o.',
  'E-shop',
  'Neziskové org.',
  'Zahraniční obchod',
]

const CAPACITY_OPTIONS = [
  { value: 'all', label: 'Vše' },
  { value: 'accepting', label: 'Přijímá klienty' },
  { value: 'limited', label: 'Omezená kapacita' },
  { value: 'full', label: 'Plná kapacita' },
]

const CAPACITY_MAP: Record<string, { label: string; color: string }> = {
  accepting: {
    label: 'Přijímá klienty',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  limited: {
    label: 'Omezená kapacita',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  full: {
    label: 'Plná kapacita',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
}

// --- Helpers ---

function formatPrice(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null && min !== max) {
    return `${min.toLocaleString('cs-CZ')} – ${max.toLocaleString('cs-CZ')} Kč/měs`
  }
  const val = min ?? max
  return `od ${val!.toLocaleString('cs-CZ')} Kč/měs`
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// --- Skeleton ---

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/3 rounded bg-muted" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-4/5 rounded bg-muted" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-6 w-16 rounded-md bg-muted" />
          <div className="h-6 w-16 rounded-md bg-muted" />
          <div className="h-6 w-16 rounded-md bg-muted" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-9 w-28 rounded-lg bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}

// --- Provider Card ---

function ProviderCard({ provider }: { provider: Provider }) {
  const capacity = CAPACITY_MAP[provider.capacity_status] || CAPACITY_MAP.accepting
  const price = formatPrice(provider.min_price, provider.max_price)

  return (
    <Link href={`/marketplace/${provider.id}`} className="block group">
      <Card
        className={`h-full transition-all hover:shadow-md hover:-translate-y-0.5 ${
          provider.featured
            ? 'border-violet-300 dark:border-violet-700 ring-1 ring-violet-200 dark:ring-violet-800'
            : ''
        }`}
      >
        <CardContent className="p-6">
          {/* Header: logo + name */}
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 overflow-hidden">
              {provider.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={provider.logo_url}
                  alt={provider.name}
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                <Building2 className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
                  {provider.name}
                </h3>
                {provider.featured && (
                  <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0 shrink-0 text-[10px]">
                    Doporučeno
                  </Badge>
                )}
              </div>
              {(provider.city || provider.region) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {[provider.city, provider.region].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          {provider.description && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
              {provider.description}
            </p>
          )}

          {/* Specializations */}
          {provider.specializations && provider.specializations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {provider.specializations.slice(0, 5).map((spec) => (
                <Badge
                  key={spec}
                  variant="secondary"
                  className="text-[11px] font-normal"
                >
                  {spec}
                </Badge>
              ))}
              {provider.specializations.length > 5 && (
                <Badge variant="outline" className="text-[11px] font-normal">
                  +{provider.specializations.length - 5}
                </Badge>
              )}
            </div>
          )}

          {/* Footer: price + capacity + CTA */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1.5">
              {price && (
                <span className="text-sm font-medium text-foreground">
                  {price}
                </span>
              )}
              <Badge
                className={`${capacity.color} border-0 text-[11px] w-fit`}
              >
                {capacity.label}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 group-hover:bg-violet-50 group-hover:border-violet-300 dark:group-hover:bg-violet-950 dark:group-hover:border-violet-700 transition-colors"
            >
              Zobrazit profil
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// --- Main Page ---

export default function MarketplacePage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [specialization, setSpecialization] = useState('all')
  const [capacity, setCapacity] = useState('all')

  const debouncedSearch = useDebounce(search, 300)
  const debouncedCity = useDebounce(city, 300)

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (debouncedCity) params.set('city', debouncedCity)
      if (specialization && specialization !== 'all')
        params.set('specialization', specialization)
      if (capacity && capacity !== 'all') params.set('capacity', capacity)

      const qs = params.toString()
      const res = await fetch(`/api/marketplace/providers${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Chyba při načítání dat')
      const data = await res.json()
      setProviders(data.providers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, debouncedCity, specialization, capacity])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  // Derived stats
  const stats = useMemo(() => {
    const cities = new Set(providers.map((p) => p.city).filter(Boolean))
    const specs = new Set(providers.flatMap((p) => p.specializations || []))
    return {
      total: providers.length,
      cities: cities.size,
      specializations: specs.size,
    }
  }, [providers])

  const hasActiveFilters =
    debouncedSearch || debouncedCity || specialization !== 'all' || capacity !== 'all'

  function clearFilters() {
    setSearch('')
    setCity('')
    setSpecialization('all')
    setCapacity('all')
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 to-background dark:from-violet-950/20 dark:to-background" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Najděte svou{' '}
              <span className="text-violet-600 dark:text-violet-400">
                účetní
              </span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Katalog ověřených účetních firem s transparentními cenami,
              specializacemi a aktuální dostupností.
            </p>

            {/* Search bar */}
            <div className="mt-8 max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Hledejte podle názvu, města nebo popisu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-12 pr-4 text-base rounded-xl border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
              />
            </div>
          </div>

          {/* Stats */}
          {!loading && providers.length > 0 && (
            <div className="mt-10 flex justify-center gap-8 md:gap-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {stats.total}
                </div>
                <div className="text-sm text-muted-foreground">
                  ověřených firem
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {stats.cities}
                </div>
                <div className="text-sm text-muted-foreground">měst</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {stats.specializations}
                </div>
                <div className="text-sm text-muted-foreground">
                  specializací
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Filters + Results */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center mb-8">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filtry
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1">
            {/* City */}
            <div className="relative w-full sm:w-48">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Město / region"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Specialization */}
            <Select
              value={specialization}
              onValueChange={setSpecialization}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Specializace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny specializace</SelectItem>
                {SPECIALIZATIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Capacity */}
            <Select value={capacity} onValueChange={setCapacity}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Dostupnost" />
              </SelectTrigger>
              <SelectContent>
                {CAPACITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Zrušit filtry
            </Button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={fetchProviders}>
              Zkusit znovu
            </Button>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Žádné účetní firmy neodpovídají vašim filtrům
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Zkuste upravit vyhledávací kritéria nebo zrušte filtry.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Zrušit filtry
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-violet-50/50 dark:bg-violet-950/10">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Jste účetní?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Zaregistrujte svou firmu do katalogu a získejte nové klienty.
            Nastavte si profil, specializace a dostupnost.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/login">Zaregistrovat firmu</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">Zobrazit ceník</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
