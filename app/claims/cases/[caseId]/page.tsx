import { redirect } from 'next/navigation'
export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  redirect(`/accountant/claims/cases/${caseId}`)
}
