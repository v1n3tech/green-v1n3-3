import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getV1N3Balance } from '@/lib/wallet/v1n3-token'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { amount } = body
    
    // Validate amount
    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    
    // Get staking config
    const admin = createAdminClient()
    const { data: configData } = await admin
      .from('staking_config')
      .select('key, value')
    
    const config: Record<string, string> = {}
    configData?.forEach((item: { key: string; value: unknown }) => {
      const val = item.value
      if (typeof val === 'string') {
        config[item.key] = val
      } else if (val !== null && val !== undefined) {
        config[item.key] = String(val)
      }
    })
    
    const minStakeAmount = parseFloat(config.min_stake_amount || '100')
    const isStakingEnabled = config.is_staking_enabled !== 'false'
    
    if (!isStakingEnabled) {
      return NextResponse.json({ error: 'Staking is currently disabled' }, { status: 400 })
    }
    
    if (numAmount < minStakeAmount) {
      return NextResponse.json({ error: `Minimum stake amount is ${minStakeAmount} V1N3` }, { status: 400 })
    }
    
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
    
    // Calculate lock period if configured
    const lockPeriodDays = parseInt(config.lock_period_days || '0')
    const lockedUntil = lockPeriodDays > 0 
      ? new Date(Date.now() + lockPeriodDays * 24 * 60 * 60 * 1000).toISOString()
      : null
    
    // Create staking position
    const { data: position, error: insertError } = await admin
      .from('staking_positions')
      .insert({
        user_id: user.id,
        amount: numAmount,
        locked_until: lockedUntil,
        is_active: true,
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
      confirmed_at: new Date().toISOString(),
    })
    
    return NextResponse.json({
      success: true,
      position,
      message: `Successfully staked ${numAmount} V1N3`,
    })
  } catch (error) {
    console.error('Error staking:', error)
    return NextResponse.json(
      { error: 'Failed to stake', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
