import "server-only"
import { Keypair, Connection, clusterApiUrl } from "@solana/web3.js"
import bs58 from "bs58"
import * as bip39 from "bip39"
import { derivePath } from "ed25519-hd-key"
import { createAdminClient } from "@/lib/supabase/admin"
import { encrypt, decrypt } from "@/lib/wallet/encryption"
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token"
import { V1N3_MINT_PUBKEY, SOLANA_NETWORK } from "@/lib/wallet/v1n3-token"

export interface MintResult {
  publicKey: string
  alreadyExisted: boolean
  ataAddress?: string
  ataCreated?: boolean
}

// Standard Solana BIP44 derivation path (matches Phantom / Solflare default account).
const SOLANA_DERIVATION_PATH = "m/44'/501'/0'/0'"

interface MnemonicWallet {
  keypair: Keypair
  mnemonic: string
  publicKey: string
  secretKeyBase58: string
}

/**
 * Generate a brand-new custodial wallet backed by a recoverable BIP39 seed
 * phrase. The keypair is derived from the mnemonic via the standard Solana
 * path so the user can later restore it in Phantom / Solflare. We keep BOTH
 * the mnemonic and the raw secret key so signing stays fast and a backup is
 * always available.
 */
function createMnemonicWallet(): MnemonicWallet {
  const mnemonic = bip39.generateMnemonic() // 128 bits -> 12 words
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const { key } = derivePath(SOLANA_DERIVATION_PATH, seed.toString("hex"))
  const keypair = Keypair.fromSeed(key)
  return {
    keypair,
    mnemonic,
    publicKey: keypair.publicKey.toBase58(),
    secretKeyBase58: bs58.encode(keypair.secretKey),
  }
}

/**
 * Idempotently provision a custodial Solana wallet for a user.
 *
 *  1. If `profiles.wallet_address` is already set -> return it (no-op).
 *  2. If `user_wallets` row already exists for this user -> reattach to profile and return.
 *  3. Otherwise: generate a fresh Keypair, encrypt the secretKey with AES-256-GCM,
 *     write to `user_wallets`, then write the public key to `profiles.wallet_address`.
 *
 * Safe to call multiple times. Designed to run inside the OTP verify server action.
 */
export async function ensureCustodialWallet(
  userId: string,
): Promise<MintResult> {
  const admin = createAdminClient()

  // 1. Check the profile first (cheapest read, RLS-bypassing).
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, wallet_address")
    .eq("id", userId)
    .single()

  if (profileErr || !profile) {
    throw new Error(
      `[v0] mint: profile not found for user ${userId} (${profileErr?.message ?? "no row"})`,
    )
  }

  if (profile.wallet_address) {
    return { publicKey: profile.wallet_address, alreadyExisted: true }
  }

  // 2. Check the wallet vault — handles the rare case where a previous mint
  // wrote the keypair but failed to update the profile.
  const { data: existingWallet } = await admin
    .from("user_wallets")
    .select("public_key")
    .eq("user_id", userId)
    .maybeSingle()

  if (existingWallet?.public_key) {
    const { error: linkErr } = await admin
      .from("profiles")
      .update({ wallet_address: existingWallet.public_key })
      .eq("id", userId)

    if (linkErr) {
      throw new Error(`[v0] mint: failed to relink existing wallet: ${linkErr.message}`)
    }

    return { publicKey: existingWallet.public_key, alreadyExisted: true }
  }

  // 3. Fresh mint — derived from a recoverable BIP39 seed phrase.
  const { keypair, mnemonic, publicKey, secretKeyBase58 } = createMnemonicWallet()

  const encrypted = encrypt(secretKeyBase58)
  const encryptedMnemonic = encrypt(mnemonic)

  const { error: insertErr } = await admin.from("user_wallets").insert({
    user_id: userId,
    public_key: publicKey,
    encrypted_secret_key: encrypted.ciphertext,
    iv: encrypted.iv,
    auth_tag: encrypted.authTag,
    encrypted_mnemonic: encryptedMnemonic.ciphertext,
    mnemonic_iv: encryptedMnemonic.iv,
    mnemonic_auth_tag: encryptedMnemonic.authTag,
    origin: "minted",
  })

  if (insertErr) {
    throw new Error(`[v0] mint: failed to write user_wallets: ${insertErr.message}`)
  }

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ wallet_address: publicKey })
    .eq("id", userId)

  if (updateErr) {
    throw new Error(
      `[v0] mint: wrote keypair but failed to update profile: ${updateErr.message}`,
    )
  }

  // Try to create V1N3 ATA for the new wallet (requires SOL for fees)
  // This is a best-effort operation - if it fails, the user can create it later
  let ataAddress: string | undefined
  let ataCreated = false
  
  try {
    const connection = new Connection(clusterApiUrl(SOLANA_NETWORK), 'confirmed')
    const walletBalance = await connection.getBalance(keypair.publicKey)
    
    // Only attempt ATA creation if wallet has some SOL (at least 0.002 SOL for rent + fees)
    if (walletBalance >= 2_000_000) {
      const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair, // payer
        V1N3_MINT_PUBKEY,
        keypair.publicKey // owner
      )
      ataAddress = ata.address.toBase58()
      ataCreated = true
      console.log(`[v0] mint: Created V1N3 ATA ${ataAddress} for wallet ${publicKey}`)
    }
  } catch (ataErr) {
    // ATA creation failed - this is expected if wallet has no SOL yet
    console.log(`[v0] mint: ATA creation skipped (will be created when wallet has SOL): ${ataErr}`)
  }

  return { publicKey, alreadyExisted: false, ataAddress, ataCreated }
}

