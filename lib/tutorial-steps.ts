import {
  LayoutDashboard,
  Users,
  Columns3,
  Plus,
  Receipt,
  Settings,
} from 'lucide-react'

export type TutorialStep = {
  id: string
  title: string
  description: string
  targetSelector: string
  page: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  icon: typeof LayoutDashboard
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'nav-dashboard',
    title: 'Dashboard',
    description: 'Toto je váš hlavní přehled. Jednotlivé sekce můžete přetahovat a zapínat nebo vypínat přes ikonu ozubeného kolečka.',
    targetSelector: '[data-tour="nav-dashboard"]',
    page: '/accountant/dashboard',
    placement: 'right',
    icon: LayoutDashboard,
  },
  {
    id: 'nav-clients',
    title: 'Seznam klientů',
    description: 'Zde najdete všechny vaše klienty. Červený badge ukazuje počet položek, které vyžadují vaši pozornost — chybějící doklady, nepřečtené zprávy apod.',
    targetSelector: '[data-tour="nav-clients"]',
    page: '/accountant/dashboard',
    placement: 'right',
    icon: Users,
  },
  {
    id: 'client-row',
    title: 'Detail klienta',
    description: 'Klikněte na libovolného klienta pro otevření jeho detailu. Najdete tam doklady, soubory, záznam práce, firemní údaje a časovou osu.',
    targetSelector: '[data-tour="client-row"]',
    page: '/accountant/clients',
    placement: 'bottom',
    icon: Users,
  },
  {
    id: 'client-tabs',
    title: 'Navigace v klientovi',
    description: 'Mezi sekcemi klienta přepínáte pomocí těchto záložek — Přehled, Doklady, Soubory, Práce, Firma a Časová osa.',
    targetSelector: '[data-tour="client-tabs"]',
    page: '__client_detail__',
    placement: 'bottom',
    icon: Columns3,
  },
  {
    id: 'quick-add',
    title: 'Rychlé přidání úkolu',
    description: 'Tímto tlačítkem rychle vytvoříte nový úkol do Inboxu. Funguje odkudkoli v aplikaci. Klávesová zkratka: Ctrl+N.',
    targetSelector: '[data-tour="quick-add"]',
    page: '__any__',
    placement: 'top',
    icon: Plus,
  },
  {
    id: 'nav-invoicing',
    title: 'Fakturace',
    description: 'Vystavujte faktury klientům s automatickým QR kódem pro platbu. Faktury se generují z odpracovaných hodin a nastavených sazeb.',
    targetSelector: '[data-tour="nav-invoicing"]',
    page: '__any__',
    placement: 'right',
    icon: Receipt,
  },
  {
    id: 'nav-settings',
    title: 'Nastavení',
    description: 'Nastavte si firemní údaje, bankovní spojení, hodinové sazby, šablony úkolů a další předvolby pro celou aplikaci.',
    targetSelector: '[data-tour="nav-settings"]',
    page: '__any__',
    placement: 'right',
    icon: Settings,
  },
]
