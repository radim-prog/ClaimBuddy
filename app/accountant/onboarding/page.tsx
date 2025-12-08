'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  UserPlus,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
} from 'lucide-react'
import { OnboardingClient, OnboardingStage, STAGE_CONFIG } from '@/lib/types/onboarding'
import Link from 'next/link'

// Mock data pro demo
const MOCK_CLIENTS: OnboardingClient[] = [
  {
    id: '1',
    stage: 'new-lead',
    priority: 'high',
    company_name: 'Czech Startup s.r.o.',
    contact_person: 'Jan Novák',
    email: 'jan.novak@czechstartup.cz',
    phone: '+420 777 123 456',
    progress_percentage: 20,
    completed_steps: ['Úvodní telefonát'],
    created_at: '2025-12-01T10:00:00Z',
    updated_at: '2025-12-01T10:00:00Z',
    assigned_to_name: 'Jana Svobodová',
  },
  {
    id: '2',
    stage: 'qualification',
    priority: 'medium',
    company_name: 'Café Bella OSVČ',
    contact_person: 'Marie Kováčová',
    email: 'marie@cafebella.cz',
    phone: '+420 604 987 654',
    ico: '12345678',
    progress_percentage: 50,
    completed_steps: ['První schůzka', 'Zjištění rozsahu služeb'],
    created_at: '2025-11-28T14:00:00Z',
    updated_at: '2025-12-02T09:00:00Z',
    assigned_to_name: 'Jana Svobodová',
  },
  {
    id: '3',
    stage: 'contracts',
    priority: 'high',
    company_name: 'TechSolutions a.s.',
    contact_person: 'Petr Svoboda',
    email: 'petr.svoboda@techsolutions.cz',
    phone: '+420 721 456 789',
    ico: '87654321',
    dic: 'CZ87654321',
    vat_payer: true,
    progress_percentage: 75,
    completed_steps: ['Smlouva o vedení účetnictví', 'Plná moc pro úřady'],
    created_at: '2025-11-25T11:00:00Z',
    updated_at: '2025-12-03T08:00:00Z',
    assigned_to_name: 'Jana Svobodová',
  },
  {
    id: '4',
    stage: 'data-collection',
    priority: 'medium',
    company_name: 'Green Energy s.r.o.',
    contact_person: 'Eva Malá',
    email: 'eva.mala@greenenergy.cz',
    phone: '+420 608 111 222',
    ico: '11223344',
    dic: 'CZ11223344',
    vat_payer: true,
    progress_percentage: 60,
    completed_steps: ['IČO/DIČ a základní údaje', 'Bankovní spojení'],
    created_at: '2025-11-20T13:00:00Z',
    updated_at: '2025-12-01T16:00:00Z',
    assigned_to_name: 'Jana Svobodová',
  },
  {
    id: '5',
    stage: 'system-setup',
    priority: 'low',
    company_name: 'Restaurace U Zlaté Koruny',
    contact_person: 'Martin Veselý',
    email: 'martin@ukoruny.cz',
    phone: '+420 777 333 444',
    ico: '55667788',
    progress_percentage: 85,
    completed_steps: ['Vytvoření v databázi', 'Nastavení měsíčních uzávěrek', 'Konfigurace exportů'],
    created_at: '2025-11-15T09:00:00Z',
    updated_at: '2025-12-02T10:00:00Z',
    assigned_to_name: 'Jana Svobodová',
  },
  {
    id: '6',
    stage: 'onboarding-meeting',
    priority: 'high',
    company_name: 'DigitalMarketing Agency s.r.o.',
    contact_person: 'Lucie Nováková',
    email: 'lucie@digitalmarketing.cz',
    phone: '+420 603 555 666',
    ico: '99887766',
    dic: 'CZ99887766',
    vat_payer: true,
    progress_percentage: 90,
    completed_steps: ['Školení klienta', 'Vysvětlení procesů', 'První nahrání dokumentů'],
    created_at: '2025-11-10T15:00:00Z',
    updated_at: '2025-12-03T09:00:00Z',
    assigned_to_name: 'Jana Svobodová',
    expected_start_date: '2025-12-05',
  },
]

const STAGES: OnboardingStage[] = [
  'new-lead',
  'qualification',
  'contracts',
  'data-collection',
  'system-setup',
  'onboarding-meeting',
  'active',
]

