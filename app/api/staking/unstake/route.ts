import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    
    // Get active staking positions ordered by oldest first (FIFO)
    const { data: positions, error: positionsError } = await admin
      .from('staking_positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('staked_at', { ascending: true })
    
    if (positionsError || !positions) {
      return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 })
    }
    
    const totalStaked = positions.reduce((sum, pos) => sum + Number(pos.amount), 0)
    
    if (numAmount > totalStaked) {
      return NextResponse.json({ 
        error: 'Amount exceeds staked balance',
        staked: totalStaked,
        requested: numAmount,
      }, { status: 400 })
    }
    
    // Check for locked positions
    const now = new Date()
    for (const pos of positions) {
      if (pos.locked_until && new Date(pos.locked_until) > now) {
        return NextResponse.json({ 
          error: `Position locked until ${new Date(pos.locked_until).toLocaleDateString()}`,
        }, { status: 400 })
      }
    }
    
    // Unstake using FIFO (First In, First Out)
    let remainingToUnstake = numAmount
    const updatedPositions: string[] = []
    const deactivatedPositions: string[] = []
    
    for (const pos of positions) {
      if (remainingToUnstake <= 0) break
      
      const posAmount = Number(pos.amount)
      
      if (posAmount <= remainingToUnstake) {
        // Fully unstake this position
        deactivatedPositions.push(pos.id)
        remainingToUnstake -= posAmount
      } else {
        // Partially unstake this position
        const newAmount = posAmount - remainingToUnstake
        await admin
          .from('staking_positions')
          .update({ amount: newAmount, updated_at: new Date().toISOString() })
          .eq('id', pos.id)
        updatedPositions.push(pos.id)
        remainingToUnstake = 0
      }
    }
    
    // Deactivate fully unstaked positions
    if (deactivatedPositions.length > 0) {
      await admin
        .from('staking_positions')
        .update({ 
          is_active: false, 
          unstaked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in('id', deactivatedPositions)
    }
    
    // Record transaction
    await admin.from('wallet_transactions').insert({
      user_id: user.id,
      type: 'unstake',
      status: 'confirmed',
      token_symbol: 'V1N3',
      amount: numAmount,
      from_address: 'staking_pool',
      to_address: profile.wallet_address,
      confirmed_at: new Date().toISOString(),
    })
    
    return NextResponse.json({
      success: true,
      amount: numAmount,
      message: `Successfully unstaked ${numAmount} V1N3`,
    })
  } catch (error) {
    console.error('Error unstaking:', error)
    return NextResponse.json(
      { error: 'Failed to unstake', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
