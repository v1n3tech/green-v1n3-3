-- Migration 032: Community Follows + Real Community Posts
-- Created: 2026-06-10
-- Description:
--   1. community_follows — regular users (and any role) can FOLLOW multiple communities
--      for read-only updates. Joining stays exec-and-above; following grants NO membership perks.
--   2. community_posts — real feed posts (replaces mock feed). Posting restricted by RLS to
--      members/staff of that community (profiles.community match, secondary_communities, or admin).
--      Regular users (community = NULL) can never post, by construction.
--   3. notifications — extend type/reference_type CHECKs with 'community_update' and
--      'post' | 'service' | 'product' | 'broadcast'.
--   4. SECURITY DEFINER fan-out triggers: new posts, active services, approved products,
--      and sent community broadcasts -> notification rows for that community's followers.
--
-- Depends on: profiles (001), notifications (019), broadcasts (020),
--             community_services (010), marketplace_products (025), agro_community enum.

-- ============================================
-- 1. COMMUNITY FOLLOWS
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  community agro_community NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, community)
);

CREATE INDEX IF NOT EXISTS idx_community_follows_user ON public.community_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_community ON public.community_follows(community);

ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY follows_select_own ON public.community_follows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY follows_insert_own ON public.community_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY follows_delete_own ON public.community_follows
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. COMMUNITY POSTS (real feed)
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community agro_community NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_community ON public.community_posts(community, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON public.community_posts(author_id);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read posts (page-level gating decides what renders).
CREATE POLICY posts_select_authenticated ON public.community_posts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only members/staff of the community (or admin) can post.
-- Regular users have profiles.community = NULL so they can never satisfy this.
CREATE POLICY posts_insert_member ON public.community_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.community = community_posts.community
          OR community_posts.community = ANY (p.secondary_communities)
          OR p.role = 'admin'
        )
    )
  );

CREATE POLICY posts_update_own ON public.community_posts
  FOR UPDATE USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY posts_delete_own ON public.community_posts
  FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE TRIGGER community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 3. NOTIFICATIONS — extend CHECK constraints
-- ============================================

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'message', 'message_reaction', 'request_received', 'request_approved', 'request_rejected',
  'assignment_new', 'assignment_graded', 'assignment_due', 'news_published',
  'payment_received', 'payment_sent', 'badge_earned', 'system', 'admin_alert', 'security',
  'community_update'
));

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_reference_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_reference_type_check CHECK (reference_type IN (
  'conversation', 'message', 'request', 'assignment', 'news', 'payment', 'badge', 'profile', 'community',
  'post', 'service', 'product', 'broadcast'
));

-- ============================================
-- 4. FAN-OUT TRIGGERS (SECURITY DEFINER)
-- ============================================

-- Shared helper: notify all followers of a community (excluding an optional actor).
CREATE OR REPLACE FUNCTION public.notify_community_followers(
  p_community agro_community,
  p_actor UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_reference_type TEXT,
  p_reference_id UUID,
  p_action_url TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, reference_type, reference_id, action_url, metadata)
  SELECT
    cf.user_id,
    p_type,
    p_title,
    p_body,
    p_reference_type,
    p_reference_id,
    p_action_url,
    jsonb_build_object('community', p_community::text)
  FROM public.community_follows cf
  WHERE cf.community = p_community
    AND (p_actor IS NULL OR cf.user_id <> p_actor);
END;
$$;

-- 4a. New community post -> followers
CREATE OR REPLACE FUNCTION public.fanout_community_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_community_followers(
    NEW.community,
    NEW.author_id,
    'community_update',
    'New post in ' || replace(NEW.community::text, '_', ' '),
    COALESCE(NEW.title, left(NEW.content, 120)),
    'post',
    NEW.id,
    '/dashboard/communities'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_community_post_fanout ON public.community_posts;
CREATE TRIGGER on_community_post_fanout
  AFTER INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.fanout_community_post();

-- 4b. New active service -> followers
CREATE OR REPLACE FUNCTION public.fanout_community_service()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active THEN
    PERFORM public.notify_community_followers(
      NEW.community,
      NEW.gcm_id,
      'community_update',
      'New service in ' || replace(NEW.community::text, '_', ' '),
      NEW.title,
      'service',
      NEW.id,
      '/dashboard/communities'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_community_service_fanout ON public.community_services;
CREATE TRIGGER on_community_service_fanout
  AFTER INSERT ON public.community_services
  FOR EACH ROW
  EXECUTE FUNCTION public.fanout_community_service();

-- 4c. Product approved (insert approved OR transition to approved) -> followers
CREATE OR REPLACE FUNCTION public.fanout_community_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.community IS NOT NULL AND NEW.status = 'approved' AND NEW.is_active
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
    PERFORM public.notify_community_followers(
      NEW.community,
      NEW.seller_id,
      'community_update',
      'New product in ' || replace(NEW.community::text, '_', ' '),
      NEW.title,
      'product',
      NEW.id,
      '/dashboard/marketplace'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_marketplace_product_fanout ON public.marketplace_products;
CREATE TRIGGER on_marketplace_product_fanout
  AFTER INSERT OR UPDATE ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION public.fanout_community_product();

-- 4d. Broadcast sent with a target_community -> followers
CREATE OR REPLACE FUNCTION public.fanout_community_broadcast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- target_community is TEXT; only fan out when it is a valid agro_community value.
  IF NEW.status = 'sent' AND NEW.target_community IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'sent')
     AND EXISTS (
       SELECT 1 FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'agro_community' AND e.enumlabel = NEW.target_community
     ) THEN
    PERFORM public.notify_community_followers(
      NEW.target_community::agro_community,
      NEW.created_by,
      'community_update',
      'Broadcast: ' || NEW.title,
      left(NEW.message, 160),
      'broadcast',
      NEW.id,
      '/dashboard/communities'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_broadcast_fanout ON public.broadcasts;
CREATE TRIGGER on_broadcast_fanout
  AFTER INSERT OR UPDATE ON public.broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.fanout_community_broadcast();