export default function OnboardingPage() {
  const [clients] = useState<OnboardingClient[]>(MOCK_CLIENTS)
  const [searchQuery, setSearchQuery] = useState('')

  // Stats
  const totalClients = clients.length
  const avgProgress = Math.round(
    clients.reduce((sum, c) => sum + c.progress_percentage, 0) / clients.length
  )
  const urgentClients = clients.filter((c) => c.priority === 'high').length
  const completedThisMonth = 2 // Mock

  const filteredClients = clients.filter(
    (client) =>
      client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.ico && client.ico.includes(searchQuery))
  )

  const getClientsForStage = (stage: OnboardingStage) => {
    return filteredClients.filter((client) => client.stage === stage)
  }

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Dnes'
    if (days === 1) return 'Včera'
    return `Před ${days} dny`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Vysoká'
      case 'medium':
        return 'Střední'
      case 'low':
        return 'Nízká'
      default:
        return priority
    }
  }

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-purple-600" />
              Náběr nových klientů
            </h1>
            <p className="mt-2 text-gray-600">Pipeline onboardingu a správa potenciálních klientů</p>
          </div>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="mr-2 h-5 w-5" />
            Nový lead
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Celkem v pipeline</p>
                  <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
                </div>
                <Users className="h-10 w-10 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Průměrný pokrok</p>
                  <p className="text-2xl font-bold text-purple-600">{avgProgress}%</p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Urgentní</p>
                  <p className="text-2xl font-bold text-red-600">{urgentClients}</p>
                </div>
                <AlertCircle className="h-10 w-10 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Dokončeno tento měsíc</p>
                  <p className="text-2xl font-bold text-green-600">{completedThisMonth}</p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Hledat podle názvu, kontaktu, emailu, IČO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map((stage) => {
            const config = STAGE_CONFIG[stage]
            const stageClients = getClientsForStage(stage)

            return (
              <div key={stage} className="w-80 flex-shrink-0">
                <Card className={`${config.borderColor} border-2`}>
                  <CardHeader className={`${config.bgColor} pb-3`}>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <span className={config.color}>{config.label}</span>
                      </span>
                      <Badge variant="secondary" className="font-bold">
                        {stageClients.length}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-gray-600 mt-1">{config.description}</p>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-3 min-h-[400px]">
                    {stageClients.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Žádní klienti</p>
                      </div>
                    ) : (
                      stageClients.map((client) => (
                        <Link key={client.id} href={`/accountant/onboarding/${client.id}`}>
                          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-300">
                            <CardContent className="p-4">
                              {/* Priority Badge */}
                              <div className="flex items-center justify-between mb-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs px-2 py-0 ${getPriorityColor(client.priority)}`}
                                >
                                  {getPriorityLabel(client.priority)}
                                </Badge>
                                <span className="text-xs text-gray-500">{getDaysAgo(client.updated_at)}</span>
                              </div>

                              {/* Company Name */}
                              <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                                {client.company_name}
                              </h4>

                              {/* Contact Info */}
                              <div className="space-y-1 mb-3">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{client.contact_person}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Phone className="h-3 w-3" />
                                  <span className="truncate">{client.phone}</span>
                                </div>
                                {client.ico && (
                                  <div className="text-xs text-gray-500">IČO: {client.ico}</div>
                                )}
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-600">Pokrok</span>
                                  <span className="font-semibold text-purple-600">
                                    {client.progress_percentage}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                                    style={{ width: `${client.progress_percentage}%` }}
                                  />
                                </div>
                              </div>

                              {/* Completed Steps */}
                              <div className="text-xs text-gray-500">
                                <CheckCircle2 className="h-3 w-3 inline mr-1" />
                                {client.completed_steps.length} / {config.requiredSteps.length} kroků
                              </div>

                              {/* Expected Start Date */}
                              {client.expected_start_date && (
                                <div className="flex items-center gap-1 text-xs text-blue-600 mt-2 pt-2 border-t">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    Start: {new Date(client.expected_start_date).toLocaleDateString('cs-CZ')}
                                  </span>
                                </div>
                              )}

                              {/* Assigned To */}
                              {client.assigned_to_name && (
                                <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                                  👤 {client.assigned_to_name}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info Box */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Průvodce onboardingem</h4>
              <p className="text-sm text-gray-700 mb-2">
                Každý nový klient prochází 7 etapami od prvního kontaktu až po aktivní spolupráci. Kliknutím
                na kartu otevřete detail s checklistem kroků a formulářem pro sběr údajů.
              </p>
              <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                <li>Průměrná doba onboardingu: 14-21 dní</li>
                <li>Nejdůležitější: smlouvy a přístupy do systémů</li>
                <li>Po dokončení se klient automaticky převede do standardního CRM</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
