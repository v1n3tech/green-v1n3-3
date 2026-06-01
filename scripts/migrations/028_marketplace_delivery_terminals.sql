-- Migration 028: Marketplace Delivery, Pickup Terminals & Logistics
-- Created: 2026-06-01
-- Description: Adds fulfillment (pickup vs delivery) to marketplace orders.
--   - marketplace_products: per-product delivery fee + delivery/pickup availability.
--   - marketplace_terminals: GCM/admin-managed pickup locations (Agro Marketing owns ops).
--   - marketplace_orders: fulfillment method/status, chosen terminal, delivery fee
--     (paid by the buyer in a SEPARATE on-chain V1N3 transfer after checkout),
--     and the delivery address snapshot.
--   - delivery_requests: a seller-raised request to the Agro Logistics community.
--     The logistics GCM accepts and sets the delivery time; later he may delegate
--     to an executive (assigned_executive_id) — mirrors service_assignments.
--
-- Fulfillment / fee model (locked with product owner):
--   * Goods are settled to the seller at checkout (existing flow, unchanged).
--   * Delivery fee is set by the seller PER PRODUCT (NGN).
--   * If the buyer chooses delivery, the buyer pays the delivery fee to the seller
--     in a separate V1N3 transfer; the seller then requests logistics.
--   * Pickup is free — buyer just picks a terminal.
--
-- Depends on:
--   - profiles (id, role user_role, community agro_community, secondary_communities)
--   - marketplace_products (id)
--   - marketplace_orders (id) [migration 026]
--   - public.update_updated_at() [migration 001]

-- ============================================
-- PRODUCTS: delivery options
-- ============================================

ALTER TABLE public.marketplace_products
  ADD COLUMN IF NOT EXISTS offers_delivery  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_available BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_fee     NUMERIC NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0);

-- ============================================
-- ROLE HELPERS (SECURITY DEFINER, mirror migration 025 style)
-- ============================================

