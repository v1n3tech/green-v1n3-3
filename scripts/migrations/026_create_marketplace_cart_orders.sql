-- Migration 026: Marketplace Cart & Orders
-- Created: 2026-06-01
-- Description: Database-backed shopping cart and on-chain V1N3 settled orders.
--   - cart_items: one row per (buyer, product); survives reloads and syncs across devices.
--   - marketplace_orders: immutable record of a purchase. Settlement happens on-chain
--     (V1N3 SPL transfer buyer -> seller) at checkout; the order stores the NGN snapshot,
--     the V1N3 amount actually moved, and the Solana transaction signature.
--   - record_product_purchase(): atomically decrement inventory + bump orders_count.
--
-- Depends on:
--   - profiles (id)
--   - marketplace_products (id, price, seller_id, quantity_available, orders_count)
--   - agro_community enum
--   - public.update_updated_at() trigger function (from migration 001)

-- ============================================
-- CART ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON public.cart_items(product_id);

-- ============================================
-- ORDER STATUS ENUM
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending',
      'paid',
      'failed',
      'fulfilled',
      'cancelled'
    );
  END IF;
END $$;

-- ============================================
-- MARKETPLACE ORDERS
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Keep the order even if the seller account or product is removed.
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.marketplace_products(id) ON DELETE SET NULL,

  -- Snapshot of the product at time of purchase (so the order is self-describing).
  product_title TEXT NOT NULL,
  product_thumbnail TEXT,
  community agro_community,

  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),

  -- Pricing snapshot (NGN value the marketplace displays).
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',

  -- On-chain settlement detail.
  v1n3_amount NUMERIC NOT NULL DEFAULT 0,
  payment_signature TEXT,
  buyer_wallet TEXT,
  seller_wallet TEXT,

  status order_status NOT NULL DEFAULT 'pending',
  memo TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_product ON public.marketplace_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.marketplace_orders(status);

-- ============================================
-- ATOMIC PURCHASE BOOKKEEPING
-- ============================================

-- Decrement available inventory (when tracked) and bump the orders counter.
-- SECURITY DEFINER so it runs regardless of the caller's RLS on the product row.
CREATE OR REPLACE FUNCTION public.record_product_purchase(p_product_id UUID, p_qty INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_products
  SET
    quantity_available = CASE
      WHEN quantity_available IS NULL THEN NULL
      ELSE GREATEST(quantity_available - p_qty, 0)
    END,
    orders_count = orders_count + 1
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_product_purchase(UUID, INTEGER) TO authenticated;

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: cart_items (owner only)
-- ============================================

CREATE POLICY cart_items_select_own ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY cart_items_insert_own ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY cart_items_update_own ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY cart_items_delete_own ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: marketplace_orders
-- ============================================

-- Buyers can see their own orders.
CREATE POLICY orders_select_buyer ON public.marketplace_orders
  FOR SELECT USING (auth.uid() = buyer_id);

-- Sellers can see orders placed against them.
CREATE POLICY orders_select_seller ON public.marketplace_orders
  FOR SELECT USING (auth.uid() = seller_id);

-- Buyers create their own orders (server inserts as the buyer).
CREATE POLICY orders_insert_buyer ON public.marketplace_orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update fulfillment status on their orders.
CREATE POLICY orders_update_seller ON public.marketplace_orders
  FOR UPDATE USING (auth.uid() = seller_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER marketplace_orders_updated_at
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
