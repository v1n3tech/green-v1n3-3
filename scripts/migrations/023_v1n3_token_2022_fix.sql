-- Migration: V1N3 Token-2022 Program Fix
-- Date: 2026-05-25
-- Status: APPLIED (code-only change)

-- IMPORTANT: V1N3 uses the Token-2022 program (TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb),
-- NOT the legacy Token program (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA).
--
-- This was causing incorrect ATA (Associated Token Account) derivation:
-- - Wrong ATA: FxHhZUPpwQVJvRW9uXY9wdAUPaGytaTW8Uy9Wf3jhjed (legacy Token program)
-- - Correct ATA: D44QJbW2GSCgKLTHHSXRxGRJiKFNZNPxtAM21S4h3A7h (Token-2022 program)
--
-- Files updated:
-- - lib/wallet/v1n3-token.ts: All functions now use TOKEN_2022_PROGRAM_ID
-- - lib/wallet/use-v1n3-balance.ts: Balance hook uses Token-2022 for ATA derivation
-- - lib/wallet/mint.ts: Wallet provisioning uses Token-2022 for ATA creation
--
-- Token-2022 provides additional features like transfer hooks, confidential transfers,
-- and other extensions that V1N3 may utilize.

-- No database changes required - this was a code-only fix.
