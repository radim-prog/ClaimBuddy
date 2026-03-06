import { redirect } from 'next/navigation'

export default function ClientHubPage({ params }: { params: { companyId: string } }) {
  redirect(`/accountant/clients/${params.companyId}/work`)
}
