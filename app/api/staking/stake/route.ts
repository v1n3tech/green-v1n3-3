import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getV1N3Balance } from '@/lib/wallet/v1n3-token'

// Lock period options
const LOCK_PERIODS = {
  '3_weeks': { seconds: 21 * 24 * 60 * 60, apy: 25, label: '3 Weeks' },
  '1_month': { seconds: 30 * 24 * 60 * 60, apy: 40, label: '1 Month' },
  '3_months': { seconds: 90 * 24 * 60 * 60, apy: 65, label: '3 Months' },
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { amount, lockPeriod = '3_months' } = body
    
    // Validate amount
    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    
    // Validate lock period
    const periodConfig = LOCK_PERIODS[lockPeriod as keyof typeof LOCK_PERIODS]
    if (!periodConfig) {
      return NextResponse.json({ error: 'Invalid lock period' }, { status: 400 })
    }
    
    const minStakeAmount = 100
    if (numAmount < minStakeAmount) {
      return NextResponse.json({ error: `Minimum stake amount is ${minStakeAmount} V1N3` }, { status: 400 })
    }
    
    const admin = createAdminClient()
    
    // Get user's wallet and balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile?.wallet_address) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }
    
    // Check on-chain balance
    const balance = await getV1N3Balance(profile.wallet_address)
    
    // Get current staked amount
    const { data: currentPositions } = await admin
      .from('staking_positions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    const totalStaked = currentPositions?.reduce((sum, pos) => sum + Number(pos.amount), 0) || 0
    const availableBalance = balance - totalStaked
    
    if (numAmount > availableBalance) {
      return NextResponse.json({ 
        error: 'Insufficient available balance',
        available: availableBalance,
        requested: numAmount,
      }, { status: 400 })
    }
    
    // Calculate lock end time
    const stakedAt = new Date()
    const lockedUntil = new Date(stakedAt.getTime() + periodConfig.seconds * 1000)
    
    // Create staking position
    const { data: position, error: insertError } = await admin
      .from('staking_positions')
      .insert({
        user_id: user.id,
        amount: numAmount,
        staked_at: stakedAt.toISOString(),
        locked_until: lockedUntil.toISOString(),
        is_active: true,
        rewards_claimed: 0,
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating staking position:', insertError)
      return NextResponse.json({ error: 'Failed to create staking position' }, { status: 500 })
    }
    
    // Record transaction
    await admin.from('wallet_transactions').insert({
      user_id: user.id,
      type: 'stake',
      status: 'confirmed',
      token_symbol: 'V1N3',
      amount: numAmount,
      from_address: profile.wallet_address,
      to_address: 'staking_pool',
      confirmed_at: stakedAt.toISOString(),
    })
    
    return NextResponse.json({
      success: true,
      position: {
        ...position,
        apy: periodConfig.apy,
        lockPeriodLabel: periodConfig.label,
      },
      message: `Successfully staked ${numAmount} V1N3 for ${periodConfig.label} at ${periodConfig.apy}% APY`,
    })
  } catch (error) {
    console.error('Error staking:', error)
    return NextResponse.json(
      { error: 'Failed to stake', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
