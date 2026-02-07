// In-memory store for messages between client and accountant
// Starts EMPTY - no fake data. Fills with real user actions only.
// On page refresh, data resets (TODO: persist to Supabase)

export type Message = {
  id: string
  company_id: string
  sender_type: 'client' | 'accountant'
  sender_name: string
  content: string
  created_at: string
  read_at?: string
  attachments?: { name: string; url: string }[]
}

// globalThis singleton - ensures all API routes share the same store
const _storeKey = '__ucetni_message_store'
function _getStore(): { messages: Message[]; counter: number } {
  if (!(globalThis as any)[_storeKey]) {
    (globalThis as any)[_storeKey] = { messages: [], counter: 0 }
  }
  return (globalThis as any)[_storeKey]
}
const messages = _getStore().messages

export function addMessage(data: Omit<Message, 'id' | 'created_at'>): Message {
  const message: Message = {
    ...data,
    id: `msg-${++_getStore().counter}`,
    created_at: new Date().toISOString(),
  }
  messages.push(message)
  return message
}

export function getMessagesByCompany(companyId: string, limit: number = 50): Message[] {
  return messages
    .filter(m => m.company_id === companyId)
    .slice(-limit) // oldest first, last N
}

export function getUnreadCountByCompany(companyId: string, forRole: 'client' | 'accountant'): number {
  // Unread = messages FROM the other side that haven't been read
  const otherSide = forRole === 'client' ? 'accountant' : 'client'
  return messages.filter(
    m => m.company_id === companyId && m.sender_type === otherSide && !m.read_at
  ).length
}

export function getTotalUnreadCount(companyIds: string[], forRole: 'client' | 'accountant'): number {
  return companyIds.reduce((sum, id) => sum + getUnreadCountByCompany(id, forRole), 0)
}

export function markAsRead(messageId: string): void {
  const msg = messages.find(m => m.id === messageId)
  if (msg && !msg.read_at) {
    msg.read_at = new Date().toISOString()
  }
}

export function markAllAsRead(companyId: string, forRole: 'client' | 'accountant'): void {
  const otherSide = forRole === 'client' ? 'accountant' : 'client'
  messages
    .filter(m => m.company_id === companyId && m.sender_type === otherSide && !m.read_at)
    .forEach(m => { m.read_at = new Date().toISOString() })
}
