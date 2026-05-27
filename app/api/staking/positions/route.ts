import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get active staking positions
    const { data: positions, error: positionsError } = await supabase
      .from('staking_positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('staked_at', { ascending: false })
    
    if (positionsError) {
      return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 })
    }
    
    return NextResponse.json({
      positions: positions || [],
    })
  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch positions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
