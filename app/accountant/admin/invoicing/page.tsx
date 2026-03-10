import { redirect } from 'next/navigation'

export default function InvoicingRedirect() {
  redirect('/accountant/admin/operations')
}
