-- Migration: Message reactions and realtime improvements
-- Date: 2026-05-16
-- Description: Create message_reactions table with RLS and realtime

-- Create message_reactions table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see reactions on messages they can see
CREATE POLICY "reactions_select" ON message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m 
    JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = message_reactions.message_id 
    AND cp.user_id = auth.uid() 
    AND cp.left_at IS NULL
  )
);

-- RLS: Users can add reactions
CREATE POLICY "reactions_insert" ON message_reactions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS: Users can remove their own reactions
CREATE POLICY "reactions_delete" ON message_reactions FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- Set replica identity full for filtered subscriptions
ALTER TABLE message_reactions REPLICA IDENTITY FULL;

-- Create index for fast lookup
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);

-- Enable realtime for profiles table (for header username updates)
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER TABLE profiles REPLICA IDENTITY FULL;
