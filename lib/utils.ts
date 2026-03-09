import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency (CZK)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

// Format datetime
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Get month name in Czech
export function getMonthName(monthIndex: number): string {
  const months = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];
  return months[monthIndex];
}

// Get period label ('2025-01' → 'Leden 2025')
export function getPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  return `${getMonthName(parseInt(month) - 1)} ${year}`;
}

// Generate period string from Date
export function getPeriodFromDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'missing':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'uploaded':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Get status label
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'missing':
      return 'Chybí';
    case 'uploaded':
      return 'Nahráno';
    case 'approved':
      return 'Schváleno';
    case 'rejected':
      return 'Zamítnuto';
    default:
      return status;
  }
}

// Calculate VAT from total
export function calculateVAT(total: number, vatRate: number): number {
  return Math.round((total * vatRate) / (100 + vatRate) * 100) / 100;
}

// Czech pluralization
export function czechPlural(count: number, one: string, twoToFour: string, fiveAndMore: string): string {
  if (count === 1) return `${count} ${one}`
  if (count >= 2 && count <= 4) return `${count} ${twoToFour}`
  return `${count} ${fiveAndMore}`
}

// Calculate total without VAT
export function calculateWithoutVAT(totalWithVAT: number, vatRate: number): number {
  return Math.round((totalWithVAT / (1 + vatRate / 100)) * 100) / 100;
}
