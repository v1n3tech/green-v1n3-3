-- Migration 027: Marketplace platform fees + V1N3 loyalty points
--
-- 1. Fee columns on marketplace_orders (recorded per order, fee taken from seller proceeds).
-- 2. platform_config: admin-editable key/value settings (fee %, points rates).
-- 3. profiles.points_balance + points_lifetime: loyalty point wallet.
-- 4. points_ledger: immutable audit trail of every point change.
-- 5. points_conversions: record of points -> V1N3 redemptions.
-- 6. RPCs: award_points(), spend_points_for_conversion().

-- ---------------------------------------------------------------------------
-- 1. Fee columns on orders
-- ---------------------------------------------------------------------------
ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS platform_fee_v1n3 NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee_ngn  NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_net_v1n3   NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_signature     TEXT;

-- ---------------------------------------------------------------------------
-- 2. Platform config (admin-editable). Mirrors the staking_config pattern.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_config_select_all ON public.platform_config;
CREATE POLICY platform_config_select_all ON public.platform_config
  FOR SELECT USING (true);

INSERT INTO public.platform_config (key, value, description) VALUES
  ('marketplace_fee_percent', '2.5'::jsonb, 'Platform fee percent taken from each marketplace sale'),
  ('points_per_transaction',  '40'::jsonb,  'Loyalty points awarded per completed marketplace checkout'),
  ('points_per_v1n3',         '1000'::jsonb,'Points required to redeem 1 V1N3'),
  ('min_conversion_points',   '1000'::jsonb,'Minimum points balance required to redeem')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Points balance on profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points_balance  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_lifetime INTEGER NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 4. Points ledger (immutable audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON public.points_ledger(user_id);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS points_ledger_select_own ON public.points_ledger;
CREATE POLICY points_ledger_select_own ON public.points_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. Points conversions (points -> V1N3 redemptions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.points_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  v1n3_amount NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  signature TEXT,
  treasury_wallet TEXT,
  user_wallet TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_conversions_user ON public.points_conversions(user_id);

ALTER TABLE public.points_conversions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS points_conversions_select_own ON public.points_conversions;
CREATE POLICY points_conversions_select_own ON public.points_conversions
  FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6a. award_points: add points + write ledger atomically. SECURITY DEFINER so
--     the server (service role / checkout) can credit users safely.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_delta INTEGER,
  p_reason TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET
    points_balance = points_balance + p_delta,
    points_lifetime = points_lifetime + GREATEST(p_delta, 0)
  WHERE id = p_user_id
  RETURNING points_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Profile % not found', p_user_id;
  END IF;

  INSERT INTO public.points_ledger (user_id, delta, reason, reference_type, reference_id, balance_after)
  VALUES (p_user_id, p_delta, p_reason, p_reference_type, p_reference_id, new_balance);

  RETURN new_balance;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6b. spend_points_for_conversion: deduct points for a redemption. Guards
--     against negative balances. Returns the new balance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.spend_points_for_conversion(
  p_user_id UUID,
  p_points INTEGER,
  p_conversion_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  SELECT points_balance INTO current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Profile % not found', p_user_id;
  END IF;

  IF current_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points: have %, need %', current_balance, p_points;
  END IF;

  UPDATE public.profiles
  SET points_balance = points_balance - p_points
  WHERE id = p_user_id
  RETURNING points_balance INTO new_balance;

  INSERT INTO public.points_ledger (user_id, delta, reason, reference_type, reference_id, balance_after)
  VALUES (p_user_id, -p_points, 'points_conversion', 'points_conversion', p_conversion_id, new_balance);

  RETURN new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_points(UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.spend_points_for_conversion(UUID, INTEGER, UUID) TO authenticated, service_role;
