-- Migration 007: News and Commodities Tables
-- Created: 2026-05-04
-- Description: Creates news_articles, news_categories, commodities tables
--              with RLS policies restricting write access to:
--              - Agro Media & Branding executives
--              - GCMs (Green V1n3 Community Managers)
--              - LGPAs (Local Government Program Administrators)
--              - SCC Members
--              - Admins

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE news_status AS ENUM (
  'draft',
  'pending_review',
  'published',
  'archived'
);

CREATE TYPE news_category_type AS ENUM (
  'agriculture',
  'crypto',
  'market',
  'technology',
  'policy',
  'community',
  'events'
);

CREATE TYPE commodity_type AS ENUM (
  'grain',
  'livestock',
  'produce',
  'cash_crop',
  'processed',
  'other'
);

-- ============================================
-- NEWS CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.news_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  type news_category_type NOT NULL DEFAULT 'agriculture',
  description TEXT,
  icon TEXT, -- icon name or emoji
  color TEXT, -- hex color for UI
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO public.news_categories (name, slug, type, description, color, sort_order) VALUES
  ('Agriculture', 'agriculture', 'agriculture', 'General agriculture news and updates', '#22c55e', 1),
  ('Crop News', 'crop-news', 'agriculture', 'News about crop farming and harvests', '#84cc16', 2),
  ('Livestock', 'livestock', 'agriculture', 'Animal farming and livestock news', '#f97316', 3),
  ('Crypto', 'crypto', 'crypto', 'Cryptocurrency and V1N3 token updates', '#8b5cf6', 4),
  ('Market', 'market', 'market', 'Market prices and trading updates', '#3b82f6', 5),
  ('Technology', 'technology', 'technology', 'Agro-tech innovations and digital solutions', '#06b6d4', 6),
  ('Policy', 'policy', 'policy', 'Government policies and regulations', '#64748b', 7),
  ('Community', 'community', 'community', 'AgroV1n3 community updates and stories', '#ec4899', 8),
  ('Events', 'events', 'events', 'Upcoming events, workshops and trainings', '#eab308', 9)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- NEWS ARTICLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT, -- short summary for cards
  content TEXT NOT NULL, -- full article (can be markdown/HTML)
  
  -- Media
  featured_image TEXT, -- URL to main image
  thumbnail TEXT, -- smaller preview image
  gallery TEXT[] DEFAULT '{}', -- additional images
  
  -- Classification
  category_id UUID REFERENCES public.news_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- Author info (references profiles)
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Status and visibility
  status news_status DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  is_breaking BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false, -- sticky at top
  
  -- Engagement metrics
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Timestamps
  published_at TIMESTAMPTZ, -- when it was published
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NEWS COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.news_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.news_comments(id) ON DELETE CASCADE, -- for replies
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NEWS LIKES TABLE (for tracking user likes)
-- ============================================

CREATE TABLE IF NOT EXISTS public.news_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- ============================================
-- NEWS BOOKMARKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.news_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- ============================================
-- COMMODITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.commodities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  symbol TEXT, -- short code like "MZE" for Maize
  description TEXT,
  
  -- Classification
  type commodity_type NOT NULL DEFAULT 'grain',
  unit TEXT NOT NULL DEFAULT 'kg', -- kg, bag, ton, crate, etc.
  
  -- Pricing (to be implemented later)
  current_price DECIMAL(15, 2),
  previous_price DECIMAL(15, 2),
  price_change_24h DECIMAL(10, 4), -- percentage
  high_24h DECIMAL(15, 2),
  low_24h DECIMAL(15, 2),
  
  -- Media
  image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  last_price_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some default commodities
INSERT INTO public.commodities (name, slug, symbol, type, unit, sort_order) VALUES
  ('Maize', 'maize', 'MZE', 'grain', 'bag', 1),
  ('Rice', 'rice', 'RCE', 'grain', 'bag', 2),
  ('Cassava', 'cassava', 'CSV', 'produce', 'ton', 3),
  ('Tomatoes', 'tomatoes', 'TMT', 'produce', 'crate', 4),
  ('Palm Oil', 'palm-oil', 'PLM', 'processed', 'litre', 5),
  ('Cocoa', 'cocoa', 'COC', 'cash_crop', 'kg', 6),
  ('Groundnut', 'groundnut', 'GNT', 'grain', 'bag', 7),
  ('Sorghum', 'sorghum', 'SRG', 'grain', 'bag', 8),
  ('Yam', 'yam', 'YAM', 'produce', 'tuber', 9),
  ('Beans', 'beans', 'BNS', 'grain', 'bag', 10),
  ('Cattle', 'cattle', 'CTL', 'livestock', 'head', 11),
  ('Goat', 'goat', 'GOT', 'livestock', 'head', 12),
  ('Chicken', 'chicken', 'CHK', 'livestock', 'bird', 13),
  ('Fish', 'fish', 'FSH', 'livestock', 'kg', 14)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_news_articles_author ON public.news_articles(author_id);
