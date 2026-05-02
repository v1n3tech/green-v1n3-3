-- Migration: Add 'user' role and update signup trigger
-- Created: 2026-05-02
-- Description: Adds 'user' to user_role enum and updates the handle_new_user trigger
--              so that only the first registrant becomes an agro_executive,
--              while all subsequent users get the 'user' role by default.

-- Step 1: Add 'user' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';

-- Step 2: Update handle_new_user function with first-user logic
-- Note: This was split into two migrations because PostgreSQL requires
-- new enum values to be committed before they can be used in functions.

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

-- Step 3: Update the default value for role column
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- Current user_role enum values after this migration:
-- 'agro_executive' - First user / promoted users
-- 'gcm' - Green V1n3 Community Manager
-- 'lgpa' - Local Government Program Administrator
-- 'scc_member' - State Coordinating Council member
-- 'admin' - System administrator
-- 'user' - Regular user (default for all new signups after first)
