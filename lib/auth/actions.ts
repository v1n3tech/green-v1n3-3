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
  let walletAddress: string | null = null
  let walletWarning: string | null = null
  let displayName: string | null = null

  if (data.user) {
    try {
      const result = await ensureCustodialWallet(data.user.id)
      walletAddress = result.publicKey
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
  return {
    success: true,
    user: data.user,
    walletAddress,
    walletWarning,
    displayName,
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
