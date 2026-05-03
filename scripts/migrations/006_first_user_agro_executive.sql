-- Migration: 006_first_user_agro_executive
--
-- Server-enforces the rule that ONLY the first user to complete onboarding
-- becomes the founding Agro Executive. Every subsequent user is forced to
-- role = 'user' (regular) regardless of any client-provided role/community.
--
-- Race-safety: a transaction-scoped advisory lock serializes all calls to
-- complete_onboarding so two concurrent first-time signups can't both win
-- the "first user" race. Without this, READ COMMITTED would allow both
-- transactions to see "no other onboarded user" simultaneously.
--
-- The p_role parameter is kept in the signature for backwards compat with
-- already-deployed client code, but its value is IGNORED by the function.

CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_first_name             TEXT,
  p_last_name              TEXT,
  p_phone                  TEXT,
  p_lga                    TEXT,
  p_role                   user_role,                       -- ignored
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
  v_uid              UUID := auth.uid();
  v_agro_id          TEXT;
  v_row              public.profiles;
  v_other_onboarded  BOOLEAN;
  v_final_role       user_role;
  v_final_community  agro_community;
  v_final_secondary  agro_community[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF coalesce(trim(p_first_name), '') = '' THEN
    RAISE EXCEPTION 'first_name is required';
  END IF;
  IF coalesce(trim(p_last_name), '') = '' THEN
    RAISE EXCEPTION 'last_name is required';
  END IF;
  IF coalesce(trim(p_lga), '') = '' THEN
    RAISE EXCEPTION 'lga is required';
  END IF;

  -- Serialize all concurrent first-time onboardings so only one row can ever
  -- win the founding-executive slot.
  PERFORM pg_advisory_xact_lock(hashtext('complete_onboarding_first_user'));

  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE onboarding_completed = TRUE AND id <> v_uid
  ) INTO v_other_onboarded;

  IF v_other_onboarded THEN
    -- Subsequent users always register as regular users. Admin promotes them.
    v_final_role      := 'user'::user_role;
    v_final_community := NULL;
    v_final_secondary := '{}';
  ELSE
    -- Founding Agro Executive: must select a primary community on signup.
    IF p_community IS NULL THEN
      RAISE EXCEPTION 'first user must select a primary community';
    END IF;
    v_final_role      := 'agro_executive'::user_role;
    v_final_community := p_community;
    v_final_secondary := COALESCE(p_secondary_communities, '{}');
  END IF;

  SELECT agro_id INTO v_agro_id FROM public.profiles WHERE id = v_uid;
  IF v_agro_id IS NULL THEN
    v_agro_id := public.generate_agro_id();
  END IF;

  UPDATE public.profiles SET
    first_name             = p_first_name,
    last_name              = p_last_name,
    phone                  = p_phone,
    lga                    = p_lga,
    role                   = v_final_role,
    community              = v_final_community,
    secondary_communities  = v_final_secondary,
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
