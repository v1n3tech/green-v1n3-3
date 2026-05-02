-- Migration 005: username editing + V1n3 token balance
--
-- Adds:
--   1. v1n3_balance numeric column (the platform's native token balance,
--      separate from total_earnings which is denominated in NGN).
--   2. Case-insensitive unique index on profiles.display_name so the username
--      can act as a unique handle.
--   3. RPC update_display_name(p_new_name TEXT) — validates format/uniqueness,
--      and atomically promotes the FIRST user to claim the handle 'mantim'
--      (case-insensitive) to the admin role. Subsequent attempts to take
--      'mantim' fail because of the unique index.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS v1n3_balance NUMERIC(18, 4) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_name_lower_key
  ON public.profiles (lower(display_name))
  WHERE display_name IS NOT NULL;

CREATE OR REPLACE FUNCTION public.update_display_name(p_new_name TEXT)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid           UUID := auth.uid();
  v_clean         TEXT;
  v_lower         TEXT;
  v_admin_exists  BOOLEAN;
  v_target_role   user_role;
  v_row           public.profiles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_clean := trim(coalesce(p_new_name, ''));

  -- Format: 3–24 chars, letters/digits/underscores/hyphens.
  IF v_clean = '' THEN
    RAISE EXCEPTION 'username cannot be empty';
  END IF;
  IF length(v_clean) < 3 OR length(v_clean) > 24 THEN
    RAISE EXCEPTION 'username must be 3–24 characters';
  END IF;
  IF v_clean !~ '^[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'username may only contain letters, numbers, underscores and hyphens';
  END IF;

  v_lower := lower(v_clean);

  -- Uniqueness (case-insensitive). Allow taking the same name you already own.
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(display_name) = v_lower AND id <> v_uid
  ) THEN
    RAISE EXCEPTION 'username is already taken';
  END IF;

  -- Founder claim: first user to take 'mantim' becomes admin.
  IF v_lower = 'mantim' THEN
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') INTO v_admin_exists;
    IF NOT v_admin_exists THEN
      v_target_role := 'admin'::user_role;
    END IF;
  END IF;

  UPDATE public.profiles SET
    display_name = v_clean,
    role         = COALESCE(v_target_role, role),
    updated_at   = NOW()
  WHERE id = v_uid
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_display_name(TEXT) TO authenticated;
