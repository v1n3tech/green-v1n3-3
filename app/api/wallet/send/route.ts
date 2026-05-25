import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCustodialKeypair } from '@/lib/wallet/mint'
import { transferV1N3, getV1N3Balance, V1N3_TOKEN } from '@/lib/wallet/v1n3-token'
import { PublicKey } from '@solana/web3.js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { toAddress, amount, memo } = body
    
    // Validate input
    if (!toAddress || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Validate amount
    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    
    // Validate Solana address
    try {
      new PublicKey(toAddress)
    } catch {
      return NextResponse.json({ error: 'Invalid Solana address' }, { status: 400 })
    }
    
    // Get user's profile with wallet address
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, wallet_address')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile?.wallet_address) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }
    
    // Check V1N3 balance
    const balance = await getV1N3Balance(profile.wallet_address)
    if (balance < numAmount) {
      return NextResponse.json({ 
        error: 'Insufficient V1N3 balance',
        balance,
        required: numAmount,
      }, { status: 400 })
    }
    
    // Get the custodial keypair
    const keypair = await getCustodialKeypair(user.id)
    
    if (!keypair) {
      return NextResponse.json({ 
        error: 'Could not retrieve wallet keypair',
      }, { status: 400 })
    }
    
    // Create pending transaction record
    const admin = createAdminClient()
    const { data: pendingTx, error: txError } = await admin
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        type: 'send',
        status: 'pending',
        token_symbol: 'V1N3',
        token_mint: V1N3_TOKEN.mintAddress,
        amount: numAmount,
        fee: 0.000005, // Estimated SOL fee
        from_address: profile.wallet_address,
        to_address: toAddress,
        memo: memo || null,
      })
      .select()
      .single()
    
    if (txError) {
      console.error('[v0] Error creating pending transaction:', txError)
      return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 })
    }
    
    // Execute the transfer
    const result = await transferV1N3(keypair, toAddress, numAmount)
    
    if (result.success) {
      // Update transaction to confirmed
      await admin
        .from('wallet_transactions')
        .update({
          status: 'confirmed',
          signature: result.signature,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', pendingTx.id)
      
      // Update user's v1n3_balance in profile
      const newBalance = balance - numAmount
      await admin
        .from('profiles')
        .update({ v1n3_balance: newBalance })
        .eq('id', user.id)
      
      return NextResponse.json({
        success: true,
        signature: result.signature,
        explorerUrl: `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`,
        newBalance,
      })
    } else {
      // Update transaction to failed
      await admin
        .from('wallet_transactions')
        .update({
          status: 'failed',
          metadata: { error: result.error },
        })
        .eq('id', pendingTx.id)
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Transfer failed',
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[v0] Error sending V1N3:', error)
    return NextResponse.json(
      { error: 'Failed to send V1N3', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
