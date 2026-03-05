import { supabaseAdmin } from '@/lib/supabase-admin'

// Supabase-backed message store
// Uses chats + chat_messages tables
// Supports multi-topic conversations per company

export type Message = {
  id: string
  company_id: string
  chat_id: string
  sender_id: string
  sender_type: 'client' | 'accountant'
  sender_name: string
  content: string
  created_at: string
  read_at?: string
  attachments?: { name: string; url: string }[]
}

export type Conversation = {
  id: string
  company_id: string
  subject: string
  status: 'open' | 'completed'
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  started_by: 'client' | 'accountant'
  completed_at: string | null
  created_at: string
}

// Get all conversations for a company with unread counts
export async function getConversationsByCompany(
  companyId: string,
  forRole: 'client' | 'accountant'
): Promise<Conversation[]> {
  const { data: chats, error } = await supabaseAdmin
    .from('chats')
    .select('*')
    .eq('company_id', companyId)
    .eq('type', 'company_chat')
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) throw new Error(`Failed to fetch conversations: ${error.message}`)
  if (!chats || chats.length === 0) return []

  const otherSide = forRole === 'client' ? 'accountant' : 'client'

  // Get unread counts for each chat
  const conversations: Conversation[] = await Promise.all(
    chats.map(async (chat) => {
      const { count } = await supabaseAdmin
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chat.id)
        .eq('sender_type', otherSide)
        .eq('read', false)

      return {
        id: chat.id,
        company_id: chat.company_id,
        subject: chat.subject || 'Obecná konverzace',
        status: (chat.status || 'open') as 'open' | 'completed',
        last_message_at: chat.last_message_at,
        last_message_preview: chat.last_message_preview,
        unread_count: count || 0,
        started_by: (chat.started_by || 'accountant') as 'client' | 'accountant',
        completed_at: chat.completed_at,
        created_at: chat.created_at,
      }
    })
  )

  // Sort: open first (by last_message_at desc), then completed
  return conversations.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1
    const aTime = a.last_message_at || a.created_at
    const bTime = b.last_message_at || b.created_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })
}

// Create a new conversation
export async function createConversation(data: {
  company_id: string
  subject: string
  started_by: 'client' | 'accountant'
}): Promise<Conversation> {
  const { data: chat, error } = await supabaseAdmin
    .from('chats')
    .insert({
      type: 'company_chat',
      company_id: data.company_id,
      subject: data.subject,
      status: 'open',
      started_by: data.started_by,
      participants: [],
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create conversation: ${error.message}`)

  return {
    id: chat.id,
    company_id: chat.company_id,
    subject: chat.subject,
    status: 'open',
    last_message_at: null,
    last_message_preview: null,
    unread_count: 0,
    started_by: data.started_by,
    completed_at: null,
    created_at: chat.created_at,
  }
}

// Get messages for a specific chat/conversation
export async function getMessagesByChatId(
  chatId: string,
  limit: number = 100
): Promise<Message[]> {
  // First get the chat to know company_id
  const { data: chat } = await supabaseAdmin
    .from('chats')
    .select('company_id')
    .eq('id', chatId)
    .single()

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch messages: ${error.message}`)

  return (data ?? []).map(row => ({
    id: row.id,
    company_id: chat?.company_id || '',
    chat_id: chatId,
    sender_id: row.sender_id,
    sender_type: row.sender_type as 'client' | 'accountant',
    sender_name: row.sender_name,
    content: row.text,
    created_at: row.created_at,
    read_at: row.read ? row.read_at : undefined,
    attachments: row.attachments || undefined,
  }))
}

// Add a message to a specific chat
export async function addMessage(data: {
  chat_id: string
  company_id: string
  sender_id: string
  sender_type: 'client' | 'accountant'
  sender_name: string
  content: string
  attachments?: { name: string; url: string }[]
}): Promise<Message> {
  const { data: row, error } = await supabaseAdmin
    .from('chat_messages')
    .insert({
      chat_id: data.chat_id,
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
    .eq('id', data.chat_id)

  return {
    id: row.id,
    company_id: data.company_id,
    chat_id: data.chat_id,
    sender_id: row.sender_id,
    sender_type: row.sender_type,
    sender_name: row.sender_name,
    content: row.text,
    created_at: row.created_at,
    attachments: row.attachments || undefined,
  }
}

// Legacy: add message to default company chat (ensures chat exists)
export async function addMessageToCompany(data: Omit<Message, 'id' | 'created_at' | 'chat_id'>): Promise<Message> {
  const chatId = await ensureDefaultChat(data.company_id)
  return addMessage({ ...data, chat_id: chatId })
}

// Ensure a default company chat exists
async function ensureDefaultChat(companyId: string): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'company_chat')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (existing) return existing.id

  const { data: created, error } = await supabaseAdmin
    .from('chats')
    .insert({
      type: 'company_chat',
      company_id: companyId,
      subject: 'Obecná konverzace',
      status: 'open',
      started_by: 'accountant',
      participants: [],
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create default chat: ${error.message}`)
  return created.id
}

// Complete a conversation
export async function completeConversation(chatId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('chats')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', chatId)

  if (error) throw new Error(`Failed to complete conversation: ${error.message}`)
}

// Reopen a conversation
export async function reopenConversation(chatId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('chats')
    .update({
      status: 'open',
      completed_at: null,
    })
    .eq('id', chatId)

  if (error) throw new Error(`Failed to reopen conversation: ${error.message}`)
}

// Mark all messages as read in a specific chat
export async function markAllAsReadInChat(
  chatId: string,
  forRole: 'client' | 'accountant'
): Promise<void> {
  const otherSide = forRole === 'client' ? 'accountant' : 'client'
  const { error } = await supabaseAdmin
    .from('chat_messages')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('chat_id', chatId)
    .eq('sender_type', otherSide)
    .eq('read', false)

  if (error) throw new Error(`Failed to mark messages as read: ${error.message}`)
}

// Get total unread count across all conversations for a company
export async function getUnreadCountByCompany(
  companyId: string,
  forRole: 'client' | 'accountant'
): Promise<number> {
  const { data: chats } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'company_chat')

  if (!chats || chats.length === 0) return 0

  const otherSide = forRole === 'client' ? 'accountant' : 'client'
  const chatIds = chats.map(c => c.id)

  const { count, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .in('chat_id', chatIds)
    .eq('sender_type', otherSide)
    .eq('read', false)

  if (error) return 0
  return count || 0
}

// Legacy: get messages by company (returns all from first/default chat)
export async function getMessagesByCompany(companyId: string, limit: number = 50): Promise<Message[]> {
  const { data: chat } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'company_chat')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!chat) return []
  return getMessagesByChatId(chat.id, limit)
}

// Legacy: mark all as read for company
export async function markAllAsRead(companyId: string, forRole: 'client' | 'accountant'): Promise<void> {
  const { data: chats } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'company_chat')

  if (!chats || chats.length === 0) return

  const otherSide = forRole === 'client' ? 'accountant' : 'client'
  const chatIds = chats.map(c => c.id)

  await supabaseAdmin
    .from('chat_messages')
    .update({ read: true, read_at: new Date().toISOString() })
    .in('chat_id', chatIds)
    .eq('sender_type', otherSide)
    .eq('read', false)
}

export async function markAsRead(messageId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('chat_messages')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', messageId)
  if (error) throw new Error(`Failed to mark message as read: ${error.message}`)
}
