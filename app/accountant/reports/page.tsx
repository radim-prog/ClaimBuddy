import { redirect } from 'next/navigation'

export default function ReportsRedirectPage() {
  // Reporty přesunuty do detailu firmy - přesměrovat na seznam klientů
  redirect('/accountant/clients')
}
