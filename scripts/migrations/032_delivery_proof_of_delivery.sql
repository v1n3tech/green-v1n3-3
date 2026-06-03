-- 032_delivery_proof_of_delivery.sql
-- Adds an executive-reported completion step with proof of delivery.
--
-- Flow:
--   executive reports completion  -> status = 'awaiting_confirmation' (+ proof, notes, who/when)
--   logistics GCM confirms         -> status = 'delivered' (existing completeDelivery action)
--
-- RLS already lets the assigned executive UPDATE their own delivery row
-- (migration 031: delivery_requests_update includes assigned_executive_id),
-- and column-level changes are governed by that same row policy, so no new
-- policy is required for the executive to write these columns.

ALTER TABLE public.delivery_requests
  ADD COLUMN IF NOT EXISTS proof_of_delivery_url text,
  ADD COLUMN IF NOT EXISTS completion_notes      text,
  ADD COLUMN IF NOT EXISTS completion_reported_at timestamptz,
  ADD COLUMN IF NOT EXISTS completion_reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.delivery_requests.proof_of_delivery_url IS
  'Blob URL of the recipient signature / delivery photo uploaded by the assigned executive.';
COMMENT ON COLUMN public.delivery_requests.completion_notes IS
  'Optional note left by the executive when reporting the delivery complete.';
COMMENT ON COLUMN public.delivery_requests.completion_reported_at IS
  'Timestamp when the assigned executive reported the delivery complete (awaiting GCM confirmation).';
COMMENT ON COLUMN public.delivery_requests.completion_reported_by IS
  'Executive who reported the delivery complete.';

-- Note: delivery_requests.status is a free-text column with no CHECK constraint,
-- so the new 'awaiting_confirmation' value needs no schema change.
