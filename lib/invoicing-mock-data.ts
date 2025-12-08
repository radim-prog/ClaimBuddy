// Mock data for Monthly Invoicing page

export type InvoiceStatus = 'draft' | 'sent' | 'paid'

export interface TimeEntry {
  date: string
  userId: string
  userName: string
  description: string
  hours: number
  note?: string
  billable: boolean
}

export interface BillableProject {
  id: string
  clientId: string
  clientName: string
  projectTitle: string
  totalBillableHours: number
  hourlyRate: number
  totalAmount: number
  invoiceStatus: InvoiceStatus
  timeEntries: TimeEntry[]
}

export interface InvoicingPeriod {
  period: string // YYYY-MM
  projects: BillableProject[]
}

export interface InvoicingData {
  periods: InvoicingPeriod[]
}

// Mock invoicing data for November 2025
export const mockInvoicingData: InvoicingData = {
  periods: [
    {
      period: '2025-11',
      projects: [
        {
          id: 'project-1',
          clientId: 'company-1',
          clientName: 'ABC s.r.o.',
          projectTitle: 'Roční uzávěrka 2025',
          totalBillableHours: 12.5,
          hourlyRate: 1200,
          totalAmount: 15000,
          invoiceStatus: 'paid',
          timeEntries: [
            {
              date: '2025-11-05',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Kontrola účetních dokladů za Q3',
              hours: 3.5,
              note: 'Nalezeno několik chyb v zaúčtování, opraveno',
              billable: true,
            },
            {
              date: '2025-11-12',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Příprava DPH přiznání',
              hours: 2.0,
              billable: true,
            },
            {
              date: '2025-11-18',
              userId: 'user-4-assistant',
              userName: 'Marie Dvořáková',
              description: 'Zpracování mzdových podkladů',
              hours: 4.0,
              note: 'Včetně kontroly odvodu pojištění',
              billable: true,
            },
            {
              date: '2025-11-25',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Konzultace s klientem ohledně investic',
              hours: 1.5,
              billable: true,
            },
            {
              date: '2025-11-28',
              userId: 'user-3-accountant',
              userName: 'Petr Novotný',
              description: 'Finalizace měsíční uzávěrky',
              hours: 1.5,
              billable: true,
            },
          ],
        },
        {
          id: 'project-2',
          clientId: 'company-3',
          clientName: 'DEF s.r.o.',
          projectTitle: 'Měsíční účetní služby',
          totalBillableHours: 8.0,
          hourlyRate: 1000,
          totalAmount: 8000,
          invoiceStatus: 'sent',
          timeEntries: [
            {
              date: '2025-11-03',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Zaúčtování bankovních výpisů',
              hours: 2.5,
              billable: true,
            },
            {
              date: '2025-11-10',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Kontrola a schválení faktur',
              hours: 1.5,
              billable: true,
            },
            {
              date: '2025-11-17',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Příprava přehledu cash flow',
              hours: 2.0,
              note: 'Vytvoření reportu pro management',
              billable: true,
            },
            {
              date: '2025-11-24',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Měsíční uzávěrka a reporting',
              hours: 2.0,
              billable: true,
            },
          ],
        },
        {
          id: 'project-3',
          clientId: 'company-6',
          clientName: 'MNO Services s.r.o.',
          projectTitle: 'Implementace nového účetního systému',
          totalBillableHours: 18.0,
          hourlyRate: 1500,
          totalAmount: 27000,
          invoiceStatus: 'draft',
          timeEntries: [
            {
              date: '2025-11-04',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Analýza požadavků a návrh řešení',
              hours: 4.0,
              note: 'Meeting s vedením firmy',
              billable: true,
            },
            {
              date: '2025-11-08',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Instalace a konfigurace Money S5',
              hours: 3.5,
              billable: true,
            },
            {
              date: '2025-11-11',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Migrace dat ze starého systému',
              hours: 5.0,
              note: 'Import všech účetních dat za rok 2024',
              billable: true,
            },
            {
              date: '2025-11-19',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Školení zaměstnanců - část 1',
              hours: 3.0,
              billable: true,
            },
            {
              date: '2025-11-26',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Školení zaměstnanců - část 2',
              hours: 2.5,
              billable: true,
            },
          ],
        },
        {
          id: 'project-4',
          clientId: 'company-7',
          clientName: 'PQR Development',
          projectTitle: 'Příprava na daňovou kontrolu',
          totalBillableHours: 22.5,
          hourlyRate: 1800,
          totalAmount: 40500,
          invoiceStatus: 'draft',
          timeEntries: [
            {
              date: '2025-11-01',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Analýza rizik a příprava strategie',
              hours: 4.0,
              note: 'Konzultace s daňovým právníkem',
              billable: true,
            },
            {
              date: '2025-11-06',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Kontrola účetních dokladů za 2023-2024',
              hours: 6.0,
              billable: true,
            },
            {
              date: '2025-11-13',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Příprava dokumentace pro FÚ',
              hours: 5.0,
              note: 'Sběr všech požadovaných podkladů',
              billable: true,
            },
            {
              date: '2025-11-20',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Revize DPH přiznání za kontrolované období',
              hours: 4.5,
              billable: true,
            },
            {
              date: '2025-11-27',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Finální kontrola a příprava na jednání s FÚ',
              hours: 3.0,
              billable: true,
            },
          ],
        },
      ],
    },
    {
      period: '2025-10',
      projects: [
        {
          id: 'project-5',
          clientId: 'company-1',
          clientName: 'ABC s.r.o.',
          projectTitle: 'Q3 2025 Uzávěrka',
          totalBillableHours: 10.0,
          hourlyRate: 1200,
          totalAmount: 12000,
          invoiceStatus: 'paid',
          timeEntries: [
            {
              date: '2025-10-05',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Zaúčtování Q3 dokladů',
              hours: 5.0,
              billable: true,
            },
            {
              date: '2025-10-15',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'DPH přiznání Q3',
              hours: 3.0,
              billable: true,
            },
            {
              date: '2025-10-25',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Reporting pro management',
              hours: 2.0,
              billable: true,
            },
          ],
        },
        {
          id: 'project-6',
          clientId: 'company-3',
          clientName: 'DEF s.r.o.',
          projectTitle: 'Měsíční účetní služby',
          totalBillableHours: 7.5,
          hourlyRate: 1000,
          totalAmount: 7500,
          invoiceStatus: 'paid',
          timeEntries: [
            {
              date: '2025-10-08',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Zpracování bankovních výpisů',
              hours: 2.5,
              billable: true,
            },
            {
              date: '2025-10-18',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Kontrola faktur',
              hours: 2.0,
              billable: true,
            },
            {
              date: '2025-10-28',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Měsíční uzávěrka',
              hours: 3.0,
              billable: true,
            },
          ],
        },
      ],
    },
    {
      period: '2025-12',
      projects: [
        {
          id: 'project-7',
          clientId: 'company-1',
          clientName: 'ABC s.r.o.',
          projectTitle: 'Konec roku 2025 - příprava',
          totalBillableHours: 5.5,
          hourlyRate: 1200,
          totalAmount: 6600,
          invoiceStatus: 'draft',
          timeEntries: [
            {
              date: '2025-12-03',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Inventura aktiv a pasiv',
              hours: 3.0,
              note: 'Příprava na roční uzávěrku',
              billable: true,
            },
            {
              date: '2025-12-05',
              userId: 'user-2-accountant',
              userName: 'Jana Svobodová',
              description: 'Kontrola účetních zůstatků',
              hours: 2.5,
              billable: true,
            },
          ],
        },
      ],
    },
  ],
}

