# V1N3 Staking Program — GreenV1n3 / AgroV1n3

Live platform: https://agro.v1n3tech.com  
Program ID (devnet): BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX  
Network: Solana Devnet | Token standard: Token-2022  
Admin wallet: DqzGbbGUXBx6wUyNjZf7y6cqcL55i6YBfPpHkXQN4m8X

A real on-chain Solana staking program (Anchor, **Token-2022**) for the V1N3 token.

- **initialize** — admin one-time setup. Creates the global `config` PDA and the
  `stake_vault` + `reward_vault` token accounts (owned by the program).
- **fund_rewards(amount)** — admin deposits V1N3 into the reward vault so rewards
  are backed by real tokens.
- **stake(amount, lock_period)** — user locks V1N3 (principal moves into the stake vault).
- **claim_rewards** — user claims accrued rewards any time (paid from the reward vault).
- **unstake** — after the lock period, user gets principal back plus remaining rewards;
  the stake account is closed and rent refunded.

Lock periods / APY (must match the frontend):

| Lock period | Seconds   | APY |
|-------------|-----------|-----|
| 3 weeks     | 1,814,400 | 25% |
| 1 month     | 2,592,000 | 40% |
| 3 months    | 7,776,000 | 65% |

## Prerequisites

```bash
# Solana CLI + Anchor (via avm). Versions that match Anchor.toml:
solana --version           # >= 1.18
avm install 0.30.1 && avm use 0.30.1
anchor --version           # anchor-cli 0.30.1

# A funded devnet keypair that is the program's upgrade authority:
solana config set --url devnet
solana address             # this must be your upgrade authority
solana airdrop 2           # if you need devnet SOL
```

## Build & deploy

This program keeps the **existing program ID**
`BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX` (already in `declare_id!` and
`Anchor.toml`). To upgrade in place you must run as the program's **upgrade
authority** AND still have the original program keypair.

```bash
cd anchor
anchor build

# Confirm the built program id matches the declared one:
anchor keys list
# v1n3_staking: BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX   <-- must match

# Upgrade the already-deployed program (you are the upgrade authority):
anchor upgrade target/deploy/v1n3_staking.so \
  --program-id BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX \
  --provider.cluster devnet

# Publish the IDL so explorers / clients can read it (first time):
anchor idl init  BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX --filepath target/idl/v1n3_staking.json --provider.cluster devnet
# ...or, if an IDL account already exists:
anchor idl upgrade BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX --filepath target/idl/v1n3_staking.json --provider.cluster devnet
```

### If you do NOT have the original program keypair / upgrade authority

Deploy as a brand-new program and point the app at it:

```bash
cd anchor
rm -f target/deploy/v1n3_staking-keypair.json   # generate a fresh program id
anchor build
anchor keys sync                                 # writes the new id into lib.rs + Anchor.toml
anchor build                                     # rebuild with the new id
anchor deploy --provider.cluster devnet
anchor idl init <NEW_PROGRAM_ID> --filepath target/idl/v1n3_staking.json --provider.cluster devnet
```

Then update the frontend constant in **`lib/staking/staking-program.ts`**:

```ts
export const STAKING_PROGRAM_ID = new PublicKey('<NEW_PROGRAM_ID>')
```

## After deploy: one-time admin steps (from the app)

1. Sign in as the admin wallet (`DqzGbb...QN4m8X`) and open **/dashboard/staking**.
2. Click **INITIALIZE VAULT** (calls `initialize`).
3. Click **FUND REWARDS** and deposit some V1N3 so the reward pool is solvent.

Staking, claiming, and unstaking then run fully on-chain for both custodial
(email) wallets and external (Phantom, etc.) wallets.
