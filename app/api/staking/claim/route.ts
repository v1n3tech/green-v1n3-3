import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const admin = createAdminClient()
    
    // Get staking config for APY
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
    
    const baseApy = parseFloat(config.base_apy || '35')
    const dailyRate = baseApy / 365 / 100
    
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
    
    // Calculate total pending rewards
    let totalRewards = 0
    const now = Date.now()
    
    for (const pos of positions) {
      const stakedAt = new Date(pos.staked_at).getTime()
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
    
    // Update user's V1N3 balance in profile
    const { data: currentProfile } = await admin
      .from('profiles')
      .select('v1n3_balance')
      .eq('id', user.id)
      .single()
    
    const newBalance = (currentProfile?.v1n3_balance || 0) + totalRewards
    await admin
      .from('profiles')
      .update({ v1n3_balance: newBalance })
      .eq('id', user.id)
    
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
