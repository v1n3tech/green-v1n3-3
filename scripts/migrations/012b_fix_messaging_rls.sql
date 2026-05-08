-- Migration: Fix RLS infinite recursion in conversation_participants
-- Run this AFTER 012_create_messaging_system.sql if you encounter the recursion error

-- Drop the problematic policy
DROP POLICY IF EXISTS participants_select ON conversation_participants;

-- Create a non-recursive policy
-- Users can view their own participation records directly
CREATE POLICY participants_select_own ON conversation_participants
FOR SELECT USING (user_id = auth.uid());

-- Users can view other participants in conversations they're in via a join-safe approach
-- This avoids the self-referential recursion by using a security definer function

-- Create a helper function to check conversation membership
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id
    AND user_id = uid
    AND left_at IS NULL
  );
$$;

-- Create policy using the helper function
CREATE POLICY participants_select_members ON conversation_participants
FOR SELECT USING (
  is_conversation_member(conversation_id, auth.uid())
);

-- Grant execute on the helper function
GRANT EXECUTE ON FUNCTION is_conversation_member(uuid, uuid) TO authenticated;
