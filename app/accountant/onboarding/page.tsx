'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  UserPlus,
  Search,
  Plus,
  Clock,
  AlertTriangle,
  Building2,
  Filter,
  X,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import {
  calculateOnboardingProgress,
  PRIORITY_CONFIG,
  ClientOnboarding,
} from '@/lib/types/onboarding'
import { NewClientForm } from '@/components/new-client-form'

type CompanyWithOnboarding = {
  id: string
  name: string
  ico: string
  email?: string
  status: string
  onboarding?: ClientOnboarding
}

export default function OnboardingPage() {
  const [allCompanies, setAllCompanies] = useState<CompanyWithOnboarding[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [filterStalled, setFilterStalled] = useState<boolean | null>(null)
  const [showNewClient, setShowNewClient] = useState(false)

  const fetchData = () => {
    setLoading(true)
    fetch('/api/accountant/onboarding')
      .then(res => res.json())
      .then(data => {
        setAllCompanies(data.companies || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter only onboarding clients (API already returns only companies with onboarding checklists)
  const onboardingClients = useMemo(() =>
    allCompanies.filter(c => c.onboarding && c.onboarding.status !== 'active'),
    [allCompanies]
  )

  const isStalled = (onboarding: ClientOnboarding) => {
    const lastActivity = new Date(onboarding.last_activity_at)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff >= 7
  }

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'dnes'
    if (days === 1) return 'v\u010dera'
    return `${days} dn\u00ed`
  }

  const activeFiltersCount = [filterPriority, filterStalled].filter(f => f !== null).length

  const clearAllFilters = () => {
    setFilterPriority(null)
    setFilterStalled(null)
  }

  const filteredClients = useMemo(() => {
    return onboardingClients
      .filter(client => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          if (!client.name.toLowerCase().includes(query) &&
              !client.ico?.includes(query) &&
              !(client.email || '').toLowerCase().includes(query)) {
            return false
          }
        }
        if (filterPriority && client.onboarding?.priority !== filterPriority) {
          return false
        }
        if (filterStalled !== null && client.onboarding) {
          const stalled = isStalled(client.onboarding)
          if (filterStalled !== stalled) return false
        }
        return true
      })
      .sort((a, b) => {
        const aStalled = a.onboarding ? isStalled(a.onboarding) : false
        const bStalled = b.onboarding ? isStalled(b.onboarding) : false
        if (aStalled !== bStalled) return aStalled ? -1 : 1

        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
        const aPriority = priorityOrder[a.onboarding?.priority || 'medium'] ?? 1
        const bPriority = priorityOrder[b.onboarding?.priority || 'medium'] ?? 1
        if (aPriority !== bPriority) return aPriority - bPriority

        return a.name.localeCompare(b.name, 'cs')
      })
  }, [onboardingClients, searchQuery, filterPriority, filterStalled])

  const totalClients = onboardingClients.length
  const stalledCount = onboardingClients.filter(c => c.onboarding && isStalled(c.onboarding)).length

  if (loading) {
    return (
      <div className="max-w-7xl flex items-center justify-center py-20">
        <div className="text-gray-500">Na\u010d\u00edt\u00e1n\u00ed...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900 dark:text-white">Onboarding</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {totalClients} klient\u016f v procesu
              {stalledCount > 0 && (
                <span className="text-red-600 ml-2">&bull; {stalledCount} zasekl\u00fdch</span>
              )}
            </p>
          </div>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setShowNewClient(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nov\u00fd klient
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 rounded-xl shadow-soft">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Hledat podle n\u00e1zvu, I\u010c nebo emailu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-11"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtry
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-white dark:bg-gray-800 text-purple-600 rounded-md">{activeFiltersCount}</Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border/50 dark:border-gray-700">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Priorita</label>
                  <select
                    value={filterPriority || ''}
                    onChange={(e) => setFilterPriority(e.target.value || null)}
                    className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-background dark:bg-gray-800 dark:text-gray-200 h-11"
                  >
                    <option value="">V\u0161echny</option>
                    <option value="high">Vysok\u00e1</option>
                    <option value="medium">St\u0159edn\u00ed</option>
                    <option value="low">N\u00edzk\u00e1</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Stav</label>
                  <select
                    value={filterStalled === null ? '' : filterStalled ? 'stalled' : 'active'}
                    onChange={(e) => setFilterStalled(e.target.value === '' ? null : e.target.value === 'stalled')}
                    className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-background dark:bg-gray-800 dark:text-gray-200 h-11"
                  >
                    <option value="">V\u0161echny</option>
                    <option value="stalled">Zasekl\u00e9 (7+ dn\u00ed)</option>
                    <option value="active">Aktivn\u00ed</option>
                  </select>
                </div>
                {activeFiltersCount > 0 && (
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Zru\u0161it filtry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results info */}
      {(searchQuery || activeFiltersCount > 0) && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Zobrazeno {filteredClients.length} z {totalClients} klient\u016f
        </div>
      )}

      {/* Clients list */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <Card className="rounded-xl shadow-soft">
            <CardContent className="py-12 text-center">
              <UserPlus className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold font-display text-gray-900 dark:text-white mb-2">
                {searchQuery || activeFiltersCount > 0 ? '\u017d\u00e1dn\u00ed klienti neodpov\u00eddaj\u00ed filtru' : '\u017d\u00e1dn\u00ed klienti v onboardingu'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || activeFiltersCount > 0
                  ? 'Zkuste upravit vyhled\u00e1v\u00e1n\u00ed nebo filtry'
                  : 'Za\u010dn\u011bte p\u0159id\u00e1n\u00edm nov\u00e9ho klienta'}
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                  Zru\u0161it filtry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => {
            const onboarding = client.onboarding!
            const progress = calculateOnboardingProgress(onboarding.steps)
            const priorityConfig = (PRIORITY_CONFIG as Record<string, any>)[onboarding.priority]
            const stalled = isStalled(onboarding)
            const completedRequired = onboarding.steps.filter((s: any) => s.required && s.completed).length
            const requiredSteps = onboarding.steps.filter((s: any) => s.required).length

            const borderColor = stalled ? 'border-l-red-500' :
                               onboarding.priority === 'high' ? 'border-l-orange-500' :
                               'border-l-purple-500'

            return (
              <Link key={client.id} href={`/accountant/clients/${client.id}`}>
                <Card className={`card-hover rounded-xl shadow-soft-sm transition-all cursor-pointer border-l-4 ${borderColor}`}>
                  <CardContent className="py-3 px-4">
                    <div className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-4 sm:items-center">
                      <div className="sm:col-span-4 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                          {client.name}
                          {stalled && (
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {client.ico && `I\u010cO: ${client.ico}`}
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${stalled ? 'bg-red-500' : 'bg-purple-600'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-10">{progress}%</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {completedRequired}/{requiredSteps} krok\u016f
                        </div>
                      </div>
                      <div className="sm:col-span-3 flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs rounded-md ${priorityConfig.bgColor} ${priorityConfig.color} ${priorityConfig.borderColor}`}
                        >
                          {priorityConfig.label}
                        </Badge>
                        {onboarding.is_new_company_setup && (
                          <Badge variant="outline" className="text-xs rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                            Nov\u00e1
                          </Badge>
                        )}
                        {onboarding.previous_accountant && (
                          <Badge variant="outline" className="text-xs rounded-md bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700">
                            P\u0159evzet\u00ed
                          </Badge>
                        )}
                        <div className={`sm:hidden text-sm flex items-center gap-1 ml-auto ${stalled ? 'text-red-600 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          {getDaysAgo(onboarding.last_activity_at)}
                        </div>
                      </div>
                      <div className="hidden sm:block sm:col-span-2 text-right">
                        <div className={`text-sm flex items-center justify-end gap-1 ${stalled ? 'text-red-600 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          {getDaysAgo(onboarding.last_activity_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>

      {/* New Client Dialog */}
      <NewClientForm
        open={showNewClient}
        onOpenChange={setShowNewClient}
        onSuccess={() => {
          setShowNewClient(false)
          fetchData()
        }}
      />
    </div>
  )
}
