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
  company_id: string | null
  task_id?: string | null
  type?: 'company_chat' | 'task_chat'
  subject: string
  status: 'open' | 'completed'
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  started_by: 'client' | 'accountant'
  completed_at: string | null
  created_at: string
}

export type ConversationWithContext = Conversation & {
  company_name?: string | null
  task_title?: string | null
  source_type: 'company' | 'task'
  source_url: string
  waiting_since: string | null
  last_responder: string | null
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

  // Batch unread counts: 1 query instead of N per-chat queries
  const chatIds = chats.map(c => c.id)
  const { data: unreadMessages } = await supabaseAdmin
    .from('chat_messages')
    .select('chat_id')
    .in('chat_id', chatIds)
    .eq('sender_type', otherSide)
    .eq('read', false)

  const unreadMap = new Map<string, number>()
  for (const msg of unreadMessages || []) {
    unreadMap.set(msg.chat_id, (unreadMap.get(msg.chat_id) || 0) + 1)
  }

  const conversations: Conversation[] = chats.map((chat) => ({
    id: chat.id,
    company_id: chat.company_id,
    subject: chat.subject || 'Obecná konverzace',
    status: (chat.status || 'open') as 'open' | 'completed',
    last_message_at: chat.last_message_at,
    last_message_preview: chat.last_message_preview,
    unread_count: unreadMap.get(chat.id) || 0,
    started_by: (chat.started_by || 'accountant') as 'client' | 'accountant',
    completed_at: chat.completed_at,
    created_at: chat.created_at,
  }))

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

  // Update chat last_message + waiting_since tracking
  const chatUpdate: Record<string, unknown> = {
    last_message_at: row.created_at,
    last_message_preview: data.content.substring(0, 100),
    last_responder: data.sender_type,
  }
  if (data.sender_type === 'client') {
    // Client sent a message — set waiting_since if not already waiting
    // Use raw SQL to only set if null (keep earliest waiting time)
    const { data: chat } = await supabaseAdmin
      .from('chats')
      .select('waiting_since')
      .eq('id', data.chat_id)
      .single()
    if (!chat?.waiting_since) {
      chatUpdate.waiting_since = row.created_at
    }
  } else {
    // Accountant replied — clear waiting_since
    chatUpdate.waiting_since = null
  }
  await supabaseAdmin
    .from('chats')
    .update(chatUpdate)
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

// ============================================
// TASK CHAT FUNCTIONS
// ============================================

// Get all conversations for a task
export async function getConversationsByTask(
  taskId: string,
  forUserId: string
): Promise<Conversation[]> {
  const { data: chats, error } = await supabaseAdmin
    .from('chats')
    .select('*')
    .eq('task_id', taskId)
    .eq('type', 'task_chat')
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) throw new Error(`Failed to fetch task conversations: ${error.message}`)
  if (!chats || chats.length === 0) return []

  // Batch unread counts: 1 query instead of N per-chat queries
  const chatIds = chats.map(c => c.id)
  const { data: unreadMessages } = await supabaseAdmin
    .from('chat_messages')
    .select('chat_id')
    .in('chat_id', chatIds)
    .neq('sender_id', forUserId)
    .eq('read', false)

  const unreadMap = new Map<string, number>()
  for (const msg of unreadMessages || []) {
    unreadMap.set(msg.chat_id, (unreadMap.get(msg.chat_id) || 0) + 1)
  }

  const conversations: Conversation[] = chats.map((chat) => ({
    id: chat.id,
    company_id: chat.company_id,
    task_id: chat.task_id,
    type: 'task_chat' as const,
    subject: chat.subject || 'Diskuze',
    status: (chat.status || 'open') as 'open' | 'completed',
    last_message_at: chat.last_message_at,
    last_message_preview: chat.last_message_preview,
    unread_count: unreadMap.get(chat.id) || 0,
    started_by: (chat.started_by || 'accountant') as 'client' | 'accountant',
    completed_at: chat.completed_at,
    created_at: chat.created_at,
  }))

  return conversations.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1
    const aTime = a.last_message_at || a.created_at
    const bTime = b.last_message_at || b.created_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })
}

