"use server"

import { createClient } from "@/lib/supabase/server"
import { ensureCustodialWallet } from "@/lib/wallet/mint"
import { ensureDisplayName } from "@/lib/auth/display-name"
import { revalidatePath } from "next/cache"

export async function signInWithOtp(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function verifyOtp(email: string, token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  })

  if (error) {
    return { error: error.message }
  }

  // Provision custodial wallet + display name. Both are idempotent: existing
  // values are preserved, missing values are filled in. Wallet mint failure
  // is non-fatal (we still authenticate); name generation failure is silent.
  //
  // We use `alreadyExisted` from the wallet mint as the canonical signal for
  // sign-up vs sign-in: if a wallet was JUST minted, this is a brand-new
  // account; otherwise the user has signed in before.
  let walletAddress: string | null = null
  let walletWarning: string | null = null
  let displayName: string | null = null
  let isNewUser = false

  if (data.user) {
    try {
      const result = await ensureCustodialWallet(data.user.id)
      walletAddress = result.publicKey
      isNewUser = !result.alreadyExisted
    } catch (err) {
      walletWarning =
        err instanceof Error ? err.message : "Failed to provision wallet"
      console.log("[v0] verifyOtp wallet mint failed:", walletWarning)
    }

    try {
      displayName = await ensureDisplayName(data.user.id)
    } catch (err) {
      console.log(
        "[v0] verifyOtp display name generation failed:",
        err instanceof Error ? err.message : err,
      )
    }
  }

  revalidatePath("/", "layout")

  // Return tokens so the BROWSER client can call setSession() and reliably
  // persist auth cookies via @supabase/ssr's browser cookie storage. This
  // sidesteps the well-known issue where server-action Set-Cookie responses
  // don't always reach document.cookie before the next client read.
  return {
    success: true,
    user: data.user,
    walletAddress,
    walletWarning,
    displayName,
    isNewUser,
    accessToken: data.session?.access_token ?? null,
    refreshToken: data.session?.refresh_token ?? null,
  }
}

export async function signInWithWallet(walletAddress: string) {
  const supabase = await createClient()

  // Check if user with this wallet exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("wallet_address", walletAddress)
    .single()

  if (existingProfile?.email) {
    // User exists with email, sign them in
    const { error } = await supabase.auth.signInWithOtp({
      email: existingProfile.email,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true, needsEmail: false }
  }

  // New wallet, needs email for social wallet minting
  return { success: true, needsEmail: true, walletAddress }
}

export async function linkWalletToEmail(email: string, walletAddress: string) {
  const supabase = await createClient()

  // Sign up with email and wallet address in metadata
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      data: {
        wallet_address: walletAddress,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateProfileWallet(userId: string, walletAddress: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({ wallet_address: walletAddress })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Atomically finalizes the onboarding wizard via the SECURITY DEFINER
 * `complete_onboarding` RPC (see migration 004_onboarding_flow.sql).
 *
 * The RPC validates required fields, mints an agro_id if the row doesn't
 * already have one, and flips onboarding_completed = true in a single
 * round-trip. RLS is bypassed inside the function but it's locked to the
 * calling auth.uid(), so a user can only complete their own onboarding.
 */
export async function completeOnboarding(input: {
  firstName: string
  lastName: string
  phone: string
  lga: string
  role: "user" | "agro_executive"
  community?: string | null
  secondaryCommunities?: string[]
  bio?: string | null
  avatarUrl?: string | null
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase.rpc("complete_onboarding", {
    p_first_name: input.firstName.trim(),
    p_last_name: input.lastName.trim(),
    p_phone: input.phone.trim(),
    p_lga: input.lga,
    p_role: input.role,
    p_community: input.community ?? null,
    p_secondary_communities: input.secondaryCommunities ?? [],
    p_bio: input.bio?.trim() || null,
    p_avatar_url: input.avatarUrl ?? null,
  })

  if (error) {
    console.log("[v0] completeOnboarding rpc failed:", error.message)
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true, profile: data }
}

/**
 * Updates the authed user's display_name (callsign) via the SECURITY DEFINER
 * `update_display_name` RPC. The RPC enforces format + case-insensitive
 * uniqueness, and atomically promotes the first user to claim the handle
 * 'mantim' (case-insensitive) to the admin role.
 *
 * Returns the updated profile row on success, or `{ error }` on failure.
 */
export async function updateDisplayName(newName: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data, error } = await supabase.rpc("update_display_name", {
    p_new_name: newName,
  })

  if (error) {
    console.log("[v0] updateDisplayName failed:", error.message)
    // Map raw Postgres uniqueness violation to a friendlier message in case
    // the unique index trips before our pre-check (race condition).
    if (error.message.includes("profiles_display_name_lower_key")) {
      return { error: "username is already taken" }
    }
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true, profile: data }
}

export async function getProfile(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) {
    return null
  }

  return data
}
