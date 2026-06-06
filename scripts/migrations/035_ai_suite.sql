-- Migration 035: AI Suite
-- Created: 2026-06-06
-- Description: Foundation tables for the GreenV1n3 AI suite (Vercel AI Gateway + Gemini Flash):
--                - ai_config: single-row, admin-editable feature flags + model settings
--                - knowledge_base: admin-editable docs that power the support bot and /docs
--                - ai_conversations + ai_messages: persisted chat threads (advisory + support)
--                - ai_usage_log: lightweight per-call usage/audit trail
--              Core principle: AI never invents prices/weather; those come from
--              real data. AI only drafts, translates, advises and converses.

-- ============================================
-- HELPER: is_platform_admin (SECURITY DEFINER to avoid RLS recursion)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_platform_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = user_id;
  RETURN v_role = 'admin';
END;
$$;

-- ============================================
-- AI CONFIG (single row, id = TRUE)
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,

  -- Master switch
  ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Per-feature toggles
  news_ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  advisory_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  support_bot_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  weather_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  predictive_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  translation_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Model settings (Vercel AI Gateway model ids)
  model TEXT NOT NULL DEFAULT 'google/gemini-3.5-flash',
  temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.40,
  max_output_tokens INTEGER NOT NULL DEFAULT 2048,

  -- Guardrails
  daily_message_cap INTEGER NOT NULL DEFAULT 50, -- per user, advisory + support
  disclaimer TEXT NOT NULL DEFAULT 'AI guidance is advisory only. Always confirm prices, weather and financial decisions with your GCM or local market.',

  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ai_config_singleton CHECK (id)
);

INSERT INTO public.ai_config (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- KNOWLEDGE BASE (admin-editable docs)
-- ============================================

CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- getting_started, wallet, marketplace, governance, token, logistics, faq, general
  summary TEXT,             -- short answer / excerpt
  content TEXT NOT NULL,    -- full markdown body
  keywords TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE, -- visible on /docs and usable by bot
  use_in_bot BOOLEAN NOT NULL DEFAULT TRUE,   -- include in support-bot grounding
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_kb_published ON public.knowledge_base(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_kb_slug ON public.knowledge_base(slug);

-- ============================================
-- AI CONVERSATIONS + MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'advisory', -- advisory | support
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user | assistant
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);

-- ============================================
-- AI USAGE LOG (audit + cost visibility)
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  feature TEXT NOT NULL, -- news | advisory | support | predictive | translation
  model TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  ok BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON public.ai_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON public.ai_usage_log(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON public.ai_usage_log(user_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- ai_config: anyone authenticated can read (to know which features are on); only admins write
CREATE POLICY "ai_config_select" ON public.ai_config
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ai_config_update" ON public.ai_config
  FOR UPDATE USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "ai_config_insert" ON public.ai_config
  FOR INSERT WITH CHECK (public.is_platform_admin(auth.uid()));

-- knowledge_base: everyone reads published; admins manage all
CREATE POLICY "kb_select_published" ON public.knowledge_base
  FOR SELECT USING (is_published = TRUE OR public.is_platform_admin(auth.uid()));
CREATE POLICY "kb_insert" ON public.knowledge_base
  FOR INSERT WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "kb_update" ON public.knowledge_base
  FOR UPDATE USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "kb_delete" ON public.knowledge_base
  FOR DELETE USING (public.is_platform_admin(auth.uid()));

-- ai_conversations: owner-scoped; admins can read for support
CREATE POLICY "ai_conversations_select_own" ON public.ai_conversations
  FOR SELECT USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));
CREATE POLICY "ai_conversations_insert_own" ON public.ai_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_conversations_update_own" ON public.ai_conversations
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "ai_conversations_delete_own" ON public.ai_conversations
  FOR DELETE USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- ai_messages: visible if you own the parent conversation (or admin)
CREATE POLICY "ai_messages_select" ON public.ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id
        AND (c.user_id = auth.uid() OR public.is_platform_admin(auth.uid()))
    )
  );
CREATE POLICY "ai_messages_insert" ON public.ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- ai_usage_log: users see their own; admins see all. Inserts via service role only.
CREATE POLICY "ai_usage_select" ON public.ai_usage_log
  FOR SELECT USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- ============================================
-- TRIGGERS: updated_at
-- ============================================

CREATE TRIGGER ai_config_updated_at
  BEFORE UPDATE ON public.ai_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
