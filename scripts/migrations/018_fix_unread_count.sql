-- Migration: Fix unread count not resetting
-- Date: 2026-05-18
-- Description: This is a code-level fix, no SQL changes needed.
-- The fix adds:
-- 1. markConversationAsRead() server action that resets unread_count in conversation_participants
-- 2. Updates fetchMessages() to also reset unread_count when loading messages
-- 3. Calls markConversationAsRead when a conversation is selected

-- The conversation_participants table already has the required columns:
-- - unread_count: integer
-- - last_read_at: timestamp with time zone

-- No database schema changes required.
