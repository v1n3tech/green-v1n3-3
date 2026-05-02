-- Migration: create_user_wallets_table
-- Created: 2026-05-02
-- Description: Custodial wallet vault for email-signup users.
--              Stores AES-256-GCM encrypted Solana secret keys.
--              RLS denies ALL client access; only the Supabase service role
--              (used by server-side code) can read/write this table.
--              The plaintext secret key never leaves the server.

CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Public Solana address (base58). Mirrors profiles.wallet_address for joins.
  public_key TEXT NOT NULL UNIQUE,

  -- AES-256-GCM ciphertext of the 64-byte Solana secretKey, base64-encoded.
  encrypted_secret_key TEXT NOT NULL,

  -- 12-byte GCM IV / nonce, base64-encoded. Unique per row.
  iv TEXT NOT NULL,

  -- 16-byte GCM auth tag, base64-encoded. Verifies integrity on decrypt.
  auth_tag TEXT NOT NULL,

  -- Provenance: how this wallet was created.
  -- 'minted' = generated server-side for an email-only signup (custodial)
  -- 'imported' = user-provided private key (future use)
  origin TEXT NOT NULL DEFAULT 'minted' CHECK (origin IN ('minted', 'imported')),

  -- Tracks whether the user has exported / taken self-custody of the key.
  -- Once true, the platform should treat the wallet as user-controlled.
  exported_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_public_key ON public.user_wallets(public_key);

-- Enable RLS. We deliberately create NO policies, which means:
--   * anon role  -> denied
--   * authenticated role -> denied (even for their own row)
--   * service_role -> bypasses RLS (used by server actions only)
-- This is intentional: encrypted secret keys must never reach the browser.
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
DROP TRIGGER IF EXISTS user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.user_wallets IS
  'Custodial Solana keypair vault. Service-role access only. RLS blocks all client reads/writes by design.';
COMMENT ON COLUMN public.user_wallets.encrypted_secret_key IS
  'AES-256-GCM ciphertext of the 64-byte secretKey (base58-encoded plaintext, then encrypted, then base64 of ciphertext).';
COMMENT ON COLUMN public.user_wallets.iv IS
  '12-byte GCM nonce, base64-encoded. Must be unique per encryption.';
COMMENT ON COLUMN public.user_wallets.auth_tag IS
  '16-byte GCM authentication tag, base64-encoded.';
