import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  // Don't allow deleting default locations
  const { data: loc } = await supabaseAdmin
    .from('locations')
    .select('is_default')
    .eq('id', id)
    .single()

  if (!loc) {
    return NextResponse.json({ error: 'Místo nenalezeno' }, { status: 404 })
  }

  if (loc.is_default) {
    return NextResponse.json({ error: 'Výchozí místa nelze smazat' }, { status: 400 })
  }

  // Unset location_id on tasks that reference this location
  await supabaseAdmin
    .from('tasks')
    .update({ location_id: null })
    .eq('location_id', id)

  const { error } = await supabaseAdmin
    .from('locations')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
