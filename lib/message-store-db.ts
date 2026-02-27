import { supabaseAdmin } from '@/lib/supabase-admin'

// Supabase-backed message store
// Replaces lib/message-store.ts (in-memory globalThis singleton)
// Uses chats + chat_messages tables

export type Message = {
  id: string
  company_id: string
  sender_id: string
  sender_type: 'client' | 'accountant'
  sender_name: string
  content: string
  created_at: string
  read_at?: string
  attachments?: { name: string; url: string }[]
}

// Ensure a company chat exists, return its ID
async function ensureChat(companyId: string): Promise<string> {
  // Try to find existing company chat
  const { data: existing, error: findError } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'company_chat')
    .single()

  if (existing) return existing.id
  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Failed to find chat: ${findError.message}`)
  }

  // Create new chat
  const { data: created, error } = await supabaseAdmin
    .from('chats')
    .insert({
      type: 'company_chat',
      company_id: companyId,
      participants: [],
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create chat: ${error.message}`)
  return created.id
}

export async function addMessage(data: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
  const chatId = await ensureChat(data.company_id)

  const { data: row, error } = await supabaseAdmin
    .from('chat_messages')
    .insert({
      chat_id: chatId,
      sender_id: data.sender_id,
      sender_name: data.sender_name,
      sender_type: data.sender_type,
      text: data.content,
      attachments: data.attachments || null,
      read: false,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to add message: ${error.message}`)

  // Update chat last_message
  await supabaseAdmin
    .from('chats')
    .update({
      last_message_at: row.created_at,
      last_message_preview: data.content.substring(0, 100),
    })
    .eq('id', chatId)

  return {
    id: row.id,
    company_id: data.company_id,
    sender_id: row.sender_id,
    sender_type: row.sender_type,
    sender_name: row.sender_name,
    content: row.text,
    created_at: row.created_at,
    attachments: row.attachments || undefined,
  }
}

export async function getMessagesByCompany(companyId: string, limit: number = 50): Promise<Message[]> {
  // Find chat for this company
  const { data: chat, error: findError } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'company_chat')
    .single()

  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Failed to find chat: ${findError.message}`)
  }
  if (!chat) return []

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chat.id)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch messages: ${error.message}`)

  return (data ?? []).map(row => ({
    id: row.id,
    company_id: companyId,
    sender_id: row.sender_id,
    sender_type: row.sender_type as 'client' | 'accountant',
    sender_name: row.sender_name,
    content: row.text,
    created_at: row.created_at,
    read_at: row.read ? row.read_at : undefined,
    attachments: row.attachments || undefined,
  }))
}

export async function getUnreadCountByCompany(companyId: string, forRole: 'client' | 'accountant'): Promise<number> {
  const { data: chat, error: findError } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'company_chat')
    .single()

  if (findError && findError.code !== 'PGRST116') return 0
  if (!chat) return 0

  const otherSide = forRole === 'client' ? 'accountant' : 'client'
  const { count, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', chat.id)
    .eq('sender_type', otherSide)
    .eq('read', false)

  if (error) return 0
  return count || 0
}

export async function markAsRead(messageId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('chat_messages')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', messageId)
  if (error) throw new Error(`Failed to mark message as read: ${error.message}`)
}

export async function markAllAsRead(companyId: string, forRole: 'client' | 'accountant'): Promise<void> {
  const { data: chat, error: findError } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'company_chat')
    .single()

  if (findError && findError.code !== 'PGRST116') return
  if (!chat) return

  const otherSide = forRole === 'client' ? 'accountant' : 'client'
  const { error } = await supabaseAdmin
    .from('chat_messages')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('chat_id', chat.id)
    .eq('sender_type', otherSide)
    .eq('read', false)
  if (error) throw new Error(`Failed to mark messages as read: ${error.message}`)
}
