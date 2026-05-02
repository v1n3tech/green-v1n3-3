import "server-only"
import { Keypair } from "@solana/web3.js"
import bs58 from "bs58"
import { createAdminClient } from "@/lib/supabase/admin"
import { encrypt, decrypt } from "@/lib/wallet/encryption"

export interface MintResult {
  publicKey: string
  alreadyExisted: boolean
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

  // 3. Fresh mint.
  const keypair = Keypair.generate()
  const publicKey = keypair.publicKey.toBase58()
  const secretKeyBase58 = bs58.encode(keypair.secretKey)

  const encrypted = encrypt(secretKeyBase58)

  const { error: insertErr } = await admin.from("user_wallets").insert({
    user_id: userId,
    public_key: publicKey,
    encrypted_secret_key: encrypted.ciphertext,
    iv: encrypted.iv,
    auth_tag: encrypted.authTag,
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

  return { publicKey, alreadyExisted: false }
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
