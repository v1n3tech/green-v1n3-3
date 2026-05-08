-- Migration: 012c_create_messaging_helper_function.sql
-- Description: Creates the is_conversation_member helper function for RLS policies
-- Date: 2026-05-08
-- 
-- This function is used by RLS policies on conversations table to check membership
-- It uses SECURITY DEFINER to avoid infinite recursion in RLS checks

-- Create the is_conversation_member function
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id 
    AND user_id = uid 
    AND left_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_conversation_member(UUID, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION is_conversation_member IS 'Checks if a user is an active participant in a conversation. Used by RLS policies.';
