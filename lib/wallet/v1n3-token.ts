import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'

// V1N3 Token Configuration
export const V1N3_TOKEN = {
  name: 'V1n3',
  symbol: 'V1N3',
  decimals: 9,
  mintAddress: 'EAtP7GvoVreBt9jFH7NEQkW5bkzDWQ1uuhQ7nnSMx7g1',
  programId: 'BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX',
  network: 'devnet' as const,
  // Exchange rate: 1 V1N3 = 3002.40 NGN (mock rate for display)
  ngnRate: 3002.40,
} as const

// Network configuration
export const SOLANA_NETWORK = 'devnet' as const
export const SOLANA_RPC_ENDPOINT = clusterApiUrl(SOLANA_NETWORK)

// Public keys
export const V1N3_MINT_PUBKEY = new PublicKey(V1N3_TOKEN.mintAddress)
export const V1N3_PROGRAM_PUBKEY = new PublicKey(V1N3_TOKEN.programId)

// Create connection to Solana devnet
export function getConnection(): Connection {
  return new Connection(SOLANA_RPC_ENDPOINT, 'confirmed')
}

// Get V1N3 token balance for a wallet address
export async function getV1N3Balance(walletAddress: string): Promise<number> {
  try {
    const connection = getConnection()
    const walletPubkey = new PublicKey(walletAddress)
    
    // Get the associated token account for V1N3
    const tokenAccountAddress = await getAssociatedTokenAddress(
      V1N3_MINT_PUBKEY,
      walletPubkey
    )
    
    try {
      const tokenAccount = await getAccount(connection, tokenAccountAddress)
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
  const cluster = `?cluster=${SOLANA_NETWORK}`
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
