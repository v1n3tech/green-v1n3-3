-- Migration 012: Create Messaging System
-- Tables for direct messages, group chats, and permission-based messaging

-- =============================================
-- CONVERSATIONS TABLE
-- Handles both direct messages and group chats
-- =============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Conversation type: 'direct' or 'group'
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  
  -- For group chats: name, description, avatar
  name TEXT,
  description TEXT,
  avatar_url TEXT,
  
  -- For community group chats
  community TEXT, -- matches agro_community enum value
  
  -- For request-based conversations
  request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  
  -- Status
  is_active BOOLEAN DEFAULT true
);

-- =============================================
-- CONVERSATION PARTICIPANTS TABLE
-- Links users to conversations with roles
-- =============================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Participant role in conversation
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  
  -- Read tracking
  last_read_at TIMESTAMPTZ DEFAULT now(),
  unread_count INTEGER DEFAULT 0,
  
  -- Status
  is_muted BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ,
  
  -- Unique constraint: user can only be in a conversation once
  UNIQUE(conversation_id, user_id)
);

-- =============================================
-- MESSAGES TABLE
-- Stores all messages
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL,
  
  -- Optional: reply to another message
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Message type: text, image, file, system
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  
  -- For file/image messages
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ,
  
  -- Status
  is_deleted BOOLEAN DEFAULT false
);

-- =============================================
-- MESSAGE READ STATUS TABLE
-- Tracks who has read each message
-- =============================================
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(message_id, user_id)
);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR CONVERSATIONS
-- =============================================

-- Users can view conversations they participate in
CREATE POLICY conversations_select_participant ON conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
    AND conversation_participants.left_at IS NULL
  )
);

-- Users can create conversations
CREATE POLICY conversations_insert ON conversations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admins of a conversation can update it
CREATE POLICY conversations_update ON conversations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
    AND conversation_participants.role IN ('admin', 'moderator')
  )
);

-- =============================================
-- RLS POLICIES FOR PARTICIPANTS
-- =============================================

-- Users can view participants of conversations they're in
CREATE POLICY participants_select ON conversation_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
);

-- Users can join conversations (with permission checks in app layer)
CREATE POLICY participants_insert ON conversation_participants
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own participant record
CREATE POLICY participants_update_own ON conversation_participants
FOR UPDATE USING (user_id = auth.uid());

-- Users can leave conversations (update left_at)
CREATE POLICY participants_delete ON conversation_participants
FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- RLS POLICIES FOR MESSAGES
-- =============================================

-- Users can view messages in conversations they participate in
CREATE POLICY messages_select ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
    AND conversation_participants.left_at IS NULL
  )
);

-- Users can send messages to conversations they participate in
CREATE POLICY messages_insert ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
    AND conversation_participants.left_at IS NULL
  )
);

-- Users can update their own messages (edit)
CREATE POLICY messages_update_own ON messages
FOR UPDATE USING (sender_id = auth.uid());

-- =============================================
-- RLS POLICIES FOR MESSAGE READS
-- =============================================

-- Users can view read status for their conversations
CREATE POLICY message_reads_select ON message_reads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = message_reads.message_id
    AND cp.user_id = auth.uid()
    AND cp.left_at IS NULL
  )
);

-- Users can mark messages as read
CREATE POLICY message_reads_insert ON message_reads
FOR INSERT WITH CHECK (user_id = auth.uid());

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_conversations_community ON conversations(community);
CREATE INDEX IF NOT EXISTS idx_conversations_request_id ON conversations(request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update conversation's last_message_at when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  
  -- Increment unread count for all participants except sender
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
  AND user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Reset unread count when user reads messages
CREATE OR REPLACE FUNCTION reset_unread_on_read()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE conversation_participants
  SET unread_count = 0, last_read_at = now()
  WHERE conversation_id = (SELECT conversation_id FROM messages WHERE id = NEW.message_id)
  AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_read ON message_reads;
CREATE TRIGGER on_message_read
  AFTER INSERT ON message_reads
  FOR EACH ROW
  EXECUTE FUNCTION reset_unread_on_read();

-- Updated at trigger for messages
DROP TRIGGER IF EXISTS messages_updated_at ON messages;
CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Updated at trigger for conversations
DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
