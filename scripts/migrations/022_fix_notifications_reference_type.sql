-- ============================================
-- FIX NOTIFICATIONS REFERENCE_TYPE CONSTRAINT
-- Migration: 022_fix_notifications_reference_type.sql
-- Created: 2026-05-21
-- ============================================

-- Fix the reference_type constraint to include 'broadcast'
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_reference_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_reference_type_check 
CHECK (reference_type IS NULL OR reference_type IN (
  'conversation', 'message', 'request', 'assignment', 
  'news', 'payment', 'badge', 'profile', 'community', 'broadcast'
));
