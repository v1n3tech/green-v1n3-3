-- Migration 034: Wallet mnemonic backup + recovery audit
--
-- Adds support for recoverable BIP39 seed phrases on custodial wallets.
-- Going forward, minted wallets are derived from a 12-word mnemonic (path
-- m/44'/501'/0'/0') and the mnemonic is stored encrypted (AES-256-GCM)
-- alongside the existing encrypted secret key. This lets a user reveal and
-- back up their own seed phrase (after OTP re-confirmation), so the wallet
-- can be restored even if the database vault is ever lost again.
--
-- Legacy wallets minted before this migration (raw Keypair, no mnemonic) keep
-- working — they simply expose the base58 private key on reveal instead of a
-- seed phrase.
--
-- All columns are nullable and additive; safe to run multiple times.

ALTER TABLE public.user_wallets
  ADD COLUMN IF NOT EXISTS encrypted_mnemonic text,
  ADD COLUMN IF NOT EXISTS mnemonic_iv text,
  ADD COLUMN IF NOT EXISTS mnemonic_auth_tag text,
  ADD COLUMN IF NOT EXISTS last_revealed_at timestamptz,
  ADD COLUMN IF NOT EXISTS recovered_at timestamptz;

COMMENT ON COLUMN public.user_wallets.encrypted_mnemonic IS 'AES-256-GCM ciphertext of the BIP39 seed phrase (null for legacy/imported wallets).';
COMMENT ON COLUMN public.user_wallets.mnemonic_iv IS 'IV (base64) for the encrypted_mnemonic.';
COMMENT ON COLUMN public.user_wallets.mnemonic_auth_tag IS 'GCM auth tag (base64) for the encrypted_mnemonic.';
COMMENT ON COLUMN public.user_wallets.last_revealed_at IS 'Last time the user revealed their secret phrase / private key (OTP-gated).';
COMMENT ON COLUMN public.user_wallets.recovered_at IS 'Set when a wallet row was re-minted via self-heal recovery (prior keys were lost).';
