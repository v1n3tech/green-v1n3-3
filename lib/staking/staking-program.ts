import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js'
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import BN from 'bn.js'

// Program constants
export const STAKING_PROGRAM_ID = new PublicKey('BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX')
export const V1N3_TOKEN_MINT = new PublicKey('EAtP7GvoVreBt9jFH7NEQkW5bkzDWQ1uuhQ7nnSMx7g1')
export const TOKEN_DECIMALS = 9

// Admin wallet (Mantim) - only this wallet can initialize / fund the vault
export const ADMIN_WALLET = 'DqzGbbGUXBx6wUyNjZf7y6cqcL55i6YBfPpHkXQN4m8X'

// Lock period option type
export interface LockPeriodOption {
  label: string
  days: number
  seconds: number
  apy: number
  recommended: boolean
}

// Lock period options - MUST match the on-chain program's apy_for_lock_period().
export const LOCK_PERIODS: LockPeriodOption[] = [
  { label: '3 Weeks', days: 21, seconds: 21 * 24 * 60 * 60, apy: 25, recommended: false },
  { label: '1 Month', days: 30, seconds: 30 * 24 * 60 * 60, apy: 40, recommended: false },
  { label: '3 Months', days: 90, seconds: 90 * 24 * 60 * 60, apy: 65, recommended: true },
]

// Anchor instruction discriminators = sha256("global:<name>")[0..8]
const INITIALIZE_DISCRIMINATOR = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237])
const FUND_REWARDS_DISCRIMINATOR = Buffer.from([114, 64, 163, 112, 175, 167, 19, 121])
const STAKE_DISCRIMINATOR = Buffer.from([206, 176, 202, 18, 200, 209, 179, 108])
const UNSTAKE_DISCRIMINATOR = Buffer.from([90, 95, 107, 42, 205, 124, 50, 225])
const CLAIM_REWARDS_DISCRIMINATOR = Buffer.from([4, 144, 132, 71, 116, 23, 151, 80])

// PDA seeds (must match the on-chain program)
const CONFIG_SEED = 'config'
const STAKE_VAULT_SEED = 'stake_vault'
const REWARD_VAULT_SEED = 'reward_vault'
const STAKE_SEED = 'stake'

export interface StakeInfo {
  owner: PublicKey
  stakedAmount: BN
  lockPeriod: BN
  stakeTimestamp: BN
  lastClaimTimestamp: BN
  apyBps: number
  isActive: boolean
}

export interface VaultConfig {
  admin: PublicKey
  mint: PublicKey
  stakeVault: PublicKey
  rewardVault: PublicKey
  totalStaked: BN
}

// ---------------------------------------------------------------------------
// PDA helpers
// ---------------------------------------------------------------------------

/** Global config PDA. Owns both vault token accounts. */
export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from(CONFIG_SEED)], STAKING_PROGRAM_ID)
}

/** Stake vault token account PDA (holds staked principal). */
export function getStakeVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from(STAKE_VAULT_SEED)], STAKING_PROGRAM_ID)
}

/** Reward vault token account PDA (holds reward pool). */
export function getRewardVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from(REWARD_VAULT_SEED)], STAKING_PROGRAM_ID)
}

/** Per-user stake account PDA. */
export function getStakeAccountPDA(userPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(STAKE_SEED), userPubkey.toBuffer()],
    STAKING_PROGRAM_ID
  )
}

/** Backwards-compatible alias used by existing callers. */
export const getStakeInfoPDA = getStakeAccountPDA

/** V1N3 (Token-2022) associated token account for a wallet. */
export function getV1N3Ata(owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(V1N3_TOKEN_MINT, owner, false, TOKEN_2022_PROGRAM_ID)
}

// ---------------------------------------------------------------------------
// Instruction builders. Account order MUST match the Anchor #[derive(Accounts)]
// structs in anchor/programs/v1n3_staking/src/lib.rs exactly.
// ---------------------------------------------------------------------------

/**
 * `initialize` (admin only): creates config + stake_vault + reward_vault.
 * Accounts: admin, config, stake_vault, reward_vault, mint, token_program, system_program.
 */
