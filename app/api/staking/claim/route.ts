import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCustodialKeypair } from '@/lib/wallet/mint'
import {
  createClaimRewardsInstruction,
  calculatePendingRewards,
} from '@/lib/staking/staking-program'
import { signAndSendStakingTx, readStakeAccount } from '@/lib/staking/server'

/**
 * Custodial claim: pays accrued rewards on-chain from the reward vault and
 * resets the accrual clock.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keypair = await getCustodialKeypair(user.id)
    if (!keypair) {
      return NextResponse.json(
        { error: 'On-chain claiming requires a custodial wallet. No keypair found.' },
        { status: 404 }
      )
    }

    const stake = await readStakeAccount(keypair.publicKey.toBase58())
    if (!stake || !stake.isActive) {
      return NextResponse.json({ error: 'No active stake found' }, { status: 400 })
    }

    const pending = calculatePendingRewards(
      stake.stakedAmount,
      stake.lockPeriod.toNumber(),
      stake.stakeTimestamp.toNumber(),
      stake.lastClaimTimestamp.toNumber()
    )
    if (pending <= 0) {
      return NextResponse.json({ error: 'No rewards to claim' }, { status: 400 })
    }

    const instruction = createClaimRewardsInstruction(keypair.publicKey)
    const signature = await signAndSendStakingTx(keypair, [instruction])

    try {
      const admin = createAdminClient()
      await admin.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'reward',
        status: 'confirmed',
        token_symbol: 'V1N3',
        amount: pending,
        from_address: 'staking_rewards',
        to_address: keypair.publicKey.toBase58(),
        signature,
        memo: 'Staking rewards claim',
        confirmed_at: new Date().toISOString(),
      })
      await admin.from('staking_rewards').insert({
        user_id: user.id,
        amount: pending,
        reward_type: 'staking',
        status: 'claimed',
        claimed_at: new Date().toISOString(),
      })
    } catch (logErr) {
      console.error('[v0] claim: failed to log reward:', logErr)
    }

    return NextResponse.json({
      success: true,
      signature,
      amount: pending,
      message: `Successfully claimed ${pending.toFixed(4)} V1N3`,
    })
  } catch (error) {
    console.error('[v0] claim error:', error)
    const message = error instanceof Error ? error.message : 'Failed to claim rewards'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
