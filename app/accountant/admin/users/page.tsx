import { redirect } from 'next/navigation'

export default function AdminUsersRedirect() {
  redirect('/accountant/admin/people')
}
