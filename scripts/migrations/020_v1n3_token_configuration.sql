-- Migration: V1N3 Token Configuration
-- Date: 2026-05-23
-- Description: Documents the V1N3 SPL Token configuration on Solana Devnet

/*
V1N3 Token Configuration:
========================
- Token Name: V1n3
- Token Symbol: V1N3
- Mint Address: EAtP7GvoVreBt9jFH7NEQkW5bkzDWQ1uuhQ7nnSMx7g1
- Program ID: BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX
- Network: Solana Devnet
- Decimals: 9 (standard SPL token decimals)

Files Updated:
=============
1. lib/wallet/v1n3-token.ts - Token configuration and utility functions
2. lib/wallet/use-v1n3-balance.ts - React hooks for fetching V1N3 balance
3. components/providers/wallet-provider.tsx - Updated to use devnet
4. components/dashboard/dashboard-wallet.tsx - Redesigned wallet page with real blockchain data
5. components/dashboard/dashboard-shell.tsx - Updated header to show actual V1N3 balance

Notes:
======
- The wallet provider now connects to Solana Devnet instead of mainnet-beta
- V1N3 balance is fetched from the blockchain using the SPL token program
- Real-time balance updates via Solana WebSocket subscriptions
- External wallet connection (Phantom, Solflare, etc.) is supported alongside custodial wallets
*/

-- No database changes required for this migration
-- This is a documentation-only migration for the V1N3 token integration
