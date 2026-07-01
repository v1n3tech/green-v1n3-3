# Project memory — GreenV1n3 / AgroV1n3

> This file is the living source of truth for this project.
> It describes what is true **right now**, what has been **explicitly decided**,
> and what is still **unfinished**.
> It is NOT a chat log, a speculative brief, or a pile of contradictory notes.
>
> This app moves REAL MONEY on Solana mainnet. Treat every wallet, key, and
> balance statement here as safety-critical. When in doubt, re-read the code and
> the on-chain state before acting — never guess.

## Purpose

Help any future contributor (human or AI) understand:

- the current implementation state
- the exact stack and major technical decisions
- confirmed product/design decisions made by the user
- what is still unfinished
- what must never be accidentally broken (especially anything touching keys/funds)

If something is not implemented or explicitly approved, do not present it here as
if it were real.

## Core rules (mandatory)

1. **Separate truth from plans.** `Current implementation state` = only what
   exists in the codebase/on-chain now. `Approved decisions` = only what the user
   explicitly confirmed. `Open questions` = unresolved items.
2. **Rewrite, don't stack.** Replace stale sections. Never leave two
   contradictory notes behind.
3. **Keep next steps honest.** Only list unfinished work; remove completed items.
4. **Do not invent product direction.** No inferred branding/features unless the
   user approved them.
5. **Update after meaningful progress.** Record what changed, why, what remains,
   and any new user constraint.
6. **Money safety first.** Never document or introduce a pattern that puts the
   treasury master key on a server/database. See "Known constraints".

## Current implementation state

### Project status

**GreenV1n3** is the web operating system for the **AgroV1n3** program — a
country-scale agriculture initiative in **Plateau State, Nigeria**, targeting
~10,000 young participants in phase 1 (Plateau). Built by V1n3Tech. The platform
is a functioning, live product (marketplace, logistics/terminals, services,
custodial wallet, staking scaffold, messaging, ratings, rewards, whitepaper).

The **V1N3 token is LIVE on Solana mainnet** (see Token facts). This is no longer
a devnet pilot.

### Current stack

- **Next.js** `16.2.4` (App Router), **React** `19`, **TypeScript** `5.7.3`
- **Tailwind CSS v4** (`@tailwindcss/postcss`, `tailwindcss ^4.2.0`) — theme in
  `globals.css` via `@theme`, NO `tailwind.config`. Design tokens are CSS vars.
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) — auth + Postgres DB.
  Native Supabase Auth (email + password). RLS is the security model.
- **Vercel Blob** (`@vercel/blob`) — hosts the V1N3 token metadata JSON and
  other assets.
- **Solana**: `@solana/web3.js` `^1.98.4`, `@solana/spl-token` `^0.4.14`
  (**Token-2022**), `@solana/wallet-adapter-*`. Custodial-key derivation via
  `bip39`, `ed25519-hd-key`, `bs58`.
- **AI SDK** `ai ^6.0.197` + `@ai-sdk/react` (insights/assistant features).
- PDF/QR: `jspdf`, `qrcode`, `html-to-image` (wallet credential PDFs).
- `pg ^8.21.0` (devDep) for migration/setup scripts.

### Token facts (ON-CHAIN, mainnet — verified)

