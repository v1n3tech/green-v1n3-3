import { NextResponse } from 'next/server'
import BN from 'bn.js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCustodialKeypair } from '@/lib/wallet/mint'
import { getV1N3Balance } from '@/lib/wallet/v1n3-token'
import {
  LOCK_PERIODS,
  TOKEN_DECIMALS,
  createStakeInstruction,
} from '@/lib/staking/staking-program'
import { signAndSendStakingTx } from '@/lib/staking/server'

const MIN_STAKE = 100

/**
 * Custodial (email-wallet) stake: builds the on-chain `stake` instruction and
 * signs it with the user's decrypted custodial keypair. External wallets stake
 * client-side via the wallet adapter instead.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const amount = Number(body.amount)
    const lockPeriodSeconds = Number(body.lockPeriodSeconds)

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    if (amount < MIN_STAKE) {
      return NextResponse.json({ error: `Minimum stake amount is ${MIN_STAKE} V1N3` }, { status: 400 })
    }

    const period = LOCK_PERIODS.find((p) => p.seconds === lockPeriodSeconds)
    if (!period) {
      return NextResponse.json({ error: 'Invalid lock period' }, { status: 400 })
    }

    // Get the user's custodial keypair (server-only).
    const keypair = await getCustodialKeypair(user.id)
    if (!keypair) {
      return NextResponse.json(
        { error: 'On-chain staking requires a custodial wallet. No keypair found.' },
        { status: 404 }
      )
    }

    // Verify available on-chain balance.
    const balance = await getV1N3Balance(keypair.publicKey.toBase58())
    if (amount > balance) {
      return NextResponse.json(
        { error: 'Insufficient V1N3 balance', available: balance, requested: amount },
        { status: 400 }
      )
    }

    // Build + sign + send the on-chain stake transaction.
    const rawAmount = new BN(Math.floor(amount * 10 ** TOKEN_DECIMALS).toString())
    const instruction = createStakeInstruction(
      keypair.publicKey,
      rawAmount,
      new BN(period.seconds)
    )

    const signature = await signAndSendStakingTx(keypair, [instruction])

    // Best-effort transaction log (history only; chain is the source of truth).
    try {
      const admin = createAdminClient()
      await admin.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'stake',
        status: 'confirmed',
        token_symbol: 'V1N3',
        amount,
        from_address: keypair.publicKey.toBase58(),
        to_address: 'staking_vault',
        signature,
        confirmed_at: new Date().toISOString(),
      })
    } catch (logErr) {
      console.error('[v0] stake: failed to log transaction:', logErr)
    }

    return NextResponse.json({
      success: true,
      signature,
      message: `Successfully staked ${amount} V1N3 for ${period.label} at ${period.apy}% APY`,
    })
  } catch (error) {
    console.error('[v0] stake error:', error)
    const message = error instanceof Error ? error.message : 'Failed to stake'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
