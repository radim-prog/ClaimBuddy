-- Performance indexes for chat_messages unread queries
-- Run this directly on Supabase SQL Editor

-- Index for company chat unread count queries (sender_type = 'client', read = false)
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread_company
ON chat_messages(chat_id, sender_type, read) WHERE read = false;

-- Index for task chat unread count queries (sender_id != X, read = false)
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread_task
ON chat_messages(chat_id, sender_id, read) WHERE read = false;

-- Index for chats listing sorted by last_message_at
CREATE INDEX IF NOT EXISTS idx_chats_status_last_msg
ON chats(status, last_message_at DESC NULLS LAST);
