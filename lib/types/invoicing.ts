// Types for Monthly Invoicing page

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

export interface UserStats {
  userId: string
  userName: string
  totalHours: number
  totalRevenue: number
  projectCount: number
}
