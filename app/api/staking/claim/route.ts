import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// APY rates by lock period (in seconds)
function getApyForLockPeriod(lockSeconds: number): number {
  if (lockSeconds >= 90 * 24 * 60 * 60) return 65  // 3 months
  if (lockSeconds >= 30 * 24 * 60 * 60) return 40  // 1 month
  if (lockSeconds >= 21 * 24 * 60 * 60) return 25  // 3 weeks
  return 35 // default
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const admin = createAdminClient()
    
    // Get user's wallet
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user.id)
      .single()
    
    if (!profile?.wallet_address) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }
    
    // Get active staking positions
    const { data: positions, error: positionsError } = await admin
      .from('staking_positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    if (positionsError || !positions || positions.length === 0) {
      return NextResponse.json({ error: 'No active staking positions' }, { status: 400 })
    }
    
    // Calculate total pending rewards based on each position's lock period APY
    let totalRewards = 0
    const now = Date.now()
    
    for (const pos of positions) {
      const stakedAt = new Date(pos.staked_at).getTime()
      const lockedUntil = pos.locked_until ? new Date(pos.locked_until).getTime() : null
      
      // Calculate lock period from staked_at to locked_until
      const lockSeconds = lockedUntil ? Math.floor((lockedUntil - stakedAt) / 1000) : 0
      const apy = getApyForLockPeriod(lockSeconds)
      const dailyRate = apy / 365 / 100
      
      const daysStaked = (now - stakedAt) / (1000 * 60 * 60 * 24)
      const earned = Number(pos.amount) * dailyRate * daysStaked
      const pending = earned - Number(pos.rewards_claimed || 0)
      totalRewards += Math.max(0, pending)
    }
    
    if (totalRewards <= 0) {
      return NextResponse.json({ error: 'No rewards to claim' }, { status: 400 })
    }
    
    // Round to 6 decimal places
    totalRewards = Math.floor(totalRewards * 1000000) / 1000000
    
    // Update all positions with claimed rewards
    for (const pos of positions) {
      const stakedAt = new Date(pos.staked_at).getTime()
      const lockedUntil = pos.locked_until ? new Date(pos.locked_until).getTime() : null
      const lockSeconds = lockedUntil ? Math.floor((lockedUntil - stakedAt) / 1000) : 0
      const apy = getApyForLockPeriod(lockSeconds)
      const dailyRate = apy / 365 / 100
      
      const daysStaked = (now - stakedAt) / (1000 * 60 * 60 * 24)
      const earned = Number(pos.amount) * dailyRate * daysStaked
      
      await admin
        .from('staking_positions')
        .update({ 
          rewards_claimed: earned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pos.id)
    }
    
    // Record reward claim as a transaction
    await admin.from('wallet_transactions').insert({
      user_id: user.id,
      type: 'reward',
      status: 'confirmed',
      token_symbol: 'V1N3',
      amount: totalRewards,
      from_address: 'staking_rewards',
      to_address: profile.wallet_address,
      confirmed_at: new Date().toISOString(),
      memo: 'Staking rewards claim',
    })
    
    // Record staking reward entry
    await admin.from('staking_rewards').insert({
      user_id: user.id,
      amount: totalRewards,
      reward_type: 'staking',
      status: 'claimed',
      claimed_at: new Date().toISOString(),
    })
    
    return NextResponse.json({
      success: true,
      amount: totalRewards,
      message: `Successfully claimed ${totalRewards.toFixed(6)} V1N3`,
    })
  } catch (error) {
    console.error('Error claiming rewards:', error)
    return NextResponse.json(
      { error: 'Failed to claim rewards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
