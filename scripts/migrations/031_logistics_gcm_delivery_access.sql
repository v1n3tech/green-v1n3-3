-- Migration 031: Logistics GCM delivery access
-- Created: 2026-06-02
-- Description: Fixes a chicken-and-egg RLS deadlock that prevented the Agro
--   Logistics GCM from ever seeing or accepting new delivery requests.
--
--   A freshly created delivery_request has logistics_gcm_id = NULL (it is only
--   set WHEN a GCM accepts). The previous delivery_requests SELECT/UPDATE
--   policies only matched seller_id / logistics_gcm_id / assigned_executive_id
--   / marketing members, so a logistics GCM who had not accepted yet:
--     * could not SELECT pending requests (dashboard showed "no open requests"),
--     * could not UPDATE to accept them (USING evaluated the pre-update row
--       where logistics_gcm_id was still NULL).
--
--   This migration adds an is_logistics_gcm() helper (mirroring is_marketing_member)
--   and folds it into the delivery_requests SELECT/UPDATE policies. It also lets
--   the logistics GCM read + update the related marketplace_orders so the joined
--   order details load and completeDelivery() can sync fulfillment_status.
--
-- Depends on:
--   - profiles (id, role user_role, community agro_community, secondary_communities)
--   - delivery_requests + RLS [migration 028]
--   - marketplace_orders [migration 026]

-- ============================================
-- ROLE HELPER (SECURITY DEFINER, mirrors is_marketing_member / can_appoint_terminal_managers)
-- ============================================

-- The Agro Logistics GCM (primary OR secondary community) + admins.
CREATE OR REPLACE FUNCTION public.is_logistics_gcm(p_user_id UUID)
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
     AND (v_community = 'agro_logistics'
          OR 'agro_logistics' = ANY (COALESCE(v_secondary, ARRAY[]::agro_community[])));
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_logistics_gcm(UUID) TO authenticated;

-- ============================================
-- RLS: delivery_requests — let the logistics GCM see + manage every request
-- ============================================

DROP POLICY IF EXISTS delivery_requests_select ON public.delivery_requests;
CREATE POLICY delivery_requests_select ON public.delivery_requests
  FOR SELECT USING (
    auth.uid() = seller_id
    OR auth.uid() = logistics_gcm_id
    OR auth.uid() = assigned_executive_id
    OR public.is_marketing_member(auth.uid())
    OR public.is_logistics_gcm(auth.uid())
  );

DROP POLICY IF EXISTS delivery_requests_update ON public.delivery_requests;
CREATE POLICY delivery_requests_update ON public.delivery_requests
  FOR UPDATE USING (
    auth.uid() = seller_id
    OR auth.uid() = logistics_gcm_id
    OR auth.uid() = assigned_executive_id
    OR public.is_logistics_gcm(auth.uid())
  );

-- ============================================
-- RLS: marketplace_orders — logistics fulfillment oversight
-- ============================================

-- Mirrors orders_select_marketing: logistics GCM reads orders so the joined
-- order details render on the delivery request cards.
DROP POLICY IF EXISTS orders_select_logistics ON public.marketplace_orders;
CREATE POLICY orders_select_logistics ON public.marketplace_orders
  FOR SELECT USING (public.is_logistics_gcm(auth.uid()));

-- Lets completeDelivery() sync fulfillment_status = 'delivered'.
DROP POLICY IF EXISTS orders_update_logistics ON public.marketplace_orders;
CREATE POLICY orders_update_logistics ON public.marketplace_orders
  FOR UPDATE USING (public.is_logistics_gcm(auth.uid()));