CREATE INDEX idx_news_articles_category ON public.news_articles(category_id);
CREATE INDEX idx_news_articles_status ON public.news_articles(status);
CREATE INDEX idx_news_articles_published_at ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_articles_is_featured ON public.news_articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_news_articles_slug ON public.news_articles(slug);

CREATE INDEX idx_news_comments_article ON public.news_comments(article_id);
CREATE INDEX idx_news_comments_author ON public.news_comments(author_id);
CREATE INDEX idx_news_comments_parent ON public.news_comments(parent_id);

CREATE INDEX idx_news_likes_article ON public.news_likes(article_id);
CREATE INDEX idx_news_likes_user ON public.news_likes(user_id);

CREATE INDEX idx_news_bookmarks_article ON public.news_bookmarks(article_id);
CREATE INDEX idx_news_bookmarks_user ON public.news_bookmarks(user_id);

CREATE INDEX idx_commodities_type ON public.commodities(type);
CREATE INDEX idx_commodities_slug ON public.commodities(slug);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Check if user can manage news
-- ============================================

CREATE OR REPLACE FUNCTION public.can_manage_news(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_community agro_community;
BEGIN
  SELECT role, community INTO v_role, v_community
  FROM public.profiles
  WHERE id = user_id;
  
  -- Admins, SCC members, LGPAs, and GCMs can always manage news
  IF v_role IN ('admin', 'scc_member', 'lgpa', 'gcm') THEN
    RETURN true;
  END IF;
  
  -- Agro executives in agro_media_branding community can manage news
  IF v_role = 'agro_executive' AND v_community = 'agro_media_branding' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- ============================================
-- RLS POLICIES: news_categories
-- ============================================

-- Everyone can read active categories
CREATE POLICY "news_categories_select_all" ON public.news_categories
  FOR SELECT USING (is_active = true);

-- Only news managers can insert/update/delete categories
CREATE POLICY "news_categories_insert" ON public.news_categories
  FOR INSERT WITH CHECK (public.can_manage_news(auth.uid()));

CREATE POLICY "news_categories_update" ON public.news_categories
  FOR UPDATE USING (public.can_manage_news(auth.uid()));

CREATE POLICY "news_categories_delete" ON public.news_categories
  FOR DELETE USING (public.can_manage_news(auth.uid()));

-- ============================================
-- RLS POLICIES: news_articles
-- ============================================

-- Everyone can read published articles
CREATE POLICY "news_articles_select_published" ON public.news_articles
  FOR SELECT USING (status = 'published');

-- Authors can see their own drafts
CREATE POLICY "news_articles_select_own" ON public.news_articles
  FOR SELECT USING (author_id = auth.uid());

-- News managers can see all articles (for review)
CREATE POLICY "news_articles_select_managers" ON public.news_articles
  FOR SELECT USING (public.can_manage_news(auth.uid()));

-- Only news managers can insert articles
CREATE POLICY "news_articles_insert" ON public.news_articles
  FOR INSERT WITH CHECK (public.can_manage_news(auth.uid()));

-- Authors can update their own articles, managers can update any
CREATE POLICY "news_articles_update_own" ON public.news_articles
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "news_articles_update_managers" ON public.news_articles
  FOR UPDATE USING (public.can_manage_news(auth.uid()));

-- Only managers can delete articles
CREATE POLICY "news_articles_delete" ON public.news_articles
  FOR DELETE USING (public.can_manage_news(auth.uid()));

-- ============================================
-- RLS POLICIES: news_comments
-- ============================================

-- Everyone can read approved comments
CREATE POLICY "news_comments_select_approved" ON public.news_comments
  FOR SELECT USING (is_approved = true);

-- Users can see their own comments
CREATE POLICY "news_comments_select_own" ON public.news_comments
  FOR SELECT USING (author_id = auth.uid());

-- Authenticated users can comment
CREATE POLICY "news_comments_insert" ON public.news_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "news_comments_update_own" ON public.news_comments
  FOR UPDATE USING (author_id = auth.uid());

-- Managers can update any comment (for moderation)
CREATE POLICY "news_comments_update_managers" ON public.news_comments
  FOR UPDATE USING (public.can_manage_news(auth.uid()));

-- Users can delete their own comments
CREATE POLICY "news_comments_delete_own" ON public.news_comments
  FOR DELETE USING (author_id = auth.uid());

-- Managers can delete any comment
CREATE POLICY "news_comments_delete_managers" ON public.news_comments
  FOR DELETE USING (public.can_manage_news(auth.uid()));

-- ============================================
-- RLS POLICIES: news_likes
-- ============================================

-- Anyone can see likes count (handled via aggregate)
CREATE POLICY "news_likes_select" ON public.news_likes
  FOR SELECT USING (true);

-- Authenticated users can like
CREATE POLICY "news_likes_insert" ON public.news_likes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can remove their own likes
CREATE POLICY "news_likes_delete" ON public.news_likes
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES: news_bookmarks
-- ============================================

-- Users can see their own bookmarks
CREATE POLICY "news_bookmarks_select_own" ON public.news_bookmarks
  FOR SELECT USING (user_id = auth.uid());

-- Authenticated users can bookmark
CREATE POLICY "news_bookmarks_insert" ON public.news_bookmarks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can remove their own bookmarks
CREATE POLICY "news_bookmarks_delete" ON public.news_bookmarks
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES: commodities
-- ============================================

-- Everyone can read active commodities
CREATE POLICY "commodities_select_all" ON public.commodities
  FOR SELECT USING (is_active = true);

-- Only news managers can manage commodities
CREATE POLICY "commodities_insert" ON public.commodities
  FOR INSERT WITH CHECK (public.can_manage_news(auth.uid()));

CREATE POLICY "commodities_update" ON public.commodities
  FOR UPDATE USING (public.can_manage_news(auth.uid()));

CREATE POLICY "commodities_delete" ON public.commodities
  FOR DELETE USING (public.can_manage_news(auth.uid()));

-- ============================================
-- TRIGGERS: updated_at
-- ============================================

CREATE TRIGGER news_categories_updated_at
  BEFORE UPDATE ON public.news_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER news_comments_updated_at
  BEFORE UPDATE ON public.news_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER commodities_updated_at
  BEFORE UPDATE ON public.commodities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- FUNCTION: Increment view count
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_article_views(article_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.news_articles
  SET views_count = views_count + 1
  WHERE id = article_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_article_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_article_views(UUID) TO anon;

-- ============================================
-- FUNCTION: Toggle like
-- ============================================

CREATE OR REPLACE FUNCTION public.toggle_article_like(p_article_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_exists BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.news_likes 
    WHERE article_id = p_article_id AND user_id = v_uid
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove like
    DELETE FROM public.news_likes 
    WHERE article_id = p_article_id AND user_id = v_uid;
    
    UPDATE public.news_articles 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = p_article_id;
    
    RETURN false; -- no longer liked
  ELSE
    -- Add like
    INSERT INTO public.news_likes (article_id, user_id)
    VALUES (p_article_id, v_uid);
    
    UPDATE public.news_articles 
    SET likes_count = likes_count + 1
    WHERE id = p_article_id;
    
    RETURN true; -- now liked
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_article_like(UUID) TO authenticated;

-- ============================================
-- FUNCTION: Toggle bookmark
-- ============================================

CREATE OR REPLACE FUNCTION public.toggle_article_bookmark(p_article_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_exists BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.news_bookmarks 
    WHERE article_id = p_article_id AND user_id = v_uid
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove bookmark
    DELETE FROM public.news_bookmarks 
    WHERE article_id = p_article_id AND user_id = v_uid;
    
    UPDATE public.news_articles 
    SET bookmarks_count = GREATEST(bookmarks_count - 1, 0)
    WHERE id = p_article_id;
    
    RETURN false; -- no longer bookmarked
  ELSE
    -- Add bookmark
    INSERT INTO public.news_bookmarks (article_id, user_id)
    VALUES (p_article_id, v_uid);
    
    UPDATE public.news_articles 
    SET bookmarks_count = bookmarks_count + 1
    WHERE id = p_article_id;
    
    RETURN true; -- now bookmarked
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_article_bookmark(UUID) TO authenticated;

-- ============================================
-- FUNCTION: Generate article slug
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_article_slug(p_title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_slug TEXT;
  v_slug TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  v_base_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9\s-]', '', 'g'));
  v_base_slug := regexp_replace(v_base_slug, '\s+', '-', 'g');
  v_base_slug := regexp_replace(v_base_slug, '-+', '-', 'g');
  v_base_slug := trim(both '-' from v_base_slug);
  
  -- Ensure uniqueness
  v_slug := v_base_slug;
  WHILE EXISTS(SELECT 1 FROM public.news_articles WHERE slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter::TEXT;
  END LOOP;
  
  RETURN v_slug;
END;
$$;
