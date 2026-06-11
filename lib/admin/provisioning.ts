"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ensureCustodialWallet, revealWalletSecrets } from "@/lib/wallet/mint"
import { revalidatePath } from "next/cache"
import {
  AGRO_COMMUNITIES,
  PROVISIONABLE_ROLES,
  type AgroCommunity,
  type ProvisionInput,
  type ProvisionRole,
  type CredentialPackage,
  type ProvisionedAccount,
} from "@/lib/admin/provisioning-types"

async function assertAdmin(): Promise<{ adminId: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") return { error: "Only administrators can provision accounts" }
  return { adminId: user.id }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Create a brand-new account end-to-end (admin only):
 *  1. Create the auth user (email confirmed; they sign in via the OTP flow).
 *  2. The handle_new_user trigger seeds the profile row.
 *  3. Allocate role + communities + agro_id, mark as admin-provisioned.
 *  4. Mint a custodial Solana wallet (recoverable BIP39 seed phrase).
 *  5. Return the one-time credential package (email, agro id, address, seed).
 */
export async function provisionAccount(
  input: ProvisionInput,
): Promise<{ credentials?: CredentialPackage; error?: string }> {
  const auth = await assertAdmin()
  if ("error" in auth) return { error: auth.error }

  const email = input.email.trim().toLowerCase()
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()

  if (!isValidEmail(email)) return { error: "Enter a valid email address" }
  if (!firstName) return { error: "First name is required" }
  if (!lastName) return { error: "Last name is required" }
  if (!PROVISIONABLE_ROLES.includes(input.role)) return { error: "Invalid role" }
  if (input.role === "agro_executive" && !input.community) {
    return { error: "Agro executives must be allocated a primary community" }
  }
  if (input.community && !AGRO_COMMUNITIES.includes(input.community)) {
    return { error: "Invalid community" }
  }
  const secondary = (input.secondaryCommunities ?? []).filter(
    (c) => AGRO_COMMUNITIES.includes(c) && c !== input.community,
  )

  const admin = createAdminClient()
  const displayName = `${firstName} ${lastName}`.trim()

  // 1. Create the auth user. Email is pre-confirmed so the OTP sign-in works.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
    },
  })

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "Failed to create account"
    if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
      return { error: "An account with this email already exists" }
    }
    return { error: msg }
  }

  const userId = created.user.id

  // 2 + 3. Allocate role/community + agro_id. The trigger already inserted the
  // profile row; we generate the agro_id via the existing DB function.
  const { data: agroIdRow } = await admin.rpc("generate_agro_id")
  const agroId = (agroIdRow as string | null) ?? null

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      email,
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      phone: input.phone?.trim() || null,
      lga: input.lga?.trim() || null,
      role: input.role,
      community: input.community ?? null,
      secondary_communities: secondary,
      agro_id: agroId,
      verification_status: "verified",
      is_active: true,
      onboarding_completed: true,
      provisioned_by: auth.adminId,
      provisioned_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (profileErr) {
    // Roll back the auth user so we don't leave an orphan with no profile data.
    await admin.auth.admin.deleteUser(userId).catch(() => {})
    return { error: `Failed to allocate role/community: ${profileErr.message}` }
  }

  // 4. Mint the custodial wallet (idempotent, derives a BIP39 seed phrase).
  try {
    await ensureCustodialWallet(userId)
  } catch (e) {
    console.error("[v0] provision: wallet mint failed:", e)
    return { error: "Account created but wallet minting failed. Open the account to retry." }
  }

  // 5. Reveal the seed phrase + address once for the downloadable package.
  const secrets = await revealWalletSecrets(userId)

  revalidatePath("/dashboard/organization")
  revalidatePath("/dashboard/terminals")

  return {
    credentials: {
      userId,
      email,
      displayName,
      agroId,
      role: input.role,
      community: input.community ?? null,
      secondaryCommunities: secondary,
      walletAddress: secrets?.publicKey ?? "",
      seedPhrase: secrets?.mnemonic ?? null,
      createdAt: new Date().toISOString(),
    },
  }
}

/** List accounts created via the admin console (most recent first). */
export async function fetchProvisionedAccounts(): Promise<{
  accounts: ProvisionedAccount[]
  error?: string
}> {
  const auth = await assertAdmin()
  if ("error" in auth) return { accounts: [], error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, email, display_name, agro_id, role, community, secondary_communities, lga, wallet_address, is_active, provisioned_at, created_at",
    )
    .not("provisioned_at", "is", null)
    .order("provisioned_at", { ascending: false })
    .limit(100)

  if (error) return { accounts: [], error: error.message }
  return { accounts: (data ?? []) as ProvisionedAccount[] }
}

/**
 * Re-reveal an account's credential package later (admin only).
 * The seed phrase is decrypted from the vault on demand.
 */
export async function revealAccountCredentials(
  userId: string,
): Promise<{ credentials?: CredentialPackage; error?: string }> {
  const auth = await assertAdmin()
  if ("error" in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from("profiles")
    .select(
      "id, email, display_name, agro_id, role, community, secondary_communities, wallet_address, created_at",
    )
    .eq("id", userId)
    .single()

  if (error || !profile) return { error: "Account not found" }

  const secrets = await revealWalletSecrets(userId)
  if (!secrets) return { error: "No wallet found for this account" }

  return {
    credentials: {
      userId: profile.id,
      email: profile.email ?? "",
      displayName: profile.display_name ?? "",
      agroId: profile.agro_id,
      role: profile.role as ProvisionRole,
      community: (profile.community as AgroCommunity) ?? null,
      secondaryCommunities: (profile.secondary_communities as AgroCommunity[]) ?? [],
      walletAddress: secrets.publicKey,
      seedPhrase: secrets.mnemonic,
      createdAt: profile.created_at,
    },
  }
}