/**
 * Derive a Solana Keypair from a BIP39 seed phrase (mnemonic).
 * Uses the standard m/44'/501'/0'/0' derivation path so the resulting
 * public key matches what Phantom/Solflare show for the first account.
 */
function keypairFromMnemonic(mnemonic: string): Keypair {
  const normalized = mnemonic.trim().toLowerCase().replace(/\s+/g, " ")
  if (!bip39.validateMnemonic(normalized)) {
    throw new Error("Invalid seed phrase: please check the words and try again")
  }
  const seed = bip39.mnemonicToSeedSync(normalized) // 64-byte seed
  const { key } = derivePath(SOLANA_DERIVATION_PATH, seed.toString("hex"))
  return Keypair.fromSeed(key)
}

/**
 * Parse a user-supplied secret into a Keypair.
 * Accepts any of:
 *  - a BIP39 seed phrase / mnemonic (12, 15, 18, 21, or 24 words), or
 *  - a base58-encoded 64-byte secret key string (Phantom "export private key" format), or
 *  - a JSON byte array like "[12,34,...]" (solana-keygen / id.json format).
 * Throws a user-friendly error if the input is not a valid Solana secret.
 */
function parseSecretKey(input: string): Keypair {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error("Secret key or seed phrase is required")
  }

  // Seed phrase: multiple space-separated words (not a byte array or single base58 blob).
  const words = trimmed.split(/\s+/)
  if (!trimmed.startsWith("[") && words.length >= 12 && words.every((w) => /^[a-zA-Z]+$/.test(w))) {
    return keypairFromMnemonic(trimmed)
  }

  let secretKeyBytes: Uint8Array

  if (trimmed.startsWith("[")) {
    // JSON byte array format
    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      throw new Error("Invalid secret key: malformed byte array")
    }
    if (!Array.isArray(parsed) || parsed.some((n) => typeof n !== "number")) {
      throw new Error("Invalid secret key: expected an array of numbers")
    }
    secretKeyBytes = Uint8Array.from(parsed as number[])
  } else {
    // base58 string format
    try {
      secretKeyBytes = bs58.decode(trimmed)
    } catch {
      throw new Error("Invalid secret key: not valid base58")
    }
  }

  if (secretKeyBytes.length !== 64) {
    throw new Error("Invalid secret key: expected 64 bytes")
  }

  try {
    return Keypair.fromSecretKey(secretKeyBytes)
  } catch {
    throw new Error("Invalid secret key: could not derive keypair")
  }
}

export interface ImportResult {
  publicKey: string
  replacedPreviousWallet: boolean
}

/**
 * Import an existing Solana wallet for a user from a supplied secret key.
 *
 * The secret key is encrypted with AES-256-GCM and stored in `user_wallets`
 * exactly like a minted custodial wallet, so the platform can sign on the
 * user's behalf. Because `user_wallets.user_id` is the primary key, importing
 * REPLACES the user's current custodial wallet (upsert on user_id), and the
 * profile's `wallet_address` is repointed to the imported public key.
 *
 * Server-only. The raw secret key is NEVER returned to the client.
 */
