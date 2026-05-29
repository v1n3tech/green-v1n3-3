-- Migration 025: Marketplace Products
-- Created: 2026-05-29
-- Description: Real on-chain-of-record marketplace listings.
--   - Executives (agro_executive, lgpa, scc_member) can submit products -> 'pending_review'
--   - GCMs and Admins can list products directly -> auto 'approved'
--   - GCMs can list on behalf of a community (on_behalf_of_community flag)
--   - GCMs/Admins approve or reject pending listings
--   - Explorers (role 'user') can browse approved listings and favorite them
--
-- Depends on:
--   - profiles (id, role, community)
--   - user_role enum: agro_executive | gcm | lgpa | scc_member | admin | user
--   - agro_community enum
--   - public.update_updated_at() trigger function (from migration 001)

-- ============================================
-- ENUMS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
    CREATE TYPE product_status AS ENUM (
      'pending_review',
      'approved',
      'rejected',
      'archived'
    );
  END IF;
END $$;

-- ============================================
-- MARKETPLACE PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Listing owner (executive / gcm / admin who created it)
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Community the product belongs to / is listed under.
  -- Nullable so admins can list cross-community products.
  community agro_community,

  -- True when a GCM lists this on behalf of the community rather than personally.
  on_behalf_of_community BOOLEAN DEFAULT false,

  -- Core details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other', -- crops | livestock | equipment | seeds | fertilizer | services | other

  -- Pricing in V1n3 / Naira value
  price NUMERIC NOT NULL DEFAULT 0,
  price_unit TEXT DEFAULT 'each', -- per kg, per bag, per bird, per hectare, etc.
  quantity_available INTEGER,
  location TEXT,

  -- Media
  thumbnail TEXT,
  gallery TEXT[],
  tags TEXT[],

  -- Approval workflow
  status product_status NOT NULL DEFAULT 'pending_review',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Stats
  views_count INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PRODUCT FAVORITES (wishlist)
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_seller ON public.marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_community ON public.marketplace_products(community);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.marketplace_products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.marketplace_products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_product_favorites_product ON public.product_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_product_favorites_user ON public.product_favorites(user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Who can create marketplace listings: all executive tiers + gcm + admin.
CREATE OR REPLACE FUNCTION public.can_list_products(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  RETURN v_role IN ('agro_executive', 'gcm', 'lgpa', 'scc_member', 'admin');
END;
$$;

-- Who can approve / reject listings: gcm + admin only.
CREATE OR REPLACE FUNCTION public.can_approve_products(p_user_id UUID)
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

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: marketplace_products
-- ============================================

-- Anyone can view approved, active listings
CREATE POLICY products_select_approved ON public.marketplace_products
  FOR SELECT USING (status = 'approved' AND is_active = true);

-- Sellers can view their own listings in any status
CREATE POLICY products_select_own ON public.marketplace_products
  FOR SELECT USING (auth.uid() = seller_id);

-- Approvers (GCM/Admin) can view every listing for the review queue
CREATE POLICY products_select_approvers ON public.marketplace_products
  FOR SELECT USING (public.can_approve_products(auth.uid()));

-- Only eligible roles can insert, and only as themselves
CREATE POLICY products_insert ON public.marketplace_products
  FOR INSERT WITH CHECK (
    auth.uid() = seller_id AND public.can_list_products(auth.uid())
  );

-- Sellers can update their own listings
CREATE POLICY products_update_own ON public.marketplace_products
  FOR UPDATE USING (auth.uid() = seller_id);

-- Approvers can update any listing (approve / reject / feature)
CREATE POLICY products_update_approvers ON public.marketplace_products
  FOR UPDATE USING (public.can_approve_products(auth.uid()));

-- Sellers can delete their own listings
CREATE POLICY products_delete_own ON public.marketplace_products
  FOR DELETE USING (auth.uid() = seller_id);

-- Approvers can delete any listing (moderation)
CREATE POLICY products_delete_approvers ON public.marketplace_products
  FOR DELETE USING (public.can_approve_products(auth.uid()));

-- ============================================
-- RLS POLICIES: product_favorites
-- ============================================

CREATE POLICY product_favorites_select_own ON public.product_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY product_favorites_insert_own ON public.product_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY product_favorites_delete_own ON public.product_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER marketplace_products_updated_at
  BEFORE UPDATE ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Keep favorites_count in sync
CREATE OR REPLACE FUNCTION public.sync_product_favorites_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.marketplace_products
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.marketplace_products
    SET favorites_count = GREATEST(favorites_count - 1, 0)
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_product_favorite_change
  AFTER INSERT OR DELETE ON public.product_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_product_favorites_count();

-- Increment view count (callable from app)
CREATE OR REPLACE FUNCTION public.increment_product_views(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_products
  SET views_count = views_count + 1
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_product_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_product_views(UUID) TO anon;
