import { PublicKey, Transaction, TransactionInstruction, SystemProgram, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js'
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import BN from 'bn.js'

// Program constants
export const STAKING_PROGRAM_ID = new PublicKey('BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX')
export const V1N3_TOKEN_MINT = new PublicKey('EAtP7GvoVreBt9jFH7NEQkW5bkzDWQ1uuhQ7nnSMx7g1')

// Lock period option type
export interface LockPeriodOption {
  label: string
  days: number
  seconds: number
  apy: number
  recommended: boolean
}

// Lock period options
export const LOCK_PERIODS: LockPeriodOption[] = [
  { 
    label: '3 Weeks', 
    days: 21, 
    seconds: 21 * 24 * 60 * 60, // 1,814,400 seconds
    apy: 25,
    recommended: false 
  },
  { 
    label: '1 Month', 
    days: 30, 
    seconds: 30 * 24 * 60 * 60, // 2,592,000 seconds
    apy: 40,
    recommended: false 
  },
  { 
    label: '3 Months', 
    days: 90, 
    seconds: 90 * 24 * 60 * 60, // 7,776,000 seconds
    apy: 65,
    recommended: true 
  },
]

// Instruction discriminators (first 8 bytes of sha256 hash of instruction name)
// These are Anchor-style discriminators
const STAKE_DISCRIMINATOR = Buffer.from([206, 176, 202, 18, 200, 209, 179, 108]) // sha256("global:stake")[0..8]
const UNSTAKE_DISCRIMINATOR = Buffer.from([90, 95, 107, 42, 205, 124, 50, 225]) // sha256("global:unstake")[0..8]
const CLAIM_REWARDS_DISCRIMINATOR = Buffer.from([4, 144, 132, 71, 116, 23, 151, 80]) // sha256("global:claim_rewards")[0..8]

// PDA seeds
const STAKE_INFO_SEED = 'stake_info'
const STAKE_VAULT_SEED = 'stake_vault'
const REWARD_VAULT_SEED = 'reward_vault'

export interface StakeInfo {
  owner: PublicKey
  stakedAmount: BN
  lockPeriod: BN
  stakeTimestamp: BN
  lastClaimTimestamp: BN
  isActive: boolean
}

/**
 * Get the stake info PDA for a user
 */
export function getStakeInfoPDA(userPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(STAKE_INFO_SEED), userPubkey.toBuffer()],
    STAKING_PROGRAM_ID
  )
}

/**
 * Get the stake vault PDA (where staked tokens are held)
 */
export function getStakeVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(STAKE_VAULT_SEED)],
    STAKING_PROGRAM_ID
  )
}

/**
 * Get the reward vault PDA (where reward tokens come from)
 */
export function getRewardVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REWARD_VAULT_SEED)],
    STAKING_PROGRAM_ID
  )
}

/**
 * Create a stake instruction
 */