export async function importWallet(
  userId: string,
  secretKeyInput: string,
): Promise<ImportResult> {
  const admin = createAdminClient()

  // Validate + derive keypair before touching the DB.
  const keypair = parseSecretKey(secretKeyInput)
  const publicKey = keypair.publicKey.toBase58()
  const secretKeyBase58 = bs58.encode(keypair.secretKey)

  // Guard: a public_key may only belong to one account (UNIQUE constraint).
  const { data: ownerOfKey } = await admin
    .from("user_wallets")
    .select("user_id")
    .eq("public_key", publicKey)
    .maybeSingle()

  if (ownerOfKey && ownerOfKey.user_id !== userId) {
    throw new Error("This wallet is already linked to another account")
  }

  // Detect whether the user already has a wallet (so we can report a replace).
  const { data: existing } = await admin
    .from("user_wallets")
    .select("public_key")
    .eq("user_id", userId)
    .maybeSingle()

  const replacedPreviousWallet = !!existing?.public_key && existing.public_key !== publicKey

  const encrypted = encrypt(secretKeyBase58)

  // Upsert on the user_id primary key.
  const { error: upsertErr } = await admin
    .from("user_wallets")
    .upsert(
      {
        user_id: userId,
        public_key: publicKey,
        encrypted_secret_key: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        origin: "imported",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

  if (upsertErr) {
    throw new Error(`[v0] import: failed to write user_wallets: ${upsertErr.message}`)
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .update({ wallet_address: publicKey })
    .eq("id", userId)

  if (profileErr) {
    throw new Error(`[v0] import: wrote keypair but failed to update profile: ${profileErr.message}`)
  }

  return { publicKey, replacedPreviousWallet }
}

/**
 * Decrypt a custodial wallet's secretKey for server-side signing.
 * NEVER expose the result to the client.
 */
export async function getCustodialKeypair(userId: string): Promise<Keypair | null> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("user_wallets")
    .select("encrypted_secret_key, iv, auth_tag")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return null

  const secretKeyBase58 = decrypt({
    ciphertext: data.encrypted_secret_key,
    iv: data.iv,
    authTag: data.auth_tag,
  })

  return Keypair.fromSecretKey(bs58.decode(secretKeyBase58))
}

export interface WalletSecrets {
  publicKey: string
  /** 12/24-word BIP39 phrase, or null for legacy/imported wallets that have none. */
  mnemonic: string | null
  /** base58-encoded 64-byte secret key (Phantom "export private key" format). */
  secretKey: string
  origin: string | null
}

/**
 * Decrypt a user's wallet secrets so they can back them up.
 *
 * SECURITY: this returns raw private material and MUST only be called from a
 * route that has just re-verified the user via OTP. The result is sent over
 * the response body once and never logged.
 */
export async function revealWalletSecrets(userId: string): Promise<WalletSecrets | null> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("user_wallets")
    .select(
      "public_key, encrypted_secret_key, iv, auth_tag, encrypted_mnemonic, mnemonic_iv, mnemonic_auth_tag, origin",
    )
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return null

  const secretKey = decrypt({
    ciphertext: data.encrypted_secret_key,
    iv: data.iv,
    authTag: data.auth_tag,
  })

  let mnemonic: string | null = null
  if (data.encrypted_mnemonic && data.mnemonic_iv && data.mnemonic_auth_tag) {
    mnemonic = decrypt({
      ciphertext: data.encrypted_mnemonic,
      iv: data.mnemonic_iv,
      authTag: data.mnemonic_auth_tag,
    })
  }

  // Audit the reveal (best-effort; never blocks returning secrets).
  await admin
    .from("user_wallets")
    .update({ last_revealed_at: new Date().toISOString(), exported_at: new Date().toISOString() })
    .eq("user_id", userId)

  return { publicKey: data.public_key, mnemonic, secretKey, origin: data.origin }
}

export interface RecoverResult {
  publicKey: string
  mnemonic: string
  previousAddress: string | null
}

/**
 * Self-heal a custodial wallet whose private keys were lost (e.g. the vault
 * row was deleted but `profiles.wallet_address` still points at a now-orphaned
 * address we can no longer sign for).
 *
 * Mints a fresh mnemonic-backed wallet, upserts it into `user_wallets`, and
 * repoints the profile. Funds at the previous address are unrecoverable —
 * callers MUST warn the user before invoking this. OTP-gated at the route.
 */
export async function remintCustodialWallet(userId: string): Promise<RecoverResult> {
  const admin = createAdminClient()

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, wallet_address")
    .eq("id", userId)
    .single()

  if (profileErr || !profile) {
    throw new Error(`[v0] recover: profile not found for user ${userId}`)
  }

  const previousAddress = profile.wallet_address ?? null

  const { keypair, mnemonic, publicKey, secretKeyBase58 } = createMnemonicWallet()
  void keypair // keypair intentionally unused here; signing happens lazily later

  const encrypted = encrypt(secretKeyBase58)
  const encryptedMnemonic = encrypt(mnemonic)

  const { error: upsertErr } = await admin.from("user_wallets").upsert(
    {
      user_id: userId,
      public_key: publicKey,
      encrypted_secret_key: encrypted.ciphertext,
      iv: encrypted.iv,
      auth_tag: encrypted.authTag,
      encrypted_mnemonic: encryptedMnemonic.ciphertext,
      mnemonic_iv: encryptedMnemonic.iv,
      mnemonic_auth_tag: encryptedMnemonic.authTag,
      origin: "minted",
      recovered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )

  if (upsertErr) {
    throw new Error(`[v0] recover: failed to write user_wallets: ${upsertErr.message}`)
  }

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ wallet_address: publicKey })
    .eq("id", userId)

  if (updateErr) {
    throw new Error(`[v0] recover: wrote keypair but failed to update profile: ${updateErr.message}`)
  }

  return { publicKey, mnemonic, previousAddress }
}

/**
 * Returns true when the profile points at a wallet address we have NO keys for
 * (orphaned custodial wallet). Used to surface a recovery prompt in the UI.
 */
export async function isWalletOrphaned(userId: string): Promise<boolean> {
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("wallet_address")
    .eq("id", userId)
    .single()

  if (!profile?.wallet_address) return false

  const { data: wallet } = await admin
    .from("user_wallets")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()

  return !wallet
}
