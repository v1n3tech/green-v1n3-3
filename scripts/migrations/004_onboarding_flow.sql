-- Migration: onboarding_flow_helpers
-- Created: 2026-05-02
-- Description: Adds an index on onboarding_completed for cheap middleware
--              lookups, plus a SECURITY DEFINER RPC `complete_onboarding`
--              that atomically validates + updates a user's profile to finish
--              the onboarding wizard, regenerating an agro_id if missing.

-- 1. Index for middleware redirect checks (cheap covering lookup).
CREATE INDEX IF NOT EXISTS idx_profiles_id_onboarding_completed
  ON public.profiles(id, onboarding_completed);

-- 2. complete_onboarding RPC.
--    Locked to the calling auth.uid(); SECURITY DEFINER bypasses RLS so we
--    can also generate the agro_id via generate_agro_id() in the same call.
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_first_name             TEXT,
  p_last_name              TEXT,
  p_phone                  TEXT,
  p_lga                    TEXT,
  p_role                   user_role,
  p_community              agro_community     DEFAULT NULL,
  p_secondary_communities  agro_community[]   DEFAULT '{}',
  p_bio                    TEXT               DEFAULT NULL,
  p_avatar_url             TEXT               DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid     UUID := auth.uid();
  v_agro_id TEXT;
  v_row     public.profiles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Validation
  IF coalesce(trim(p_first_name), '') = '' THEN
    RAISE EXCEPTION 'first_name is required';
  END IF;
  IF coalesce(trim(p_last_name), '') = '' THEN
    RAISE EXCEPTION 'last_name is required';
  END IF;
  IF coalesce(trim(p_lga), '') = '' THEN
    RAISE EXCEPTION 'lga is required';
  END IF;
  IF p_role = 'agro_executive' AND p_community IS NULL THEN
    RAISE EXCEPTION 'agro_executive requires a primary community';
  END IF;

  -- Reuse existing agro_id if present, otherwise mint a fresh one.
  SELECT agro_id INTO v_agro_id FROM public.profiles WHERE id = v_uid;
  IF v_agro_id IS NULL THEN
    v_agro_id := public.generate_agro_id();
  END IF;

  UPDATE public.profiles SET
    first_name             = p_first_name,
    last_name              = p_last_name,
    phone                  = p_phone,
    lga                    = p_lga,
    role                   = p_role,
    community              = p_community,
    secondary_communities  = COALESCE(p_secondary_communities, '{}'),
    bio                    = COALESCE(p_bio, bio),
    avatar_url             = COALESCE(p_avatar_url, avatar_url),
    agro_id                = v_agro_id,
    onboarding_completed   = true,
    updated_at             = NOW()
  WHERE id = v_uid
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_onboarding(
  TEXT, TEXT, TEXT, TEXT, user_role, agro_community, agro_community[], TEXT, TEXT
) TO authenticated;