export function createStakeInstruction(
  userPubkey: PublicKey,
  amount: BN,
  lockPeriodSeconds: BN
): TransactionInstruction {
  const [stakeInfoPDA] = getStakeInfoPDA(userPubkey)
  const [stakeVaultPDA] = getStakeVaultPDA()
  
  const userTokenAccount = getAssociatedTokenAddressSync(
    V1N3_TOKEN_MINT,
    userPubkey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  // Encode instruction data: discriminator + amount (u64) + lock_period (u64)
  const data = Buffer.alloc(8 + 8 + 8)
  STAKE_DISCRIMINATOR.copy(data, 0)
  amount.toArrayLike(Buffer, 'le', 8).copy(data, 8)
  lockPeriodSeconds.toArrayLike(Buffer, 'le', 8).copy(data, 16)

  return new TransactionInstruction({
    programId: STAKING_PROGRAM_ID,
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: stakeInfoPDA, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: stakeVaultPDA, isSigner: false, isWritable: true },
      { pubkey: V1N3_TOKEN_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  })
}

/**
 * Create an unstake instruction
 */
export function createUnstakeInstruction(userPubkey: PublicKey): TransactionInstruction {
  const [stakeInfoPDA] = getStakeInfoPDA(userPubkey)
  const [stakeVaultPDA] = getStakeVaultPDA()
  
  const userTokenAccount = getAssociatedTokenAddressSync(
    V1N3_TOKEN_MINT,
    userPubkey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const data = Buffer.alloc(8)
  UNSTAKE_DISCRIMINATOR.copy(data, 0)

  return new TransactionInstruction({
    programId: STAKING_PROGRAM_ID,
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: stakeInfoPDA, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: stakeVaultPDA, isSigner: false, isWritable: true },
      { pubkey: V1N3_TOKEN_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  })
}

/**
 * Create a claim rewards instruction
 */
export function createClaimRewardsInstruction(userPubkey: PublicKey): TransactionInstruction {
  const [stakeInfoPDA] = getStakeInfoPDA(userPubkey)
  const [rewardVaultPDA] = getRewardVaultPDA()
  
  const userTokenAccount = getAssociatedTokenAddressSync(
    V1N3_TOKEN_MINT,
    userPubkey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const data = Buffer.alloc(8)
  CLAIM_REWARDS_DISCRIMINATOR.copy(data, 0)

  return new TransactionInstruction({
    programId: STAKING_PROGRAM_ID,
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: stakeInfoPDA, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: rewardVaultPDA, isSigner: false, isWritable: true },
      { pubkey: V1N3_TOKEN_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  })
}

/**
 * Parse stake info account data
 */
export function parseStakeInfo(data: Buffer): StakeInfo | null {
  try {
    if (data.length < 8 + 32 + 8 + 8 + 8 + 8 + 1) return null
    
    // Skip 8-byte discriminator
    let offset = 8
    
    const owner = new PublicKey(data.slice(offset, offset + 32))
    offset += 32
    
    const stakedAmount = new BN(data.slice(offset, offset + 8), 'le')
    offset += 8
    
    const lockPeriod = new BN(data.slice(offset, offset + 8), 'le')
    offset += 8
    
    const stakeTimestamp = new BN(data.slice(offset, offset + 8), 'le')
    offset += 8
    
    const lastClaimTimestamp = new BN(data.slice(offset, offset + 8), 'le')
    offset += 8
    
    const isActive = data[offset] === 1
    
    return {
      owner,
      stakedAmount,
      lockPeriod,
      stakeTimestamp,
      lastClaimTimestamp,
      isActive,
    }
  } catch {
    return null
  }
}

/**
 * Calculate pending rewards based on staked amount, APY, and time elapsed
 */
export function calculatePendingRewards(
  stakedAmount: BN,
  lockPeriodSeconds: number,
  stakeTimestamp: number,
  lastClaimTimestamp: number
): number {
  const now = Math.floor(Date.now() / 1000)
  const timeElapsed = now - lastClaimTimestamp
  
  // Find APY for lock period
  const lockPeriod = LOCK_PERIODS.find(lp => lp.seconds === lockPeriodSeconds)
  const apy = lockPeriod?.apy || 25
  
  // Calculate rewards: (stakedAmount * APY * timeElapsed) / (365 * 24 * 60 * 60 * 100)
  const stakedNum = stakedAmount.toNumber() / 1e9 // Convert from lamports
  const yearSeconds = 365 * 24 * 60 * 60
  const rewards = (stakedNum * apy * timeElapsed) / (yearSeconds * 100)
  
  return rewards
}

/**
 * Get Solana Explorer URL for a transaction
 */
export function getExplorerUrl(signature: string, cluster: 'devnet' | 'mainnet-beta' = 'devnet'): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`
}

/**
 * Format time remaining until unlock
 */
export function formatTimeRemaining(unlockTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const remaining = unlockTimestamp - now
  
  if (remaining <= 0) return 'Unlocked'
  
  const days = Math.floor(remaining / (24 * 60 * 60))
  const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((remaining % (60 * 60)) / 60)
  
  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}
