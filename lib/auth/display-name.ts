import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { generateCallsign } from "@/lib/auth/callsign"

/**
 * Idempotently sets a generated callsign on profiles.display_name if it's null.
 * Safe to call on every sign-in. Returns the final display_name.
 *
 * Implementation notes:
 *  - Uses the service-role admin client so it bypasses RLS without needing
 *    the user's session.
 *  - Only writes if the row currently has display_name IS NULL — never
 *    overwrites a name the user (or wallet flow) has already set.
 *  - Retries up to 3 times on the (extremely unlikely) collision with the
 *    UNIQUE constraint on... wait, display_name has no UNIQUE constraint.
 *    We still retry on any error to be defensive, since the cost is trivial.
 */
export async function ensureDisplayName(userId: string): Promise<string | null> {
  const admin = createAdminClient()

  // 1. Read current state — fast path: already named, return it.
  const { data: existing, error: readError } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single()

  if (readError) {
    console.log("[v0] ensureDisplayName read failed:", readError.message)
    return null
  }

  if (existing?.display_name) {
    return existing.display_name
  }

  // 2. Generate + write. Retry a couple of times on transient failures.
  for (let attempt = 0; attempt < 3; attempt++) {
    const callsign = generateCallsign()
    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({ display_name: callsign })
      .eq("id", userId)
      .is("display_name", null) // only set if still null — race-safe
      .select("display_name")
      .maybeSingle()

    if (!updateError && updated?.display_name) {
      return updated.display_name
    }

    // If the row was updated by a concurrent call, re-read and return.
    const { data: reread } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single()
    if (reread?.display_name) return reread.display_name

    console.log(
      "[v0] ensureDisplayName attempt failed:",
      updateError?.message ?? "no row updated",
    )
  }

  return null
}
