-- Migration 002b: Update signup trigger to use 'user' role
-- Created: 2026-05-02
-- Description: Updates handle_new_user trigger so first user becomes agro_executive,
--              all subsequent users get 'user' role by default.
--
-- PREREQUISITE: Migration 002a must be run and committed first.

-- Update handle_new_user function with first-user logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  assigned_role user_role;
BEGIN
  -- Count existing profiles to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- First user becomes agro_executive, rest become regular users
  IF user_count = 0 THEN
    assigned_role := 'agro_executive';
  ELSE
    assigned_role := 'user';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    wallet_address,
    display_name,
    first_name,
    last_name,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'wallet_address', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', NULL),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    wallet_address = COALESCE(EXCLUDED.wallet_address, public.profiles.wallet_address),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Update the default value for role column
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- Current user_role enum values after this migration:
-- 'agro_executive' - First user / promoted users
-- 'gcm' - Green V1n3 Community Manager
-- 'lgpa' - Local Government Program Administrator
-- 'scc_member' - State Coordinating Council member
-- 'admin' - System administrator
-- 'user' - Regular user (default for all new signups after first)
