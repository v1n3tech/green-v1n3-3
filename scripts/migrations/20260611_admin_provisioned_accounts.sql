-- Migration: admin_provisioned_accounts
-- Created: 2026-06-11
-- Description: Adds audit columns to profiles so we can track accounts that
--              were created directly by an admin via the Organization console
--              (as opposed to self sign-up). No destructive changes.

-- Who provisioned this account (admin user id), and when.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provisioned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ;

-- Cheap lookup for the "provisioned accounts" list in the admin console.
CREATE INDEX IF NOT EXISTS idx_profiles_provisioned_by
  ON public.profiles(provisioned_by);
