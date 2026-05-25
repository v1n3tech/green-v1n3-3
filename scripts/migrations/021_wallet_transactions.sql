-- Migration: Create wallet_transactions table for tracking V1N3 and SOL transfers
-- Date: 2026-05-25
-- Status: APPLIED

-- This migration has been applied to the database.
-- The wallet_transactions table now tracks all V1N3 and SOL transfers with:
-- - Real-time subscriptions for instant UI updates
-- - RLS policies for user-specific access
-- - Support for pending, confirmed, and failed transaction statuses

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('send', 'receive', 'swap', 'stake', 'unstake', 'reward');

-- Create enum for transaction status
CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed');

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Transaction details
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  
  -- Token info
  token_symbol TEXT NOT NULL DEFAULT 'V1N3', -- V1N3 or SOL
  token_mint TEXT, -- Mint address for SPL tokens
  
  -- Amounts (stored as text to preserve precision)
  amount NUMERIC(20, 9) NOT NULL,
  fee NUMERIC(20, 9) DEFAULT 0,
  
  -- Addresses
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  
  -- Blockchain reference
  signature TEXT UNIQUE, -- Solana transaction signature
  slot BIGINT, -- Solana slot number
  block_time TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  memo TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes for common queries
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Create indexes
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_signature ON wallet_transactions(signature) WHERE signature IS NOT NULL;
CREATE INDEX idx_wallet_transactions_from_address ON wallet_transactions(from_address);
CREATE INDEX idx_wallet_transactions_to_address ON wallet_transactions(to_address);
CREATE INDEX idx_wallet_transactions_token ON wallet_transactions(token_symbol);

-- Enable RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions (sent or received)
CREATE POLICY "wallet_transactions_select_own" ON wallet_transactions
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    from_address = (SELECT wallet_address FROM profiles WHERE id = auth.uid()) OR
    to_address = (SELECT wallet_address FROM profiles WHERE id = auth.uid())
  );

-- Policy: Service role can insert transactions (from blockchain sync)
CREATE POLICY "wallet_transactions_insert_service" ON wallet_transactions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update transaction status
CREATE POLICY "wallet_transactions_update_service" ON wallet_transactions
  FOR UPDATE
  USING (true);

-- Grant permissions
GRANT SELECT ON wallet_transactions TO authenticated;
GRANT INSERT, UPDATE ON wallet_transactions TO service_role;

-- Comment
COMMENT ON TABLE wallet_transactions IS 'Tracks V1N3 and SOL transactions for user wallets';
