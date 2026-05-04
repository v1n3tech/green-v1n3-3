-- Migration 009: Fix admin RLS policies
-- Created: 2026-05-04
-- Description: Fixes the broken admin RLS policies that were causing 500 errors
--              by removing the self-referential subquery that caused infinite recursion.
--              
-- ROLLBACK: This migration removes the problematic policies and restores functionality.
--           The admin-specific update capability will be handled via service_role in server actions.

-- Drop the problematic admin policies that caused 500 errors
DROP POLICY IF EXISTS profiles_admin_select ON profiles;
DROP POLICY IF EXISTS profiles_admin_update ON profiles;

-- NOTE: Admin role management will use the Supabase admin client (service_role)
-- which bypasses RLS entirely. This is the correct pattern for admin operations.
-- The existing policies are sufficient:
--   - profiles_select_public: allows anyone to SELECT (qual: true)
--   - profiles_select_own: allows users to SELECT their own row
--   - profiles_update_own: allows users to UPDATE their own row
--   - profiles_insert_own: allows users to INSERT their own row
--   - profiles_delete_own: allows users to DELETE their own row
