-- Migration 010: Create Community Services and Service Requests
-- Services listed by GCMs with pricing in V1n3
-- Anyone can request services, with counter-quote capabilities

-- Create enum for request status
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_request_status') THEN
    CREATE TYPE service_request_status AS ENUM (
      'pending',
      'accepted',
      'rejected',
      'negotiating',
      'completed',
      'cancelled'
    );
  END IF;
END $$;

-- Create community_services table (services offered by GCMs)
CREATE TABLE IF NOT EXISTS community_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Service provider (must be GCM)
  gcm_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Service details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Community this service belongs to
  community agro_community NOT NULL,
  
  -- Pricing in V1n3
  price NUMERIC NOT NULL DEFAULT 0,
  price_unit TEXT DEFAULT 'per service', -- 'per hour', 'per day', 'per kg', etc.
  
  -- Service availability
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Media
  thumbnail TEXT,
  gallery TEXT[],
  
  -- Metadata
  tags TEXT[],
  turnaround_time TEXT, -- '1-2 days', 'Same day', etc.
  
  -- Stats
  requests_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create service_requests table
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Service being requested
  service_id UUID NOT NULL REFERENCES community_services(id) ON DELETE CASCADE,
  
  -- Requester (can be any user)
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- GCM who owns the service
  gcm_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Request details
  message TEXT,
  
  -- Pricing negotiation
  original_price NUMERIC NOT NULL,
  requester_quote NUMERIC, -- Counter-offer from requester
  gcm_quote NUMERIC, -- Counter-offer from GCM
  final_price NUMERIC, -- Agreed price
  
  -- Status
  status service_request_status DEFAULT 'pending',
  
  -- Response
  gcm_response TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create service_request_messages for negotiation chat
CREATE TABLE IF NOT EXISTS service_request_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  quote_amount NUMERIC, -- If this message includes a counter-quote
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE community_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_services

-- Anyone can view active services
CREATE POLICY services_select_active ON community_services
  FOR SELECT USING (is_active = true);

-- GCMs can view their own services (even inactive)
CREATE POLICY services_select_own ON community_services
  FOR SELECT USING (auth.uid() = gcm_id);

-- Only GCMs can create services (verified in app layer)
CREATE POLICY services_insert ON community_services
  FOR INSERT WITH CHECK (auth.uid() = gcm_id);

-- GCMs can update their own services
CREATE POLICY services_update_own ON community_services
  FOR UPDATE USING (auth.uid() = gcm_id);

-- GCMs can delete their own services
CREATE POLICY services_delete_own ON community_services
  FOR DELETE USING (auth.uid() = gcm_id);

-- RLS Policies for service_requests

-- Requesters can view their own requests
CREATE POLICY requests_select_requester ON service_requests
  FOR SELECT USING (auth.uid() = requester_id);

-- GCMs can view requests for their services
CREATE POLICY requests_select_gcm ON service_requests
  FOR SELECT USING (auth.uid() = gcm_id);

-- Anyone can create a request
CREATE POLICY requests_insert ON service_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Requesters can update their own requests (cancel, counter-quote)
CREATE POLICY requests_update_requester ON service_requests
  FOR UPDATE USING (auth.uid() = requester_id);

-- GCMs can update requests for their services (accept, reject, counter-quote)
CREATE POLICY requests_update_gcm ON service_requests
  FOR UPDATE USING (auth.uid() = gcm_id);

-- RLS Policies for service_request_messages

-- Participants can view messages for their requests
CREATE POLICY messages_select_participant ON service_request_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.id = request_id
      AND (sr.requester_id = auth.uid() OR sr.gcm_id = auth.uid())
    )
  );

-- Participants can send messages
CREATE POLICY messages_insert_participant ON service_request_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.id = request_id
      AND (sr.requester_id = auth.uid() OR sr.gcm_id = auth.uid())
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_community ON community_services(community);
CREATE INDEX IF NOT EXISTS idx_services_gcm ON community_services(gcm_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON community_services(is_active);
CREATE INDEX IF NOT EXISTS idx_requests_requester ON service_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_requests_gcm ON service_requests(gcm_id);
CREATE INDEX IF NOT EXISTS idx_requests_service ON service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_messages_request ON service_request_messages(request_id);

-- Triggers for updated_at
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON community_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to increment service request count
CREATE OR REPLACE FUNCTION increment_service_requests()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE community_services
  SET requests_count = requests_count + 1
  WHERE id = NEW.service_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_service_request_created
  AFTER INSERT ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION increment_service_requests();

-- Function to increment completed count when request is completed
CREATE OR REPLACE FUNCTION increment_service_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE community_services
    SET completed_count = completed_count + 1
    WHERE id = NEW.service_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_service_request_completed
  AFTER UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION increment_service_completed();