export function createInitializeVaultInstruction(adminPubkey: PublicKey): TransactionInstruction {
  const [configPDA] = getConfigPDA()
  const [stakeVaultPDA] = getStakeVaultPDA()
  const [rewardVaultPDA] = getRewardVaultPDA()

  const data = Buffer.alloc(8)
  INITIALIZE_DISCRIMINATOR.copy(data, 0)

  return new TransactionInstruction({
    programId: STAKING_PROGRAM_ID,
    keys: [
      { pubkey: adminPubkey, isSigner: true, isWritable: true },
      { pubkey: configPDA, isSigner: false, isWritable: true },
      { pubkey: stakeVaultPDA, isSigner: false, isWritable: true },
      { pubkey: rewardVaultPDA, isSigner: false, isWritable: true },
      { pubkey: V1N3_TOKEN_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  })
}

/**
 * `fund_rewards(amount)` (admin only): deposit V1N3 into the reward vault.
 * Accounts: admin, config, reward_vault, admin_ata, mint, token_program.
 */
export function createFundRewardsInstruction(
  adminPubkey: PublicKey,
  amount: BN
): TransactionInstruction {
  const [configPDA] = getConfigPDA()
  const [rewardVaultPDA] = getRewardVaultPDA()
  const adminAta = getV1N3Ata(adminPubkey)

  const data = Buffer.alloc(8 + 8)
  FUND_REWARDS_DISCRIMINATOR.copy(data, 0)
  amount.toArrayLike(Buffer, 'le', 8).copy(data, 8)

  return new TransactionInstruction({
    programId: STAKING_PROGRAM_ID,
    keys: [
      { pubkey: adminPubkey, isSigner: true, isWritable: true },
      { pubkey: configPDA, isSigner: false, isWritable: false },
      { pubkey: rewardVaultPDA, isSigner: false, isWritable: true },
      { pubkey: adminAta, isSigner: false, isWritable: true },
      { pubkey: V1N3_TOKEN_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  })
}

/**
 * `stake(amount, lock_period)`.
 * Accounts: user, config, stake_account, stake_vault, user_ata, mint, token_program, system_program.
 */
export function createStakeInstruction(
  userPubkey: PublicKey,
  amount: BN,
  lockPeriodSeconds: BN
): TransactionInstruction {
  const [configPDA] = getConfigPDA()
  const [stakeAccountPDA] = getStakeAccountPDA(userPubkey)
  const [stakeVaultPDA] = getStakeVaultPDA()
  const userAta = getV1N3Ata(userPubkey)

  // discriminator + amount (u64 LE) + lock_period (i64 LE)
  const data = Buffer.alloc(8 + 8 + 8)
  STAKE_DISCRIMINATOR.copy(data, 0)
  amount.toArrayLike(Buffer, 'le', 8).copy(data, 8)
  lockPeriodSeconds.toArrayLike(Buffer, 'le', 8).copy(data, 16)

  return new TransactionInstruction({
    programId: STAKING_PROGRAM_ID,
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: configPDA, isSigner: false, isWritable: true },
      { pubkey: stakeAccountPDA, isSigner: false, isWritable: true },
      { pubkey: stakeVaultPDA, isSigner: false, isWritable: true },
      { pubkey: userAta, isSigner: false, isWritable: true },
      { pubkey: V1N3_TOKEN_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  })
}

/**
 * `claim_rewards`.
 * Accounts: user, config, stake_account, reward_vault, user_ata, mint, token_program.
 */
export function createClaimRewardsInstruction(userPubkey: PublicKey): TransactionInstruction {
  const [configPDA] = getConfigPDA()
  const [stakeAccountPDA] = getStakeAccountPDA(userPubkey)
  const [rewardVaultPDA] = getRewardVaultPDA()
  const userAta = getV1N3Ata(userPubkey)

  const data = Buffer.alloc(8)
  CLAIM_REWARDS_DISCRIMINATOR.copy(data, 0)

  return new TransactionInstruction({
    programId: STAKING_PROGRAM_ID,
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: configPDA, isSigner: false, isWritable: false },
      { pubkey: stakeAccountPDA, isSigner: false, isWritable: true },
      { pubkey: rewardVaultPDA, isSigner: false, isWritable: true },
      { pubkey: userAta, isSigner: false, isWritable: true },
      { pubkey: V1N3_TOKEN_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  })
}

/**
 * `unstake`.
 * Accounts: user, config, stake_account, stake_vault, reward_vault, user_ata, mint, token_program.
 */
export function createUnstakeInstruction(userPubkey: PublicKey): TransactionInstruction {
  const [configPDA] = getConfigPDA()
  const [stakeAccountPDA] = getStakeAccountPDA(userPubkey)
  const [stakeVaultPDA] = getStakeVaultPDA()
  const [rewardVaultPDA] = getRewardVaultPDA()
  const userAta = getV1N3Ata(userPubkey)

  const data = Buffer.alloc(8)
  UNSTAKE_DISCRIMINATOR.copy(data, 0)

  return new TransactionInstruction({
    programId: STAKING_PROGRAM_ID,
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: configPDA, isSigner: false, isWritable: true },
      { pubkey: stakeAccountPDA, isSigner: false, isWritable: true },
      { pubkey: stakeVaultPDA, isSigner: false, isWritable: true },
      { pubkey: rewardVaultPDA, isSigner: false, isWritable: true },
      { pubkey: userAta, isSigner: false, isWritable: true },
      { pubkey: V1N3_TOKEN_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  })
}

// ---------------------------------------------------------------------------
// Account parsers
// ---------------------------------------------------------------------------

/**
 * Parse a StakeAccount: disc(8) owner(32) mint(32) amount(u64) lock_period(i64)
 * start_ts(i64) last_claim_ts(i64) apy_bps(u16) bump(u8).
 */
export function parseStakeInfo(data: Buffer): StakeInfo | null {
  try {
    if (data.length < 8 + 32 + 32 + 8 + 8 + 8 + 8 + 2 + 1) return null
    let offset = 8

    const owner = new PublicKey(data.subarray(offset, offset + 32))
    offset += 32

    // mint (recorded on-chain; not currently surfaced in StakeInfo)
    offset += 32

    const stakedAmount = new BN(data.subarray(offset, offset + 8), 'le')
    offset += 8

    const lockPeriod = new BN(data.subarray(offset, offset + 8), 'le')
    offset += 8

    const stakeTimestamp = new BN(data.subarray(offset, offset + 8), 'le')
    offset += 8

    const lastClaimTimestamp = new BN(data.subarray(offset, offset + 8), 'le')
    offset += 8

    const apyBps = data.readUInt16LE(offset)
    offset += 2

    return {
      owner,
      stakedAmount,
      lockPeriod,
      stakeTimestamp,
      lastClaimTimestamp,
      apyBps,
      isActive: !stakedAmount.isZero(),
    }
  } catch {
    return null
  }
}

/**
 * Parse the Config account: disc(8) admin(32) mint(32) stake_vault(32)
 * reward_vault(32) total_staked(u64) bump(u8).
 */
export function parseVaultConfig(data: Buffer): VaultConfig | null {
  try {
    if (data.length < 8 + 32 * 4 + 8 + 1) return null
    let offset = 8
    const admin = new PublicKey(data.subarray(offset, offset + 32))
    offset += 32
    const mint = new PublicKey(data.subarray(offset, offset + 32))
    offset += 32
    const stakeVault = new PublicKey(data.subarray(offset, offset + 32))
    offset += 32
    const rewardVault = new PublicKey(data.subarray(offset, offset + 32))
    offset += 32
    const totalStaked = new BN(data.subarray(offset, offset + 8), 'le')
    return { admin, mint, stakeVault, rewardVault, totalStaked }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Reward math (mirrors the on-chain calc_rewards formula)
// ---------------------------------------------------------------------------

/**
 * rewards = stakedAmount * apy * timeElapsed / (SECONDS_PER_YEAR * 100)
 * Returned in human-readable V1N3 (not raw units).
 */
export function calculatePendingRewards(
  stakedAmount: BN,
  lockPeriodSeconds: number,
  _stakeTimestamp: number,
  lastClaimTimestamp: number
): number {
  const now = Math.floor(Date.now() / 1000)
  const timeElapsed = now - lastClaimTimestamp
  if (timeElapsed <= 0) return 0

  const lockPeriod = LOCK_PERIODS.find((lp) => lp.seconds === lockPeriodSeconds)
  const apy = lockPeriod?.apy || 25

  const stakedNum = stakedAmount.toNumber() / 10 ** TOKEN_DECIMALS
  const yearSeconds = 365 * 24 * 60 * 60
  return (stakedNum * apy * timeElapsed) / (yearSeconds * 100)
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function getExplorerUrl(
  signature: string,
  cluster: 'devnet' | 'mainnet-beta' = 'devnet'
): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`
}

/** Accepts seconds remaining until unlock. */
export function formatTimeRemaining(secondsRemaining: number): string {
  if (secondsRemaining <= 0) return 'Unlocked'
  const days = Math.floor(secondsRemaining / (24 * 60 * 60))
  const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60)
  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}
