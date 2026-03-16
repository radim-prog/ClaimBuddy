import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * When a client deletes data and the company has an assigned accountant,
 * create a notification for the accountant about the deletion.
 */
export async function notifyAccountantOfDeletion({
  companyId,
  deletedBy,
  itemType,
  itemDescription,
}: {
  companyId: string
  deletedBy: string
  itemType: string
  itemDescription: string
}) {
  // Check if company has an assigned accountant
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('assigned_accountant_id, name')
    .eq('id', companyId)
    .single()

  if (!company?.assigned_accountant_id) return // No accountant — no notification needed

  // Get client name
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('name')
    .eq('id', deletedBy)
    .single()

  const clientName = user?.name || 'Klient'
  const companyName = company.name || 'Firma'

  // Create a chat message as notification to the accountant
  await supabaseAdmin
    .from('chats')
    .insert({
      company_id: companyId,
      sender_id: deletedBy,
      sender_role: 'system',
      message: `${clientName} (${companyName}) smazal/a ${itemType}: ${itemDescription}`,
      subject: 'Smazání dat klientem',
      status: 'active',
      started_by: 'system',
    })
}
