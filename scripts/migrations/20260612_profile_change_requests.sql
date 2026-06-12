-- Migration: profile_change_requests
-- Lets users apply to the admin organization to edit their email and select
-- profile details. Admins review and approve/reject from the Organization page.
-- Non-destructive: creates one new table + policies, touches no existing data.

CREATE TABLE IF NOT EXISTS public.profile_change_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- JSON map of { field: { current, requested } } for the fields being changed.
  changes       JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note   TEXT,
  reviewed_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcr_user_id ON public.profile_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pcr_status ON public.profile_change_requests(status);

ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

-- Users can see and create their own requests.
DROP POLICY IF EXISTS pcr_select_own ON public.profile_change_requests;
CREATE POLICY pcr_select_own ON public.profile_change_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pcr_insert_own ON public.profile_change_requests;
CREATE POLICY pcr_insert_own ON public.profile_change_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can see and manage every request.
DROP POLICY IF EXISTS pcr_select_admin ON public.profile_change_requests;
CREATE POLICY pcr_select_admin ON public.profile_change_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS pcr_update_admin ON public.profile_change_requests;
CREATE POLICY pcr_update_admin ON public.profile_change_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