-- Who can CRUD pickup terminals: gcm + admin (Agro Marketing GCM owns these).
CREATE OR REPLACE FUNCTION public.can_manage_terminals(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  RETURN v_role IN ('gcm', 'admin');
END;
$$;

-- Members of the Agro Marketing community (primary OR secondary) + admins.
-- Used to let Marketing see every marketplace order for fulfillment oversight.
CREATE OR REPLACE FUNCTION public.is_marketing_member(p_user_id UUID)
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

  RETURN v_community = 'agro_marketing'
      OR 'agro_marketing' = ANY (COALESCE(v_secondary, ARRAY[]::agro_community[]));
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_terminals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_marketing_member(UUID) TO authenticated;

-- ============================================
-- PICKUP TERMINALS
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Plateau',
  lga TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terminals_active ON public.marketplace_terminals(is_active);
CREATE INDEX IF NOT EXISTS idx_terminals_lga ON public.marketplace_terminals(lga);

-- ============================================
-- ORDERS: fulfillment columns
-- ============================================

-- fulfillment_method: NULL until the buyer chooses; then 'pickup' | 'delivery'.
-- fulfillment_status:
--   'pending'            – awaiting buyer choice
--   'pickup_selected'    – buyer chose a terminal (free)
--   'delivery_paid'      – buyer paid the delivery fee, awaiting seller to request logistics
--   'delivery_requested' – seller raised a logistics request
--   'scheduled'          – logistics accepted + set a time
--   'out_for_delivery'   – in transit
--   'delivered'          – delivered to buyer
--   'collected'          – picked up at terminal
--   'cancelled'
ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS fulfillment_method     TEXT,
  ADD COLUMN IF NOT EXISTS fulfillment_status     TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS terminal_id            UUID REFERENCES public.marketplace_terminals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_fee_ngn       NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee_v1n3      NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee_signature TEXT,
  ADD COLUMN IF NOT EXISTS delivery_paid_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_address       TEXT,
  ADD COLUMN IF NOT EXISTS delivery_state         TEXT,
  ADD COLUMN IF NOT EXISTS delivery_lga           TEXT,
  ADD COLUMN IF NOT EXISTS delivery_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_delivery_at  TIMESTAMPTZ;

ALTER TABLE public.marketplace_orders
  DROP CONSTRAINT IF EXISTS marketplace_orders_fulfillment_method_chk;
ALTER TABLE public.marketplace_orders
  ADD CONSTRAINT marketplace_orders_fulfillment_method_chk
  CHECK (fulfillment_method IS NULL OR fulfillment_method IN ('pickup', 'delivery'));

CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.marketplace_orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_terminal ON public.marketplace_orders(terminal_id);

-- ============================================
-- DELIVERY REQUESTS (seller -> logistics community)
-- ============================================

CREATE TABLE IF NOT EXISTS public.delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  logistics_gcm_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Set later when the logistics GCM delegates to a field executive.
  assigned_executive_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'in_transit' | 'delivered' | 'cancelled'
  status TEXT NOT NULL DEFAULT 'pending',

  -- Where goods are collected from (optional pickup terminal) + drop-off snapshot.
  pickup_terminal_id UUID REFERENCES public.marketplace_terminals(id) ON DELETE SET NULL,
  delivery_address TEXT,
  delivery_state TEXT,
  delivery_lga TEXT,
  delivery_contact_phone TEXT,

  notes TEXT,
  logistics_response TEXT,
  scheduled_delivery_at TIMESTAMPTZ,

  requested_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_delivery_requests_seller ON public.delivery_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_gcm ON public.delivery_requests(logistics_gcm_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_exec ON public.delivery_requests(assigned_executive_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON public.delivery_requests(status);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.marketplace_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS: marketplace_terminals
-- ============================================

-- Any authenticated user can read active terminals (to pick one at checkout/fulfillment).
CREATE POLICY terminals_select_active ON public.marketplace_terminals
  FOR SELECT USING (is_active = true);

-- Managers (GCM/admin) can read every terminal, including inactive ones.
CREATE POLICY terminals_select_managers ON public.marketplace_terminals
  FOR SELECT USING (public.can_manage_terminals(auth.uid()));

CREATE POLICY terminals_insert_managers ON public.marketplace_terminals
  FOR INSERT WITH CHECK (public.can_manage_terminals(auth.uid()));

CREATE POLICY terminals_update_managers ON public.marketplace_terminals
  FOR UPDATE USING (public.can_manage_terminals(auth.uid()));

CREATE POLICY terminals_delete_managers ON public.marketplace_terminals
  FOR DELETE USING (public.can_manage_terminals(auth.uid()));

-- ============================================
-- RLS: marketplace_orders — Marketing oversight
-- ============================================

-- Agro Marketing members (and admins) can see every order for fulfillment ops.
CREATE POLICY orders_select_marketing ON public.marketplace_orders
  FOR SELECT USING (public.is_marketing_member(auth.uid()));

-- ============================================
-- RLS: delivery_requests
-- ============================================

-- Visible to the seller who raised it, the logistics GCM it's routed to,
-- the assigned executive, and any marketing member / admin (oversight).
CREATE POLICY delivery_requests_select ON public.delivery_requests
  FOR SELECT USING (
    auth.uid() = seller_id
    OR auth.uid() = logistics_gcm_id
    OR auth.uid() = assigned_executive_id
    OR public.is_marketing_member(auth.uid())
  );

-- Sellers create their own delivery requests.
CREATE POLICY delivery_requests_insert_seller ON public.delivery_requests
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- The seller can update (e.g. cancel), and the logistics GCM / assigned
-- executive can update (accept, schedule, mark in-transit / delivered).
CREATE POLICY delivery_requests_update ON public.delivery_requests
  FOR UPDATE USING (
    auth.uid() = seller_id
    OR auth.uid() = logistics_gcm_id
    OR auth.uid() = assigned_executive_id
  );

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER marketplace_terminals_updated_at
  BEFORE UPDATE ON public.marketplace_terminals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER delivery_requests_updated_at
  BEFORE UPDATE ON public.delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
