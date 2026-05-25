import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCustodialKeypair } from '@/lib/wallet/mint'
import { ensureV1N3TokenAccount, hasV1N3TokenAccount, getV1N3TokenAccountAddress } from '@/lib/wallet/v1n3-token'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    
    // Check if ATA already exists
    const hasATA = await hasV1N3TokenAccount(profile.wallet_address)
    
    if (hasATA) {
      const ataAddress = await getV1N3TokenAccountAddress(profile.wallet_address)
      return NextResponse.json({
        success: true,
        ataAddress,
        created: false,
        message: 'V1N3 token account already exists',
      })
    }
    
    // Get the custodial keypair to pay for ATA creation
    const keypair = await getCustodialKeypair(user.id)
    
    if (!keypair) {
      return NextResponse.json({ 
        error: 'Could not retrieve wallet keypair',
        requiresSOL: true,
        message: 'Please ensure your wallet has SOL for transaction fees',
      }, { status: 400 })
    }
    
    // Create the ATA
    const result = await ensureV1N3TokenAccount(profile.wallet_address, keypair)
    
    return NextResponse.json({
      success: true,
      ataAddress: result.address,
      created: result.created,
      message: 'V1N3 token account created successfully',
    })
  } catch (error) {
    console.error('[v0] Error ensuring ATA:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create token account',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    
    // Check if ATA exists
    const hasATA = await hasV1N3TokenAccount(profile.wallet_address)
    const ataAddress = await getV1N3TokenAccountAddress(profile.wallet_address)
    
    return NextResponse.json({
      hasATA,
      ataAddress,
      walletAddress: profile.wallet_address,
    })
  } catch (error) {
    console.error('[v0] Error checking ATA:', error)
    return NextResponse.json(
      { error: 'Failed to check token account' },
      { status: 500 }
    )
  }
}
