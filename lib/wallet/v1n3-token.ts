import { PublicKey, Connection, clusterApiUrl, Transaction, sendAndConfirmTransaction, Keypair } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountInstruction, ASSOCIATED_TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, createTransferInstruction } from '@solana/spl-token'

// Network configuration (env-driven, mainnet by default after the V1N3 launch).
// Override per environment with NEXT_PUBLIC_SOLANA_NETWORK / NEXT_PUBLIC_V1N3_MINT_ADDRESS.
type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet'

export const SOLANA_NETWORK: SolanaCluster =
  (process.env.NEXT_PUBLIC_SOLANA_NETWORK as SolanaCluster | undefined) ?? 'mainnet-beta'

// Mainnet V1N3 mint (Token-2022). Devnet builds can override via env.
const DEFAULT_MINT_ADDRESS = 'StYmxutozcFfYtjaxEqLt8f5fX3ZGgTbgkn9rdg3To2'

// Custom RPC endpoint (Helius/QuickNode/etc). Public mainnet RPC is heavily
// rate-limited, so a dedicated endpoint is strongly recommended in production.
// Falls back to the public cluster endpoint when not set.
export const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || clusterApiUrl(SOLANA_NETWORK)

// V1N3 Token Configuration
// NOTE: V1N3 uses Token-2022 program, NOT the legacy Token program!
export const V1N3_TOKEN = {
  name: 'V1n3',
  symbol: 'V1N3',
  decimals: 9,
  // Total fixed supply minted on mainnet (mint authority permanently revoked).
  totalSupply: 4_000_000_000,
  mintAddress: process.env.NEXT_PUBLIC_V1N3_MINT_ADDRESS || DEFAULT_MINT_ADDRESS,
  programId: 'BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX',
  network: SOLANA_NETWORK,
  // Exchange rate: 1 V1N3 = 3002.40 NGN (mock rate for display)
  ngnRate: 3002.40,
} as const

// Public keys
export const V1N3_MINT_PUBKEY = new PublicKey(V1N3_TOKEN.mintAddress)
export const V1N3_PROGRAM_PUBKEY = new PublicKey(V1N3_TOKEN.programId)

// Create connection to Solana (network via env, mainnet by default)
export function getConnection(): Connection {
  return new Connection(SOLANA_RPC_ENDPOINT, 'confirmed')
}

// Get V1N3 token balance for a wallet address (Token-2022)
export async function getV1N3Balance(walletAddress: string): Promise<number> {
  try {
    const connection = getConnection()
    const walletPubkey = new PublicKey(walletAddress)
    
    // Get the associated token account for V1N3 (Token-2022)
    const tokenAccountAddress = await getAssociatedTokenAddress(
      V1N3_MINT_PUBKEY,
      walletPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    )
    
    try {
      const tokenAccount = await getAccount(connection, tokenAccountAddress, 'confirmed', TOKEN_2022_PROGRAM_ID)
      // Convert from lamports (raw amount) to token amount
      const balance = Number(tokenAccount.amount) / Math.pow(10, V1N3_TOKEN.decimals)
      return balance
    } catch {
      // Token account doesn't exist yet - balance is 0
      return 0
    }
  } catch (error) {
    console.error('Error fetching V1N3 balance:', error)
    return 0
  }
}

// Get SOL balance for a wallet address
export async function getSOLBalance(walletAddress: string): Promise<number> {
  try {
    const connection = getConnection()
    const walletPubkey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(walletPubkey)
    // Convert from lamports to SOL
    return balance / 1e9
  } catch (error) {
    console.error('Error fetching SOL balance:', error)
    return 0
  }
}

// Convert V1N3 to NGN display value
export function v1n3ToNGN(v1n3Amount: number): number {
  return v1n3Amount * V1N3_TOKEN.ngnRate
}

// Format V1N3 balance for display
export function formatV1N3Balance(balance: number): string {
  if (balance < 1) {
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })
  }
  return balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Format NGN value for display
