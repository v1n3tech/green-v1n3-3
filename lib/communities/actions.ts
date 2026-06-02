"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { COMMUNITIES, type AgroCommunityKey } from "@/components/onboarding/data"

const VALID_KEYS = new Set<string>(COMMUNITIES.map((c) => c.key))

/**
 * Sets the authenticated user's PRIMARY community ("join community").
 *
 * Writes `profiles.community` for the calling user. This relies on the
 * `profiles_update_own` RLS policy (auth.uid() = id), so a user can only
 * change their own membership. `community` is the `agro_community` enum —
 * we validate the key against the canonical COMMUNITIES list before writing
 * so an invalid value can never reach the enum cast.
 */
export async function joinCommunity(community: AgroCommunityKey) {
  if (!VALID_KEYS.has(community)) {
    return { error: "Invalid community" }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ community })
    .eq("id", user.id)

  if (error) {
    console.log("[v0] joinCommunity failed:", error.message)
    return { error: error.message }
  }

  revalidatePath("/dashboard/communities")
  revalidatePath("/", "layout")
  return { success: true }
}
