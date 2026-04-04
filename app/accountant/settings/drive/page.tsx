'use client'

import { Suspense } from 'react'
import { CompanyDriveMapper } from '@/components/drive/company-drive-mapper'

export default function DriveSettingsPage() {
  return (
    <Suspense>
      <CompanyDriveMapper />
    </Suspense>
  )
}
