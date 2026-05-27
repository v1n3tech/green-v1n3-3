-- V1N3 Staking System
-- Creates tables for staking positions and rewards tracking

-- Create staking positions table
CREATE TABLE IF NOT EXISTS staking_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_until TIMESTAMP WITH TIME ZONE, -- Optional lock period
  is_active BOOLEAN DEFAULT true,
  unstaked_at TIMESTAMP WITH TIME ZONE,
  rewards_claimed NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staking rewards table (for tracking individual reward events)
CREATE TABLE IF NOT EXISTS staking_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID REFERENCES staking_positions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  reward_type TEXT NOT NULL DEFAULT 'staking', -- 'staking', 'bonus', 'referral'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'claimed', 'expired'
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staking configuration table (for APY and settings)
CREATE TABLE IF NOT EXISTS staking_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default staking configuration
INSERT INTO staking_config (key, value, description) VALUES
  ('base_apy', '"35"', 'Base Annual Percentage Yield'),
  ('min_stake_amount', '"100"', 'Minimum V1N3 to stake'),
  ('lock_period_days', '"0"', 'Default lock period in days (0 = no lock)'),
  ('rewards_frequency', '"daily"', 'How often rewards are calculated'),
  ('is_staking_enabled', '"true"', 'Whether staking is currently enabled')
ON CONFLICT (key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staking_positions_user_id ON staking_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_positions_active ON staking_positions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_staking_rewards_user_id ON staking_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_rewards_status ON staking_rewards(status);

-- Enable RLS
ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staking_positions
CREATE POLICY "staking_positions_select_own" ON staking_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "staking_positions_insert_own" ON staking_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "staking_positions_update_own" ON staking_positions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for staking_rewards
CREATE POLICY "staking_rewards_select_own" ON staking_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "staking_rewards_insert_own" ON staking_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "staking_rewards_update_own" ON staking_rewards
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for staking_config (read-only for users)
CREATE POLICY "staking_config_select_all" ON staking_config
  FOR SELECT USING (true);

-- Function to calculate pending rewards for a user
CREATE OR REPLACE FUNCTION calculate_pending_rewards(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_rewards NUMERIC := 0;
  position RECORD;
  apy NUMERIC;
  days_staked NUMERIC;
  daily_rate NUMERIC;
BEGIN
  -- Get current APY
  SELECT (value#>>'{}')::NUMERIC INTO apy FROM staking_config WHERE key = 'base_apy';
  IF apy IS NULL THEN apy := 35; END IF;
  
  daily_rate := apy / 365 / 100;
  
  -- Calculate rewards for each active position
  FOR position IN 
    SELECT amount, staked_at, rewards_claimed
    FROM staking_positions 
    WHERE user_id = p_user_id AND is_active = true
  LOOP
    days_staked := EXTRACT(EPOCH FROM (NOW() - position.staked_at)) / 86400;
    total_rewards := total_rewards + (position.amount * daily_rate * days_staked) - position.rewards_claimed;
  END LOOP;
  
  RETURN GREATEST(total_rewards, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's total staked amount
CREATE OR REPLACE FUNCTION get_total_staked(p_user_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) FROM staking_positions WHERE user_id = p_user_id AND is_active = true),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