- **Mint address:** `StYmxutozcFfYtjaxEqLt8f5fX3ZGgTbgkn9rdg3To2`
- **Program:** Token-2022 (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`)
- **Name/Symbol:** `V1n3` / `V1N3`, **Decimals:** `9`
- **Total supply:** `4,000,000,000` (fixed) — started at 1,000,000,000, then the
  user added 3,000,000,000 ("add 3 billion before locking") before revoking.
- **Mint authority:** REVOKED (disabled) — supply can never increase.
- **Freeze authority:** NOT set — holder accounts can never be frozen.
- **Metadata URI:** hosted on Vercel Blob
  (`.../token/v1n3-token-metadata.json`).

### Wallets (safety-critical — do not confuse these)

- **Treasury (COLD master):** `BPhu3P9fxKvuae83z8ieWXszMBk8JbRgMY75pMGhQhnN`
  - Holds the bulk of supply (~3.995B). Is the metadata **update authority**.
  - Its secret key lives ONLY in `~/v1n3-authority.json` on the user's Mac,
    OFFLINE. It is NEVER loaded on the server or stored in the DB. Keep it that way.
- **Distributor (HOT):** `HdDCP23hf6ibfPezAnqaRB2SfxyuP2EcC8fE1JveoidA`
  - Holds a working float (~5M). Signs automated app payouts.
  - Key loaded server-side from env `V1N3_DISTRIBUTOR_SECRET_KEY` via
    `lib/wallet/distributor.ts` (`getDistributorKeypair()` / `DISTRIBUTOR_WALLET`).
- **OLD devnet treasury:** `DqzGbbGUXBx6wUyNjZf7y6cqcL55i6YBfPpHkXQN4m8X`
  - Legacy. Still referenced as `ADMIN_WALLET` in `lib/staking/staking-program.ts`
    and used to gate some flows (see Known constraints — this is a live gotcha).
- **User custodial wallets:** every user/admin-provisioned account gets a
  BIP39-seed custodial Solana wallet, AES-256-GCM encrypted in the
  `user_wallets` table (`lib/wallet/encryption.ts`, `lib/wallet/mint.ts`).

### Environment variables (Solana/token)

- `NEXT_PUBLIC_SOLANA_NETWORK` — defaults to `mainnet-beta`.
- `NEXT_PUBLIC_V1N3_MINT_ADDRESS` — overrides the default mint (defaults to the
  mainnet mint above).
- `NEXT_PUBLIC_SOLANA_RPC_ENDPOINT` — dedicated RPC (Helius). Public mainnet RPC
  is rate-limited; a dedicated endpoint is required in production.
- `V1N3_DISTRIBUTOR_SECRET_KEY` — distributor signing key (JSON byte array or
  base58). Server-only.
- Plus Supabase + Vercel Blob env vars (managed by integrations).

### Money flows (how V1N3 actually moves)

- **Rewards (points → V1N3):** `app/api/rewards/convert/route.ts` — signed by the
  **distributor** key. Records to `wallet_transactions`.
- **Marketplace fees:** `app/api/marketplace/checkout/route.ts` — platform fee
  routed to the **distributor** wallet.
- **Admin distribution:** `app/api/admin/token/distribute/route.ts` — admin-only
  send from the **distributor** (never the treasury). Mirrors to
  `wallet_transactions`.
- **Treasury moves:** done manually/offline from the Mac (`spl-token transfer`).
  The Token Control room generates the exact command; the key never touches the server.

### Key files of note

- `lib/wallet/v1n3-token.ts` — token config, connection, balances, transfers,
  `getExplorerUrl`, `getV1N3Transactions`. Env-driven, mainnet default.
- `lib/wallet/distributor.ts` — env-based distributor keypair loader + address.
- `lib/wallet/mint.ts` — custodial keypair minting + **wallet import** with the
  smart-hybrid seed-phrase resolver (`resolveMnemonicCandidates`, `importWallet`).
- `lib/wallet/encryption.ts` — AES-256-GCM for stored secret keys.
- `lib/admin/token-status.ts` — live on-chain status for the control room
  (`TREASURY_WALLET` constant lives here).
- `app/dashboard/token/page.tsx` + `components/dashboard/token/*` — the admin
  **Token Control room** (monitor, distributor send, treasury cold-command
  generator, recent activity). Linked in `dashboard-shell.tsx` ADMIN nav.
- `app/api/wallet/import/route.ts` + import UI in
  `components/dashboard/dashboard-wallet.tsx`.
- `lib/staking/staking-program.ts` — staking (holds legacy `ADMIN_WALLET`).

## Approved decisions

### Technical

- V1N3 is a **Token-2022** SPL asset on **Solana mainnet**, fixed 4B supply,
  mint + freeze authority revoked. This is final and immutable on-chain.
- Treasury master key stays **cold/offline**. The **distributor** (env key) is the
  only key allowed to sign from the server.
- Reward payouts and marketplace fees settle through the **distributor**.
- Dedicated Helius RPC via `NEXT_PUBLIC_SOLANA_RPC_ENDPOINT`.
- Wallet import must work for all common Solana wallets: byte-array/base58 keys
  import exactly; **seed phrases use the smart-hybrid resolver** (checks raw-seed,
  `m/44'/501'/0'/0'`, `m/44'/501'/0'`, and first 5 account indices; auto-imports
  the single funded candidate, else shows a picker). No secret keys are ever
  returned to the client.

### Product

- Platform: GreenV1n3 (web OS) for the AgroV1n3 program; phase 1 = Plateau State,
  Nigeria; ~10,000 youth participants.
- Messaging is **mainnet** everywhere (whitepaper + UI updated away from the old
  "devnet / no monetary value" copy).
- The admin **Token Control room** is the intended surface for viewing/managing
  the token — NOT importing the treasury into a custodial account.

### Design

- Aesthetic: dark, sleek, futuristic, "robust", terminal/mono-influenced.
  Sleekness is the highest priority. Proportional type/spacing/cards throughout.
- Green is the brand accent (GREEN·V1N3); keep the palette tight (3–5 colors).
  The landing (`/`) page sets the quality bar — do not drop below it.
- Small corner radii (`rounded-[2px]`), `mono-xs`/mono labels, uppercase eyebrows.

## Open questions

- **Admin model is split (needs a decision).** Token Control + distribute route
  gate on `profiles.role === 'admin'`, but rewards `isAdmin` and staking
  (`initialize-vault`, `fund-rewards`) still gate on
  `wallet_address === ADMIN_WALLET` (the OLD devnet `DqzGbbG...`). Should all
  admin gating move to `profiles.role`, and should `ADMIN_WALLET` be retired or
  repointed?
- Should staking rewards be funded from the distributor (like other payouts), and
  is the staking program deployed on mainnet or still parked?
- Does the user want any treasury action from the UI beyond the cold-command
  generator? (Current stance: no — keep treasury offline.)
- `V1N3_TOKEN.programId` in `lib/wallet/v1n3-token.ts` is set to
  `BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX`, which is NOT the Token-2022
  program id. Actual token ops correctly use `TOKEN_2022_PROGRAM_ID` from
  `@solana/spl-token`, so this field appears vestigial — confirm and clean up.

## Known constraints (do not break)

- **NEVER put the treasury master key on the server or in the DB.** Do not import
  the treasury into a custodial/admin account. Treasury moves happen offline via
  the generated `spl-token` command.
- The distributor needs a small **SOL balance** to pay fees, or payouts fail.
- All token ops must use **Token-2022** (`TOKEN_2022_PROGRAM_ID`), not the legacy
  Token program.
- On-chain amounts are in base units: multiply/divide by `10^9` (decimals = 9).
- The DB transactions table is **`wallet_transactions`** (NOT `transactions`).
  Respect its `type`/`status` enums and include `token_symbol`, `token_mint`,
  `signature`, etc. Verify schema via GetOrRequestIntegration before writing.
- Custom-instruction rule: for any DB action, write a migration script to
  `/scripts/migrations` before executing it.
- `ADMIN_WALLET` (`DqzGbbG...`) is legacy devnet — do not treat it as the current
  treasury; changing it affects rewards/staking admin gating.
- Keep all user-facing copy on **mainnet** language. Do not reintroduce "devnet /
  no monetary value" messaging.
- Keep the design sleek and at/above the `/` landing-page standard.

## Next steps (current, unfinished)

1. Resolve the split admin model (see Open questions) — unify on `profiles.role`
   or deliberately keep the wallet gate, and document the choice.
2. Confirm distributor SOL funding on mainnet so live payouts don't fail.
3. Decide staking's mainnet status + reward funding source.
4. Clean up the vestigial `V1N3_TOKEN.programId` field if confirmed unused.
5. Update this file immediately after any change to wallets, keys, token config,
   admin gating, or money flows.

## Documentation update rules

When updating after meaningful work, record: what changed in the codebase, why,
what remains unfinished, any newly confirmed user requirement, and any new
constraint. Rewrite stale sections; remove contradictions; keep it concrete and
short. Never turn this into a chat log.
