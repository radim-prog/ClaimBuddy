'use client'

import { useParams } from 'next/navigation'
import { useCompany } from '../layout'
import { FileBrowser } from '@/components/drive/file-browser'

export default function FilesPage() {
  const params = useParams()
  const companyId = params.companyId as string
  const { company } = useCompany()

  return <FileBrowser companyId={companyId} companyName={company.name} />
}
