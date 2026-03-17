'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Bell,
  Users,
  FileText,
  Building2,
  Workflow,
  Lock,
  ChevronRight,
  Construction,
} from 'lucide-react'

type SettingsSection = {
  icon: React.ReactNode
  title: string
  description: string
  status: 'available' | 'soon' | 'planned'
  items?: string[]
}

const sections: SettingsSection[] = [
  {
    icon: <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    title: 'Obecná nastavení modulu',
    description: 'Základní konfigurace claims modulu — číslování spisů, výchozí hodnoty.',
    status: 'soon',
    items: ['Formát číslování case_number', 'Výchozí priorita nových spisů', 'Automatické přiřazení'],
  },
  {
    icon: <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    title: 'Notifikace',
    description: 'Nastavení upozornění na změny stavu, termíny a přiřazení.',
    status: 'soon',
    items: ['Email upozornění při změně stavu', 'Telegram notifikace', 'Termíny a deadlines'],
  },
  {
    icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    title: 'Přístupy a oprávnění',
    description: 'Správa přístupu k claims modulu pro jednotlivé uživatele.',
    status: 'soon',
    items: ['Přiřazení modulu uživatelům', 'Role a oprávnění', 'Audit log přístupů'],
  },
  {
    icon: <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    title: 'Správa pojišťoven',
    description: 'Přidávání a editace pojišťoven v číselníku.',
    status: 'available',
    items: ['Seznam pojišťoven', 'Přidání nové pojišťovny', 'Kontaktní údaje pojišťoven'],
  },
  {
    icon: <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    title: 'Šablony dokumentů',
    description: 'Šablony pro automatické generování doprovodné dokumentace.',
    status: 'planned',
    items: ['Šablona hlášení škody', 'Průvodní dopisy', 'Potvrzení pro klienty'],
  },
  {
    icon: <Workflow className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    title: 'Workflow automatizace',
    description: 'Automatická pravidla pro přechody stavů a přiřazování úkolů.',
    status: 'planned',
    items: ['Automatický přechod stavu', 'Pravidla pro eskalaci', 'SLA sledování'],
  },
  {
    icon: <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    title: 'Integrace s pojišťovnami',
    description: 'API propojení s pojišťovnami pro automatické sledování stavu.',
    status: 'planned',
    items: ['Česká pojišťovna API', 'Kooperativa API', 'Automatická aktualizace stavu'],
  },
]

const statusLabel: Record<SettingsSection['status'], string> = {
  available: 'Dostupné',
  soon: 'Připravujeme',
  planned: 'Plánováno',
}

const statusStyle: Record<SettingsSection['status'], string> = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  soon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  planned: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

export default function ClaimsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
          Nastavení claims modulu
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Konfigurace správy pojistných událostí
        </p>
      </div>

      {/* Under construction banner */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Construction className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Modul ve vývoji
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Claims modul je aktivně vyvíjen. Většina nastavení bude dostupná v dalších verzích.
                Aktuálně je k dispozici správa pojišťoven.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings sections */}
      <div className="space-y-3">
        {sections.map((section) => (
          <Card
            key={section.title}
            className={`rounded-xl transition-colors ${
              section.status === 'available'
                ? 'hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer'
                : 'opacity-70'
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex-shrink-0 mt-0.5">
                    {section.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                        {section.title}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 border-0 ${statusStyle[section.status]}`}
                      >
                        {statusLabel[section.status]}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
                {section.status === 'available' && (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                )}
              </div>
            </CardHeader>
            {section.items && (
              <CardContent className="pt-0 pl-[60px]">
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="w-1 h-1 rounded-full bg-blue-300 dark:bg-blue-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Quick action — manage insurers */}
      <Card className="rounded-xl border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Správa pojišťoven
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  10 pojišťoven v číselníku
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex-shrink-0"
              onClick={() => window.location.href = '/accountant/claims/insurers'}
            >
              Spravovat
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
