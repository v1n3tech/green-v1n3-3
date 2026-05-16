-- Migration: Messaging system updates
-- Date: 2026-05-16
-- Description: Enable Supabase Realtime for messaging tables
-- 
-- Changes:
-- 1. Enable Realtime for messages table (required for live message updates)
-- 2. Enable Realtime for conversations table (required for live conversation list updates)
-- 3. Set REPLICA IDENTITY FULL for filtered realtime subscriptions
-- 4. Online presence tracking using existing last_active_at column
-- 5. Fixed community key mapping to match database enum values

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Set REPLICA IDENTITY FULL for filtered realtime subscriptions to work
-- This is required when using filters like `filter: conversation_id=eq.xxx`
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Note: The last_active_at column already exists in profiles table.
-- No additional DDL changes required.
