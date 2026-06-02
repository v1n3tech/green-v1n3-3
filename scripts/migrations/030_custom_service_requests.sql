-- Migration 030: Custom service requests to communities
-- Allows members to send a free-form custom request to a community.
-- The request is routed to that community's GCM, who quotes a price and
-- then allocates the work to executives via the existing assignment pipeline.

-- 1. Relax NOT NULL constraints so a request need not point at a listed service
ALTER TABLE public.service_requests
  ALTER COLUMN service_id DROP NOT NULL,
  ALTER COLUMN original_price DROP NOT NULL;

-- 2. New columns for custom requests
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS target_community agro_community,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS requester_budget NUMERIC;

-- 3. Integrity: a row is EITHER a listed-service request OR a valid custom request
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_kind_check;

ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_kind_check CHECK (
    (is_custom = false AND service_id IS NOT NULL)
    OR
    (is_custom = true AND target_community IS NOT NULL AND title IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_service_requests_target_community
  ON public.service_requests(target_community)
  WHERE is_custom = true;

-- RLS note: existing policies are sufficient.
--   requests_insert    -> WITH CHECK (auth.uid() = requester_id)
--   requests_select_*   -> requester or gcm can read
--   requests_update_*   -> requester or gcm can update
-- Custom requests set gcm_id to the resolved community GCM, so they are covered.
