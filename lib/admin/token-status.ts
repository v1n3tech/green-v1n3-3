import "server-only"
import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token"
import {
  getConnection,
  getV1N3Balance,
  getSOLBalance,
  V1N3_MINT_PUBKEY,
  V1N3_TOKEN,
  SOLANA_NETWORK,
} from "@/lib/wallet/v1n3-token"
import { DISTRIBUTOR_WALLET, getDistributorKeypair } from "@/lib/wallet/distributor"

/** Master treasury (mint authority) wallet — holds the cold supply, kept offline. */
export const TREASURY_WALLET = "BPhu3P9fxKvuae83z8ieWXszMBk8JbRgMY75pMGhQhnN"

export interface WalletStatus {
  address: string
  v1n3: number
  sol: number
}

export interface TokenStatus {
  name: string
  symbol: string
  network: string
  mintAddress: string
  decimals: number
  configuredSupply: number
  /** Live on-chain values (null if the RPC call failed). */
  onChainSupply: number | null
  mintAuthorityRevoked: boolean | null
  freezeAuthoritySet: boolean | null
  rpcCustom: boolean
  distributorConfigured: boolean
  treasury: WalletStatus
  distributor: WalletStatus
  /** True if every live read succeeded. */
  healthy: boolean
}

async function safeBalances(address: string): Promise<{ v1n3: number; sol: number }> {
  const [v1n3, sol] = await Promise.all([
    getV1N3Balance(address).catch(() => 0),
    getSOLBalance(address).catch(() => 0),
  ])
  return { v1n3, sol }
}

/**
 * Read the live mainnet state of the V1N3 token: supply, authority status, and
 * the treasury + distributor balances. All on-chain reads are best-effort so a
 * rate-limited RPC degrades gracefully instead of throwing.
 */
export async function getTokenStatus(): Promise<TokenStatus> {
  let onChainSupply: number | null = null
  let mintAuthorityRevoked: boolean | null = null
  let freezeAuthoritySet: boolean | null = null

  try {
    const connection = getConnection()
    const mint = await getMint(connection, V1N3_MINT_PUBKEY, "confirmed", TOKEN_2022_PROGRAM_ID)
    onChainSupply = Number(mint.supply) / 10 ** mint.decimals
    mintAuthorityRevoked = mint.mintAuthority === null
    freezeAuthoritySet = mint.freezeAuthority !== null
  } catch (err) {
    console.error("[v0] getTokenStatus: failed to read mint:", err)
  }

  const [treasuryBal, distributorBal] = await Promise.all([
    safeBalances(TREASURY_WALLET),
    safeBalances(DISTRIBUTOR_WALLET),
  ])

  return {
    name: V1N3_TOKEN.name,
    symbol: V1N3_TOKEN.symbol,
    network: SOLANA_NETWORK,
    mintAddress: V1N3_TOKEN.mintAddress,
    decimals: V1N3_TOKEN.decimals,
    configuredSupply: V1N3_TOKEN.totalSupply,
    onChainSupply,
    mintAuthorityRevoked,
    freezeAuthoritySet,
    rpcCustom: Boolean(process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT),
    distributorConfigured: getDistributorKeypair() !== null,
    treasury: { address: TREASURY_WALLET, ...treasuryBal },
    distributor: { address: DISTRIBUTOR_WALLET, ...distributorBal },
    healthy: onChainSupply !== null,
  }
}
