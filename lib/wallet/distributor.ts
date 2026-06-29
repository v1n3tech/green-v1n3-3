import "server-only"
import { Keypair } from "@solana/web3.js"
import bs58 from "bs58"

/**
 * The mainnet V1N3 distributor (hot) wallet.
 *
 * This wallet holds a working float of V1N3 and signs reward/marketplace
 * payouts on the server. The 4,000,000,000 master treasury key
 * (BPhu3P9f...) is kept OFFLINE and is never loaded here.
 *
 * Public address (safe to expose):
 */
export const DISTRIBUTOR_WALLET = "HdDCP23hf6ibfPezAnqaRB2SfxyuP2EcC8fE1JveoidA"

let cached: Keypair | null = null

/**
 * Load the distributor signing keypair from the V1N3_DISTRIBUTOR_SECRET_KEY
 * env var. Supports both formats:
 *   - JSON byte array, e.g. `[12,34,56,...]` (output of `cat ~/v1n3-distributor.json`)
 *   - base58-encoded secret key string
 *
 * Returns null if the env var is missing or malformed (callers should treat
 * this as "payouts unavailable" and fail gracefully).
 */
export function getDistributorKeypair(): Keypair | null {
  if (cached) return cached

  const raw = process.env.V1N3_DISTRIBUTOR_SECRET_KEY?.trim()
  if (!raw) {
    console.error("[v0] V1N3_DISTRIBUTOR_SECRET_KEY is not set")
    return null
  }

  try {
    let secret: Uint8Array

    if (raw.startsWith("[")) {
      // JSON byte array from solana-keygen
      const arr = JSON.parse(raw) as number[]
      secret = Uint8Array.from(arr)
    } else {
      // base58 secret key
      secret = bs58.decode(raw)
    }

    if (secret.length !== 64) {
      console.error(`[v0] distributor secret key has unexpected length: ${secret.length} (expected 64)`)
      return null
    }

    const keypair = Keypair.fromSecretKey(secret)

    // Safety check: the loaded key must match the expected distributor address.
    if (keypair.publicKey.toBase58() !== DISTRIBUTOR_WALLET) {
      console.error(
        `[v0] distributor key mismatch: loaded ${keypair.publicKey.toBase58()}, expected ${DISTRIBUTOR_WALLET}`,
      )
      return null
    }

    cached = keypair
    return keypair
  } catch (err) {
    console.error("[v0] failed to parse V1N3_DISTRIBUTOR_SECRET_KEY:", err)
    return null
  }
}