// Helper functions
export function getInvoicingDataForPeriod(period: string): InvoicingPeriod | undefined {
  return mockInvoicingData.periods.find(p => p.period === period)
}

export function getAllBillableProjects(): BillableProject[] {
  return mockInvoicingData.periods.flatMap(p => p.projects)
}

export function getProjectsByClient(clientName: string): BillableProject[] {
  return getAllBillableProjects().filter(p => p.clientName === clientName)
}

export function getProjectsByStatus(status: InvoiceStatus): BillableProject[] {
  return getAllBillableProjects().filter(p => p.invoiceStatus === status)
}

export function calculateTotalRevenue(projects: BillableProject[]): number {
  return projects.reduce((sum, p) => sum + p.totalAmount, 0)
}

export function calculateTotalHours(projects: BillableProject[]): number {
  return projects.reduce((sum, p) => sum + p.totalBillableHours, 0)
}

// User statistics
export interface UserStats {
  userId: string
  userName: string
  totalHours: number
  totalRevenue: number
  projectCount: number
}

export function getUserStats(projects: BillableProject[]): UserStats[] {
  const userMap = new Map<string, UserStats>()

  projects.forEach(project => {
    project.timeEntries.forEach(entry => {
      if (!userMap.has(entry.userId)) {
        userMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.userName,
          totalHours: 0,
          totalRevenue: 0,
          projectCount: 0
        })
      }

      const stats = userMap.get(entry.userId)!
      stats.totalHours += entry.hours
      stats.totalRevenue += entry.hours * project.hourlyRate
    })
  })

  // Count unique projects per user
  projects.forEach(project => {
    const userIds = new Set(project.timeEntries.map(e => e.userId))
    userIds.forEach(userId => {
      const stats = userMap.get(userId)
      if (stats) stats.projectCount++
    })
  })

  return Array.from(userMap.values()).sort((a, b) => b.totalHours - a.totalHours)
}
