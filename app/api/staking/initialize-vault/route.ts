import { NextResponse } from 'next/server'
import { Transaction } from '@solana/web3.js'
import { createClient } from '@/lib/supabase/server'
import { getCustodialKeypair } from '@/lib/wallet/mint'
import { getConnection } from '@/lib/wallet/v1n3-token'
import { ADMIN_WALLET, createInitializeVaultInstruction } from '@/lib/staking/staking-program'

/**
 * Admin-only: initialize the on-chain reward vault using the custodial admin keypair.
 * The admin's secret key is decrypted server-side and never leaves the server.
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

    // Verify this user's wallet is the admin wallet.
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user.id)
      .single()

    if (!profile?.wallet_address || profile.wallet_address !== ADMIN_WALLET) {
      return NextResponse.json({ error: 'Only the admin wallet can initialize the vault' }, { status: 403 })
    }

    // Decrypt the custodial admin keypair (server-only).
    const adminKeypair = await getCustodialKeypair(user.id)
    if (!adminKeypair) {
      return NextResponse.json({ error: 'Admin keypair not found' }, { status: 404 })
    }
    if (adminKeypair.publicKey.toBase58() !== ADMIN_WALLET) {
      return NextResponse.json({ error: 'Keypair does not match admin wallet' }, { status: 403 })
    }

    const connection = getConnection()
    const instruction = createInitializeVaultInstruction(adminKeypair.publicKey)
    const transaction = new Transaction().add(instruction)
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = adminKeypair.publicKey
    transaction.sign(adminKeypair)

    const signature = await connection.sendRawTransaction(transaction.serialize())
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')

    return NextResponse.json({ success: true, signature })
  } catch (error) {
    console.error('[v0] initialize-vault error:', error)
    const message = error instanceof Error ? error.message : 'Failed to initialize vault'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
