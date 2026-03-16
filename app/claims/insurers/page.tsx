'use client'

import { useState } from 'react'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Search,
  Phone,
  Mail,
  Globe,
  AlertCircle,
  Loader2,
  Plus,
  Shield,
  ExternalLink,
} from 'lucide-react'
import type { InsuranceCompany } from '@/lib/types/insurance'

export default function ClaimsInsurersPage() {
  const [search, setSearch] = useState('')

  const { data, loading, error } = useCachedFetch<{ companies: InsuranceCompany[] }>(
    '/api/claims/insurers'
  )

  const companies = data?.companies ?? []

  const filtered = companies.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code ?? '').toLowerCase().includes(q) ||
      (c.ico ?? '').includes(q)
    )
  })

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
            Pojišťovny
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Přehled pojišťoven zapojených do správy pojistných událostí
          </p>
        </div>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          disabled
          title="Připravujeme"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Přidat pojišťovnu
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Hledat pojišťovnu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm text-red-600 dark:text-red-400">
              Nepodařilo se načíst pojišťovny
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Pravděpodobně chybí DB migrace — spusťte{' '}
              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">
                supabase/migrations/20260317_insurance_claims.sql
              </code>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              {search ? 'Žádná pojišťovna neodpovídá hledání' : 'Žádné pojišťovny v databázi'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} pojišťov{filtered.length === 1 ? 'na' : filtered.length <= 4 ? 'ny' : 'en'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((company) => (
              <InsuranceCompanyCard key={company.id} company={company} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function InsuranceCompanyCard({ company }: { company: InsuranceCompany }) {
  return (
    <Card className="rounded-xl overflow-hidden hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                {company.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {company.code && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 px-1.5 py-0"
                  >
                    {company.code}
                  </Badge>
                )}
                {company.ico && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    IČO: {company.ico}
                  </span>
                )}
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    company.active
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {company.active ? 'Aktivní' : 'Neaktivní'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {/* Contact grid */}
        <div className="grid grid-cols-1 gap-1.5 text-sm">
          {company.claims_phone && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Phone className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-500 w-14 shrink-0">Hlášení:</span>
              <a href={`tel:${company.claims_phone}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate text-xs">
                {company.claims_phone}
              </a>
            </div>
          )}
          {company.claims_email && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Mail className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-500 w-14 shrink-0">E-mail:</span>
              <a href={`mailto:${company.claims_email}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate text-xs">
                {company.claims_email}
              </a>
            </div>
          )}
          {company.phone && !company.claims_phone && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-500 w-14 shrink-0">Tel:</span>
              <a href={`tel:${company.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate text-xs">
                {company.phone}
              </a>
            </div>
          )}
          {company.email && !company.claims_email && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-500 w-14 shrink-0">E-mail:</span>
              <a href={`mailto:${company.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate text-xs">
                {company.email}
              </a>
            </div>
          )}
          {company.address && (
            <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
              <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-500 w-14 shrink-0">Adresa:</span>
              <span className="text-xs truncate">{company.address}</span>
            </div>
          )}
        </div>

        {/* No contact info */}
        {!company.claims_phone && !company.claims_email && !company.phone && !company.email && !company.address && (
          <p className="text-xs text-gray-400 dark:text-gray-600 italic">Kontaktní údaje nejsou k dispozici</p>
        )}

        {/* Web link */}
        {company.web_url && (
          <div className="pt-1">
            <a
              href={company.web_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Globe className="h-3 w-3" />
              Webové stránky
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
