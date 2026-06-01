import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  LOCK_PERIODS,
  TOKEN_DECIMALS,
  getStakeAccountPDA,
  calculatePendingRewards,
} from '@/lib/staking/staking-program'
import { readStakeAccount } from '@/lib/staking/server'

/**
 * On-chain staking state for the signed-in user's custodial wallet. The chain
 * is the source of truth; we synthesize the position shape the dashboard expects.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user.id)
      .single()

    if (!profile?.wallet_address) {
      return NextResponse.json({ totalStaked: 0, pendingRewards: 0, positions: [] })
    }

    const stake = await readStakeAccount(profile.wallet_address)
    if (!stake || !stake.isActive) {
      return NextResponse.json({ totalStaked: 0, pendingRewards: 0, positions: [] })
    }

    const { PublicKey } = await import('@solana/web3.js')
    const [stakePDA] = getStakeAccountPDA(new PublicKey(profile.wallet_address))

    const amount = stake.stakedAmount.toNumber() / 10 ** TOKEN_DECIMALS
    const lockSeconds = stake.lockPeriod.toNumber()
    const stakedAtMs = stake.stakeTimestamp.toNumber() * 1000
    const lockedUntilMs = (stake.stakeTimestamp.toNumber() + lockSeconds) * 1000
    const apy = LOCK_PERIODS.find((p) => p.seconds === lockSeconds)?.apy ?? stake.apyBps / 100

    const pendingRewards = calculatePendingRewards(
      stake.stakedAmount,
      lockSeconds,
      stake.stakeTimestamp.toNumber(),
      stake.lastClaimTimestamp.toNumber()
    )

    return NextResponse.json({
      totalStaked: amount,
      pendingRewards,
      positions: [
        {
          id: stakePDA.toBase58(),
          amount,
          staked_at: new Date(stakedAtMs).toISOString(),
          locked_until: new Date(lockedUntilMs).toISOString(),
          lock_period_days: Math.round(lockSeconds / 86400),
          apy,
          is_active: true,
        },
      ],
    })
  } catch (error) {
    console.error('[v0] positions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch positions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
