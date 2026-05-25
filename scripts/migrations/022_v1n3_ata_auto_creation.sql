-- Migration: V1N3 ATA Auto-Creation
-- Date: 2026-05-25
-- Status: CODE ONLY (no SQL changes needed)

-- This migration documents the code changes for automatic ATA creation:

-- 1. Updated lib/wallet/mint.ts:
--    - Now attempts to create V1N3 Associated Token Account (ATA) during wallet provisioning
--    - ATA creation is best-effort: if wallet has insufficient SOL, it's skipped
--    - Users can manually create ATA later via the wallet page

-- 2. Created app/api/wallet/ensure-ata/route.ts:
--    - GET: Check if user has V1N3 ATA
--    - POST: Create V1N3 ATA for user (requires SOL for fees)

-- 3. Created app/api/wallet/transactions/route.ts:
--    - Fetches real blockchain transactions for V1N3 token
--    - Merges with database transactions for complete history

-- 4. Created app/api/wallet/send/route.ts:
--    - Sends V1N3 tokens to any Solana address
--    - Automatically creates recipient's ATA if needed (--fund-recipient behavior)
--    - Records transaction in database with signature

-- 5. Updated lib/wallet/v1n3-token.ts:
--    - Added ensureV1N3TokenAccount() function
--    - Added transferV1N3() function with auto ATA creation
--    - Added getV1N3Transactions() to fetch blockchain history

-- 6. Updated components/dashboard/dashboard-wallet.tsx:
--    - Shows ATA status in Receive modal
--    - Allows manual ATA creation if needed
--    - Fetches real blockchain transactions
--    - Send function now calls API for real transfers
