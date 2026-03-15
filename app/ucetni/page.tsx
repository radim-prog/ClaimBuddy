import { redirect } from 'next/navigation'

export default function AccountantLandingRedirect() {
  redirect('/auth/login')
}