// Create a new task conversation
export async function createTaskConversation(data: {
  task_id: string
  subject: string
  started_by: 'client' | 'accountant'
}): Promise<Conversation> {
  const { data: chat, error } = await supabaseAdmin
    .from('chats')
    .insert({
      type: 'task_chat',
      task_id: data.task_id,
      company_id: null,
      subject: data.subject,
      status: 'open',
      started_by: data.started_by,
      participants: [],
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create task conversation: ${error.message}`)

  return {
    id: chat.id,
    company_id: null,
    task_id: chat.task_id,
    type: 'task_chat',
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

// Get unread count for task chats
export async function getUnreadCountByTask(
  taskId: string,
  forUserId: string
): Promise<number> {
  const { data: chats } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('task_id', taskId)
    .eq('type', 'task_chat')

  if (!chats || chats.length === 0) return 0

  const chatIds = chats.map(c => c.id)
  const { count, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .in('chat_id', chatIds)
    .neq('sender_id', forUserId)
    .eq('read', false)

  if (error) return 0
  return count || 0
}

// Mark all as read in a task chat (by user id, not role)
export async function markAllAsReadInTaskChat(
  chatId: string,
  forUserId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('chat_messages')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('chat_id', chatId)
    .neq('sender_id', forUserId)
    .eq('read', false)

  if (error) throw new Error(`Failed to mark task messages as read: ${error.message}`)
}

// ============================================
// AGGREGATED CONVERSATIONS (for overview page)
// ============================================

export async function getAllOpenConversations(
  forUserId: string,
  options?: { status?: 'open' | 'completed'; unread_only?: boolean; limit?: number; count_only?: boolean; company_id?: string; firm_company_ids?: string[] }
): Promise<{ conversations: ConversationWithContext[]; total_unread: number; needs_response?: number }> {
  let query = supabaseAdmin
    .from('chats')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.company_id) {
    query = query.eq('company_id', options.company_id)
  }

  if (options?.firm_company_ids) {
    query = query.in('company_id', options.firm_company_ids)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data: chats, error } = await query

  if (error) throw new Error(`Failed to fetch conversations: ${error.message}`)
  if (!chats || chats.length === 0) return { conversations: [], total_unread: 0 }

  // Fast path for count_only: 2 batch queries instead of N per-chat queries
  if (options?.count_only) {
    const companyChatIds = chats.filter(c => c.type === 'company_chat').map(c => c.id)
    const taskChatIds = chats.filter(c => c.type === 'task_chat').map(c => c.id)
    let totalUnread = 0

    const [companyResult, taskResult] = await Promise.all([
      companyChatIds.length > 0
        ? supabaseAdmin.from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .in('chat_id', companyChatIds)
            .eq('sender_type', 'client')
            .eq('read', false)
        : Promise.resolve({ count: 0 }),
      taskChatIds.length > 0
        ? supabaseAdmin.from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .in('chat_id', taskChatIds)
            .neq('sender_id', forUserId)
            .eq('read', false)
        : Promise.resolve({ count: 0 }),
    ])

    totalUnread = (companyResult.count || 0) + (taskResult.count || 0)

    // Count conversations needing response (client wrote last, not completed)
    const needsResponse = chats.filter(c =>
      c.last_responder === 'client' && c.waiting_since && (c.status || 'open') !== 'completed'
    ).length

    return { conversations: [], total_unread: totalUnread, needs_response: needsResponse }
  }

  // Fetch company names for company_chat
  const companyIds = [...new Set(chats.filter(c => c.company_id).map(c => c.company_id))]
  let companyMap: Record<string, string> = {}
  let companyGroupMap: Record<string, string | null> = {}
  if (companyIds.length > 0) {
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id, name, group_name')
      .in('id', companyIds)
    if (companies) {
      companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]))
      companyGroupMap = Object.fromEntries(companies.map(c => [c.id, c.group_name || null]))
    }
  }

  // Fetch task titles for task_chat
  const taskIds = [...new Set(chats.filter(c => c.task_id).map(c => c.task_id))]
  let taskMap: Record<string, string> = {}
  if (taskIds.length > 0) {
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('id, title')
      .in('id', taskIds)
    if (tasks) {
      taskMap = Object.fromEntries(tasks.map(t => [t.id, t.title]))
    }
  }

  // Batch unread counts: 2 queries instead of N per-chat queries
  const companyChatIds = chats.filter(c => c.type === 'company_chat').map(c => c.id)
  const taskChatIds = chats.filter(c => c.type === 'task_chat').map(c => c.id)

  const [companyUnreads, taskUnreads] = await Promise.all([
    companyChatIds.length > 0
      ? supabaseAdmin.from('chat_messages').select('chat_id')
          .in('chat_id', companyChatIds).eq('sender_type', 'client').eq('read', false)
      : Promise.resolve({ data: [] as { chat_id: string }[] }),
    taskChatIds.length > 0
      ? supabaseAdmin.from('chat_messages').select('chat_id')
          .in('chat_id', taskChatIds).neq('sender_id', forUserId).eq('read', false)
      : Promise.resolve({ data: [] as { chat_id: string }[] }),
  ])

  const unreadMap = new Map<string, number>()
  for (const msg of [...(companyUnreads.data || []), ...(taskUnreads.data || [])]) {
    unreadMap.set(msg.chat_id, (unreadMap.get(msg.chat_id) || 0) + 1)
  }

  let totalUnread = 0
  const conversations: ConversationWithContext[] = chats.map((chat) => {
    const isTaskChat = chat.type === 'task_chat'
    const unreadCount = unreadMap.get(chat.id) || 0
    totalUnread += unreadCount

    const companyName = chat.company_id ? (companyMap[chat.company_id] || null) : null
    const taskTitle = chat.task_id ? (taskMap[chat.task_id] || null) : null

    const sourceType = isTaskChat ? 'task' : 'company'
    const sourceUrl = isTaskChat
      ? `/accountant/tasks/${chat.task_id}?tab=komunikace`
      : `/accountant/clients/${chat.company_id}?tab=messages`

    return {
      id: chat.id,
      company_id: chat.company_id,
      task_id: chat.task_id,
      type: chat.type as 'company_chat' | 'task_chat',
      subject: chat.subject || (isTaskChat ? 'Diskuze' : 'Obecna konverzace'),
      status: (chat.status || 'open') as 'open' | 'completed',
      last_message_at: chat.last_message_at,
      last_message_preview: chat.last_message_preview,
      unread_count: unreadCount,
      started_by: (chat.started_by || 'accountant') as 'client' | 'accountant',
      completed_at: chat.completed_at,
      created_at: chat.created_at,
      company_name: companyName,
      group_name: chat.company_id ? (companyGroupMap[chat.company_id] || null) : null,
      task_title: taskTitle,
      source_type: sourceType as 'company' | 'task',
      source_url: sourceUrl,
      waiting_since: chat.waiting_since || null,
      last_responder: chat.last_responder || null,
    }
  })

  // Filter unread_only after counting
  let filtered = conversations
  if (options?.unread_only) {
    filtered = conversations.filter(c => c.unread_count > 0)
  }

  return { conversations: filtered, total_unread: totalUnread }
}