export function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

// Get Solana Explorer URL for transaction or address
export function getExplorerUrl(signature: string, type: 'tx' | 'address' = 'tx'): string {
  const base = 'https://explorer.solana.com'
  // Mainnet is the explorer default; only append a cluster param for non-mainnet.
  const cluster = SOLANA_NETWORK === 'mainnet-beta' ? '' : `?cluster=${SOLANA_NETWORK}`
  return `${base}/${type}/${signature}${cluster}`
}

// IDL for the V1N3 program (Anchor)
export const V1N3_IDL = {
  address: V1N3_TOKEN.programId,
  metadata: {
    name: 'v1n3',
    version: '0.1.0',
    spec: '0.1.0',
    description: 'Created with Anchor',
  },
  instructions: [
    {
      name: 'initialize',
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
      accounts: [],
      args: [],
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'CustomError',
      msg: 'Custom error message',
    },
  ],
  constants: [
    {
      name: 'SEED',
      type: 'string',
      value: '"anchor"',
    },
  ],
} as const

// Get Associated Token Account address for V1N3 (using Token-2022)
export async function getV1N3TokenAccountAddress(walletAddress: string): Promise<string> {
  const walletPubkey = new PublicKey(walletAddress)
  const ata = await getAssociatedTokenAddress(
    V1N3_MINT_PUBKEY, 
    walletPubkey,
    false,
    TOKEN_2022_PROGRAM_ID
  )
  return ata.toBase58()
}

// Check if V1N3 ATA exists for a wallet (using Token-2022)
export async function hasV1N3TokenAccount(walletAddress: string): Promise<boolean> {
  try {
    const connection = getConnection()
    const walletPubkey = new PublicKey(walletAddress)
    const ata = await getAssociatedTokenAddress(
      V1N3_MINT_PUBKEY, 
      walletPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    )
    
    try {
      await getAccount(connection, ata, 'confirmed', TOKEN_2022_PROGRAM_ID)
      return true
    } catch {
      return false
    }
  } catch {
    return false
  }
}

// Create ATA instruction (for building transactions) - Token-2022
export function createV1N3ATAInstruction(
  payer: PublicKey,
  walletAddress: PublicKey,
  ataAddress: PublicKey
) {
  return createAssociatedTokenAccountInstruction(
    payer,
    ataAddress,
    walletAddress,
    V1N3_MINT_PUBKEY,
    TOKEN_2022_PROGRAM_ID, // V1N3 uses Token-2022
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
}

// Ensure ATA exists for a wallet (creates if needed) - requires payer keypair (Token-2022)
export async function ensureV1N3TokenAccount(
  walletAddress: string,
  payerKeypair: Keypair
): Promise<{ address: string; created: boolean }> {
  const connection = getConnection()
  const walletPubkey = new PublicKey(walletAddress)
  
  try {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payerKeypair,
      V1N3_MINT_PUBKEY,
      walletPubkey,
      false, // allowOwnerOffCurve
      'confirmed',
      undefined, // confirmOptions
      TOKEN_2022_PROGRAM_ID // V1N3 uses Token-2022
    )
    
    // Check if it was just created by comparing creation time
    const accountInfo = await connection.getAccountInfo(tokenAccount.address)
    const created = accountInfo !== null
    
    return {
      address: tokenAccount.address.toBase58(),
      created: true, // We can't easily detect if it was just created, but it exists now
    }
  } catch (error) {
    console.error('Error ensuring V1N3 token account:', error)
    throw error
  }
}

