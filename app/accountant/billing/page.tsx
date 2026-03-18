import { redirect } from 'next/navigation'

export default function BillingRedirect() {
  redirect('/accountant/invoicing/billing')
}
