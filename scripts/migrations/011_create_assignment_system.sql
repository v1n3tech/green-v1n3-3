-- Migration 011: Create Service Assignment System
-- Adds location details to requests, GCM signatures, executive assignments, and assignment letters

-- ============ ADD PAYMENT STATUS TO REQUEST STATUS ENUM ============
-- Add new enum values for payment tracking
DO $$ 
BEGIN
  -- Add 'payment_pending' and 'in_progress' to the enum if they don't exist
  ALTER TYPE service_request_status ADD VALUE IF NOT EXISTS 'payment_pending' AFTER 'accepted';
  ALTER TYPE service_request_status ADD VALUE IF NOT EXISTS 'paid' AFTER 'payment_pending';
  ALTER TYPE service_request_status ADD VALUE IF NOT EXISTS 'in_progress' AFTER 'paid';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============ ADD COLUMNS TO SERVICE_REQUESTS ============
-- Add location details and utility bill for proof
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS location_state TEXT,
ADD COLUMN IF NOT EXISTS location_lga TEXT,
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS location_details TEXT,
ADD COLUMN IF NOT EXISTS utility_bill_url TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending', -- pending, paid, refunded
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS details_submitted_at TIMESTAMPTZ;

-- ============ ADD GCM SIGNATURE TO PROFILES ============
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- ============ CREATE EXECUTIVE ASSIGNMENTS TABLE ============
CREATE TABLE IF NOT EXISTS service_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to request
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  
  -- The executive being assigned
  executive_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- GCM who made the assignment
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Assignment details
  role_description TEXT, -- What this executive will do
  notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'assigned', -- assigned, accepted, declined, completed
  
  -- Executive response
  executive_response TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Prevent duplicate assignments
  UNIQUE(request_id, executive_id)
);

-- ============ CREATE ASSIGNMENT LETTERS TABLE ============
CREATE TABLE IF NOT EXISTS assignment_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to assignment
  assignment_id UUID NOT NULL REFERENCES service_assignments(id) ON DELETE CASCADE,
  
  -- Link to request for denormalization
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  
  -- Letter details
  letter_reference TEXT UNIQUE NOT NULL, -- e.g., "AGV-ASN-2026-0001"
  
  -- Content stored as JSON for flexibility
  letter_content JSONB NOT NULL,
  
  -- GCM signature used
  gcm_signature_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ CREATE NOTIFICATIONS TABLE (for assignment letters) ============
CREATE TABLE IF NOT EXISTS executive_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  executive_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification type
  type TEXT NOT NULL, -- 'assignment_letter', 'request_update', etc.
  
  -- Related entities
  assignment_id UUID REFERENCES service_assignments(id) ON DELETE CASCADE,
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  letter_id UUID REFERENCES assignment_letters(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ ENABLE RLS ============
ALTER TABLE service_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_notifications ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES FOR SERVICE_ASSIGNMENTS ============

-- GCMs can view assignments they created
CREATE POLICY assignments_select_gcm ON service_assignments
  FOR SELECT USING (auth.uid() = assigned_by);

-- Executives can view their own assignments
CREATE POLICY assignments_select_executive ON service_assignments
  FOR SELECT USING (auth.uid() = executive_id);

-- GCMs can create assignments
CREATE POLICY assignments_insert_gcm ON service_assignments
  FOR INSERT WITH CHECK (auth.uid() = assigned_by);

-- GCMs can update assignments they created
CREATE POLICY assignments_update_gcm ON service_assignments
  FOR UPDATE USING (auth.uid() = assigned_by);

-- Executives can update their own assignment status
CREATE POLICY assignments_update_executive ON service_assignments
  FOR UPDATE USING (auth.uid() = executive_id);

-- ============ RLS POLICIES FOR ASSIGNMENT_LETTERS ============

-- GCMs can view letters they created (via assignment)
CREATE POLICY letters_select_gcm ON assignment_letters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_assignments sa
      WHERE sa.id = assignment_id
      AND sa.assigned_by = auth.uid()
    )
  );

-- Executives can view their own letters
CREATE POLICY letters_select_executive ON assignment_letters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_assignments sa
      WHERE sa.id = assignment_id
      AND sa.executive_id = auth.uid()
    )
  );

-- GCMs can create letters
CREATE POLICY letters_insert_gcm ON assignment_letters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_assignments sa
      WHERE sa.id = assignment_id
      AND sa.assigned_by = auth.uid()
    )
  );

-- Executives can update read status
CREATE POLICY letters_update_executive ON assignment_letters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM service_assignments sa
      WHERE sa.id = assignment_id
      AND sa.executive_id = auth.uid()
    )
  );

-- ============ RLS POLICIES FOR NOTIFICATIONS ============

-- Executives can view their own notifications
CREATE POLICY notifications_select_own ON executive_notifications
  FOR SELECT USING (auth.uid() = executive_id);

-- GCMs can create notifications for executives
CREATE POLICY notifications_insert ON executive_notifications
  FOR INSERT WITH CHECK (true);

-- Executives can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON executive_notifications
  FOR UPDATE USING (auth.uid() = executive_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_assignments_request ON service_assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_assignments_executive ON service_assignments(executive_id);
CREATE INDEX IF NOT EXISTS idx_assignments_gcm ON service_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON service_assignments(status);

CREATE INDEX IF NOT EXISTS idx_letters_assignment ON assignment_letters(assignment_id);
CREATE INDEX IF NOT EXISTS idx_letters_request ON assignment_letters(request_id);

CREATE INDEX IF NOT EXISTS idx_notifications_executive ON executive_notifications(executive_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON executive_notifications(executive_id, is_read) WHERE is_read = false;

-- ============ FUNCTION TO GENERATE LETTER REFERENCE ============
CREATE OR REPLACE FUNCTION generate_letter_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_ref TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(letter_reference FROM 'AGV-ASN-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM assignment_letters
  WHERE letter_reference LIKE 'AGV-ASN-' || year_part || '-%';
  
  new_ref := 'AGV-ASN-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_ref;
END;
$$;

-- ============ TRIGGER TO UPDATE REQUEST STATUS WHEN ALL ASSIGNMENTS COMPLETE ============
CREATE OR REPLACE FUNCTION check_request_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_assignments INTEGER;
  completed_assignments INTEGER;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Count total and completed assignments for this request
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
    INTO total_assignments, completed_assignments
    FROM service_assignments
    WHERE request_id = NEW.request_id;
    
    -- If all assignments are completed, mark request as completed
    IF total_assignments > 0 AND total_assignments = completed_assignments THEN
      UPDATE service_requests
      SET status = 'completed', completed_at = NOW()
      WHERE id = NEW.request_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_assignment_status_change
  AFTER UPDATE ON service_assignments
  FOR EACH ROW
  EXECUTE FUNCTION check_request_completion();
