import { redirect } from 'next/navigation'

// Redirect /claims/clients/[companyId] → /claims/clients/[companyId]/cases
export default function ClaimsClientPage({
  params,
}: {
  params: { companyId: string }
}) {
  redirect(`/claims/clients/${params.companyId}/cases`)
}
