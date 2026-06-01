import { NextResponse } from 'next/server'
import BN from 'bn.js'
import { createClient } from '@/lib/supabase/server'
import { getCustodialKeypair } from '@/lib/wallet/mint'
import { getV1N3Balance } from '@/lib/wallet/v1n3-token'
import {
  ADMIN_WALLET,
  TOKEN_DECIMALS,
  createFundRewardsInstruction,
} from '@/lib/staking/staking-program'
import { signAndSendStakingTx } from '@/lib/staking/server'

/**
 * Admin-only: deposit V1N3 into the on-chain reward vault so staking rewards are
 * backed by real tokens. Signed server-side with the custodial admin keypair.
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

    const { amount } = await request.json()
    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user.id)
      .single()

    if (profile?.wallet_address !== ADMIN_WALLET) {
      return NextResponse.json({ error: 'Only the admin wallet can fund rewards' }, { status: 403 })
    }

    const keypair = await getCustodialKeypair(user.id)
    if (!keypair || keypair.publicKey.toBase58() !== ADMIN_WALLET) {
      return NextResponse.json({ error: 'Admin keypair not found' }, { status: 404 })
    }

    const balance = await getV1N3Balance(keypair.publicKey.toBase58())
    if (numAmount > balance) {
      return NextResponse.json(
        { error: 'Insufficient V1N3 balance', available: balance, requested: numAmount },
        { status: 400 }
      )
    }

    const rawAmount = new BN(Math.floor(numAmount * 10 ** TOKEN_DECIMALS).toString())
    const instruction = createFundRewardsInstruction(keypair.publicKey, rawAmount)
    const signature = await signAndSendStakingTx(keypair, [instruction])

    return NextResponse.json({
      success: true,
      signature,
      message: `Funded reward vault with ${numAmount} V1N3`,
    })
  } catch (error) {
    console.error('[v0] fund-rewards error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fund rewards'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
