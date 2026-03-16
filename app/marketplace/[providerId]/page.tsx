import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ProviderProfile } from '@/components/marketplace/provider-profile'

type Props = { params: Promise<{ providerId: string }> }

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { providerId } = await params

  const { data } = await supabaseAdmin
    .from('marketplace_providers')
    .select('name, city, description')
    .eq('id', providerId)
    .eq('status', 'verified')
    .single()

  if (!data) {
    return { title: 'Firma nenalezena — Marketplace | Ucetni OS' }
  }

  const description =
    data.description?.slice(0, 160) ||
    `${data.name} — ucetni firma v ${data.city}. Najdete svou ucetni na Ucetni OS.`

  return {
    title: `${data.name} — Ucetni firma ${data.city} | Ucetni OS Marketplace`,
    description,
    openGraph: {
      title: `${data.name} — Ucetni firma v ${data.city}`,
      description,
      type: 'website',
    },
  }
}

export default async function ProviderPage({ params }: Props) {
  const { providerId } = await params

  const { data: provider } = await supabaseAdmin
    .from('marketplace_providers')
    .select('*')
    .eq('id', providerId)
    .eq('status', 'verified')
    .single()

  if (!provider) notFound()

  return <ProviderProfile provider={provider} />
}
