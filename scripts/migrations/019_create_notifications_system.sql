-- ============================================
-- COMPREHENSIVE NOTIFICATIONS SYSTEM
-- Migration: 019_create_notifications_system.sql
-- Created: 2026-05-19
-- ============================================

-- Create unified notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification type
  type TEXT NOT NULL CHECK (type IN (
    'message',           -- New message received
    'message_reaction',  -- Someone reacted to your message
    'request_received',  -- New member request (for GCMs/admins)
    'request_approved',  -- Your request was approved
    'request_rejected',  -- Your request was rejected
    'assignment_new',    -- New assignment assigned to you
    'assignment_graded', -- Your assignment was graded
    'assignment_due',    -- Assignment due reminder
    'news_published',    -- New news article in your community
    'payment_received',  -- Payment received
    'payment_sent',      -- Payment sent confirmation
    'badge_earned',      -- New badge/achievement earned
    'system',            -- System announcements
    'admin_alert',       -- Admin-specific alerts
    'security'           -- Security alerts (login, password change)
  )),
  
  -- Content
  title TEXT NOT NULL,
  body TEXT,
  
  -- Reference to related entity
  reference_type TEXT CHECK (reference_type IN (
    'conversation', 'message', 'request', 'assignment', 
    'news', 'payment', 'badge', 'profile', 'community'
  )),
  reference_id UUID,
  
  -- Action URL (where to navigate when clicked)
  action_url TEXT,
  
  -- Metadata (flexible JSON for extra data)
  metadata JSONB DEFAULT '{}',
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ -- Optional expiry for temporary notifications
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_type, reference_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  email_frequency TEXT DEFAULT 'instant' CHECK (email_frequency IN ('instant', 'daily', 'weekly', 'never')),
  messages_enabled BOOLEAN DEFAULT true,
  requests_enabled BOOLEAN DEFAULT true,
  assignments_enabled BOOLEAN DEFAULT true,
  news_enabled BOOLEAN DEFAULT true,
  payments_enabled BOOLEAN DEFAULT true,
  system_enabled BOOLEAN DEFAULT true,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
