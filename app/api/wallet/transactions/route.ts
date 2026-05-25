import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getV1N3Transactions, getSOLBalance, getV1N3Balance } from '@/lib/wallet/v1n3-token'

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
    
    // Fetch balances and transactions in parallel
    const [solBalance, v1n3Balance, blockchainTxs] = await Promise.all([
      getSOLBalance(profile.wallet_address),
      getV1N3Balance(profile.wallet_address),
      getV1N3Transactions(profile.wallet_address, 20),
    ])
    
    // Also fetch database transactions
    const { data: dbTransactions } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    // Merge and deduplicate transactions
    const allTransactions = mergeTransactions(blockchainTxs, dbTransactions || [])
    
    return NextResponse.json({
      balances: {
        sol: solBalance,
        v1n3: v1n3Balance,
      },
      transactions: allTransactions,
      walletAddress: profile.wallet_address,
    })
  } catch (error) {
    console.error('[v0] Error fetching wallet data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    )
  }
}

interface BlockchainTx {
  signature: string
  type: 'send' | 'receive'
  amount: number
  counterparty: string
  timestamp: number
  status: 'confirmed' | 'failed'
}

interface DbTransaction {
  id: string
  signature: string | null
  type: string
  status: string
  token_symbol: string
  amount: number
  from_address: string
  to_address: string
  created_at: string
  memo: string | null
}

function mergeTransactions(
  blockchainTxs: BlockchainTx[],
  dbTransactions: DbTransaction[]
) {
  const merged = new Map<string, {
    id: string
    signature: string | null
    type: string
    status: string
    tokenSymbol: string
    amount: number
    fromAddress: string
    toAddress: string
    timestamp: number
    memo: string | null
    source: 'blockchain' | 'database' | 'both'
  }>()
  
  // Add blockchain transactions
  for (const tx of blockchainTxs) {
    merged.set(tx.signature, {
      id: tx.signature,
      signature: tx.signature,
      type: tx.type,
      status: tx.status,
      tokenSymbol: 'V1N3',
      amount: tx.amount,
      fromAddress: tx.type === 'send' ? 'You' : tx.counterparty,
      toAddress: tx.type === 'receive' ? 'You' : tx.counterparty,
      timestamp: tx.timestamp,
      memo: null,
      source: 'blockchain',
    })
  }
  
  // Add or merge database transactions
  for (const tx of dbTransactions) {
    const key = tx.signature || tx.id
    const existing = merged.get(key)
    
    if (existing) {
      existing.source = 'both'
      existing.memo = tx.memo
    } else {
      merged.set(key, {
        id: tx.id,
        signature: tx.signature,
        type: tx.type,
        status: tx.status,
        tokenSymbol: tx.token_symbol,
        amount: Number(tx.amount),
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        timestamp: new Date(tx.created_at).getTime(),
        memo: tx.memo,
        source: 'database',
      })
    }
  }
  
  // Sort by timestamp descending
  return Array.from(merged.values()).sort((a, b) => b.timestamp - a.timestamp)
}
