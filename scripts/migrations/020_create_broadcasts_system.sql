-- ============================================
-- ADMIN BROADCASTS SYSTEM
-- ============================================
-- Migration: 020_create_broadcasts_system.sql
-- Created: 2026-05-19
-- Description: Admin broadcast system for announcements with audience targeting

-- Broadcasts table for admin announcements
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'executives', 'gcm', 'lgpa', 'scc', 'admins')),
  target_community TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  recipients_count INTEGER DEFAULT 0,
  reads_count INTEGER DEFAULT 0
);

-- Broadcast reads tracking
CREATE TABLE IF NOT EXISTS broadcast_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(broadcast_id, user_id)
);

-- Indexes and RLS policies applied via migration