// Get recent V1N3 transactions for a wallet from the blockchain
export async function getV1N3Transactions(
  walletAddress: string,
  limit: number = 20
): Promise<Array<{
  signature: string
  type: 'send' | 'receive'
  amount: number
  counterparty: string
  timestamp: number
  status: 'confirmed' | 'failed'
}>> {
  try {
    const connection = getConnection()
    const walletPubkey = new PublicKey(walletAddress)
    
    // Get the ATA for this wallet (Token-2022 — must pass the program id or
    // this resolves to the wrong account and returns no history).
    const ata = await getAssociatedTokenAddress(
      V1N3_MINT_PUBKEY,
      walletPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    )
    
    // Get recent signatures for the token account
    const signatures = await connection.getSignaturesForAddress(ata, { limit })
    
    const transactions: Array<{
      signature: string
      type: 'send' | 'receive'
      amount: number
      counterparty: string
      timestamp: number
      status: 'confirmed' | 'failed'
    }> = []
    
    for (const sig of signatures) {
      try {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        })
        
        if (!tx || !tx.meta) continue
        
        // Parse token transfers from the transaction
        const preBalances = tx.meta.preTokenBalances || []
        const postBalances = tx.meta.postTokenBalances || []
        
        // Find V1N3 balance changes
        for (const post of postBalances) {
          if (post.mint !== V1N3_TOKEN.mintAddress) continue
          
          const pre = preBalances.find(
            p => p.accountIndex === post.accountIndex && p.mint === post.mint
          )
          
          const preAmount = pre ? Number(pre.uiTokenAmount.uiAmount || 0) : 0
          const postAmount = Number(post.uiTokenAmount.uiAmount || 0)
          const diff = postAmount - preAmount
          
          if (diff === 0) continue
          
          const isReceive = diff > 0
          const owner = post.owner
          
          // Only include transactions involving our wallet
          if (owner === walletAddress) {
            transactions.push({
              signature: sig.signature,
              type: isReceive ? 'receive' : 'send',
              amount: Math.abs(diff),
              counterparty: isReceive ? 'Unknown' : 'Unknown', // Would need more parsing
              timestamp: (sig.blockTime || 0) * 1000,
              status: sig.err ? 'failed' : 'confirmed',
            })
          }
        }
      } catch (e) {
        console.error('Error parsing transaction:', sig.signature, e)
      }
    }
    
    return transactions
  } catch (error) {
    console.error('Error fetching V1N3 transactions:', error)
    return []
  }
}

// Transfer V1N3 tokens
// Transfer V1N3 tokens (using Token-2022)
export async function transferV1N3(
  fromKeypair: Keypair,
  toAddress: string,
  amount: number
): Promise<{ signature: string; success: boolean; error?: string }> {
  try {
    const connection = getConnection()
    const toPubkey = new PublicKey(toAddress)
    const fromPubkey = fromKeypair.publicKey
    
    // Get source and destination ATAs (Token-2022)
    const fromAta = await getAssociatedTokenAddress(V1N3_MINT_PUBKEY, fromPubkey, false, TOKEN_2022_PROGRAM_ID)
    const toAta = await getAssociatedTokenAddress(V1N3_MINT_PUBKEY, toPubkey, false, TOKEN_2022_PROGRAM_ID)
    
    // Build transaction
    const transaction = new Transaction()
    
    // Check if destination ATA exists, create if not
    try {
      await getAccount(connection, toAta, 'confirmed', TOKEN_2022_PROGRAM_ID)
    } catch {
      // ATA doesn't exist, add instruction to create it
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey, // payer
          toAta, // ata
          toPubkey, // owner
          V1N3_MINT_PUBKEY,
          TOKEN_2022_PROGRAM_ID, // V1N3 uses Token-2022
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      )
    }
    
    // Add transfer instruction
    const amountInLamports = BigInt(Math.floor(amount * Math.pow(10, V1N3_TOKEN.decimals)))
    transaction.add(
      createTransferInstruction(
        fromAta,
        toAta,
        fromPubkey,
        amountInLamports,
        [],
        TOKEN_2022_PROGRAM_ID // V1N3 uses Token-2022
      )
    )
    
    // Send and confirm
    const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair])
    
    return { signature, success: true }
  } catch (error) {
    console.error('Error transferring V1N3:', error)
    return {
      signature: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
