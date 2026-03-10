import { redirect } from 'next/navigation'

export default function UserActivityRedirect() {
  redirect('/accountant/admin/people')
}
