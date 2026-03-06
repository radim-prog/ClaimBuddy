import { redirect } from 'next/navigation'

export default function ClientCaseRedirectPage({ params }: { params: { companyId: string } }) {
  redirect(`/accountant/clients/${params.companyId}/tasks`)
}
