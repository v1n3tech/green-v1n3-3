import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCustodialKeypair } from '@/lib/wallet/mint'
import { TOKEN_DECIMALS, createUnstakeInstruction } from '@/lib/staking/staking-program'
import { signAndSendStakingTx, readStakeAccount } from '@/lib/staking/server'

/**
 * Custodial unstake: returns principal + accrued rewards on-chain. The lock
 * period is enforced by the program; we pre-check it for a friendlier error.
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
        { error: 'On-chain unstaking requires a custodial wallet. No keypair found.' },
        { status: 404 }
      )
    }

    // Read the on-chain stake account to confirm it exists and check the lock.
    const stake = await readStakeAccount(keypair.publicKey.toBase58())
    if (!stake || !stake.isActive) {
      return NextResponse.json({ error: 'No active stake found' }, { status: 400 })
    }

    const now = Math.floor(Date.now() / 1000)
    const unlockTime = stake.stakeTimestamp.toNumber() + stake.lockPeriod.toNumber()
    if (now < unlockTime) {
      const days = Math.ceil((unlockTime - now) / 86400)
      return NextResponse.json(
        { error: `Tokens are locked for ~${days} more day(s)` },
        { status: 400 }
      )
    }

    const amount = stake.stakedAmount.toNumber() / 10 ** TOKEN_DECIMALS

    const instruction = createUnstakeInstruction(keypair.publicKey)
    const signature = await signAndSendStakingTx(keypair, [instruction])

    try {
      const admin = createAdminClient()
      await admin.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'unstake',
        status: 'confirmed',
        token_symbol: 'V1N3',
        amount,
        from_address: 'staking_vault',
        to_address: keypair.publicKey.toBase58(),
        signature,
        confirmed_at: new Date().toISOString(),
      })
    } catch (logErr) {
      console.error('[v0] unstake: failed to log transaction:', logErr)
    }

    return NextResponse.json({
      success: true,
      signature,
      amount,
      message: `Successfully unstaked ${amount} V1N3`,
    })
  } catch (error) {
    console.error('[v0] unstake error:', error)
    const message = error instanceof Error ? error.message : 'Failed to unstake'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
