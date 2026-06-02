-- Migration 029: Terminal Managers
-- Created: 2026-06-02
-- Description: Lets the Agro Marketing GCM (and admins) appoint executives as
--   "terminal managers". A terminal manager gets access to the Terminal
--   dashboard and confirms when a buyer who chose terminal pickup has actually
--   collected their order.
--
-- Depends on:
--   - profiles (id, role user_role, community agro_community, secondary_communities)
--   - marketplace_orders (id, fulfillment_method, fulfillment_status) [migration 028]
--   - public.update_updated_at() [migration 001]

-- ============================================
-- TABLE: terminal_managers
-- ============================================

CREATE TABLE IF NOT EXISTS public.terminal_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_terminal_managers_active ON public.terminal_managers(is_active);

-- ============================================
-- ORDERS: pickup confirmation audit columns
-- ============================================

ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS picked_up_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================
-- ROLE HELPERS (SECURITY DEFINER)
-- ============================================

-- Who can appoint / revoke terminal managers: the Agro Marketing GCM
-- (primary OR secondary community) + admins.
CREATE OR REPLACE FUNCTION public.can_appoint_terminal_managers(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_community agro_community;
  v_secondary agro_community[];
BEGIN
  SELECT role, community, secondary_communities
    INTO v_role, v_community, v_secondary
  FROM public.profiles WHERE id = p_user_id;

  IF v_role = 'admin' THEN
    RETURN true;
  END IF;

  RETURN v_role = 'gcm'
     AND (v_community = 'agro_marketing'
          OR 'agro_marketing' = ANY (COALESCE(v_secondary, ARRAY[]::agro_community[])));
END;
$$;

-- Who can operate the Terminal dashboard / confirm pickups: an active
-- terminal manager, OR anyone who can appoint them (marketing GCM + admin).
CREATE OR REPLACE FUNCTION public.is_terminal_manager(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.can_appoint_terminal_managers(p_user_id) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.terminal_managers
    WHERE user_id = p_user_id AND is_active = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_appoint_terminal_managers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_terminal_manager(UUID) TO authenticated;

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.terminal_managers ENABLE ROW LEVEL SECURITY;

-- A user can see their own appointment; appointers (marketing GCM + admin)
-- can see every appointment.
CREATE POLICY terminal_managers_select ON public.terminal_managers
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.can_appoint_terminal_managers(auth.uid())
  );

CREATE POLICY terminal_managers_insert ON public.terminal_managers
  FOR INSERT WITH CHECK (public.can_appoint_terminal_managers(auth.uid()));

CREATE POLICY terminal_managers_update ON public.terminal_managers
  FOR UPDATE USING (public.can_appoint_terminal_managers(auth.uid()));

CREATE POLICY terminal_managers_delete ON public.terminal_managers
  FOR DELETE USING (public.can_appoint_terminal_managers(auth.uid()));

-- ============================================
-- RLS: marketplace_orders — terminal manager pickup oversight
-- ============================================

-- Terminal managers can read every order so they can locate pickups.
CREATE POLICY orders_select_terminal_manager ON public.marketplace_orders
  FOR SELECT USING (public.is_terminal_manager(auth.uid()));

-- Terminal managers can update orders (used to mark them collected).
CREATE POLICY orders_update_terminal_manager ON public.marketplace_orders
  FOR UPDATE USING (public.is_terminal_manager(auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER terminal_managers_updated_at
  BEFORE UPDATE ON public.terminal_managers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
