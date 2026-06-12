"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import {
  EDITABLE_FIELDS,
  type EditableField,
  type ChangeEntry,
  type ChangeRequest,
  type AdminChangeRequest,
} from "@/lib/profile/change-request-types"

/* ---------------------------------------------------------------------------
 * Profile change requests (server actions)
 * Users apply to the admin organization to edit their email and select profile
 * details. Admins review and approve (changes are applied to the profile, and
 * to the auth record for email) or reject from the Organization page.
 * ------------------------------------------------------------------------- */

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Submit a new profile change request (the authenticated user). */
export async function submitChangeRequest(input: {
  changes: Partial<Record<EditableField, string>>
  reason?: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, first_name, last_name, display_name, phone, bio, lga, state, address")
    .eq("id", user.id)
    .single()

  if (!profile) return { error: "Profile not found" }

  // Build the changes map, keeping only fields that actually differ.
  const changes: Record<string, ChangeEntry> = {}
  for (const field of EDITABLE_FIELDS) {
    const requested = input.changes[field]?.trim()
    if (requested === undefined || requested === "") continue
    const current = (profile as Record<string, string | null>)[field] ?? null
    if (requested === (current ?? "")) continue
    if (field === "email" && !isValidEmail(requested)) {
      return { error: "Enter a valid email address" }
    }
    changes[field] = { current, requested }
  }

  if (Object.keys(changes).length === 0) {
    return { error: "No changes detected. Update at least one field." }
  }

  // Block duplicate pending requests.
  const { count } = await supabase
    .from("profile_change_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending")

  if ((count ?? 0) > 0) {
    return { error: "You already have a pending request. Please wait for it to be reviewed." }
  }

  const { error } = await supabase.from("profile_change_requests").insert({
    user_id: user.id,
    changes,
    reason: input.reason?.trim() || null,
  })

  if (error) {
    console.error("[v0] submitChangeRequest error:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard/organization")
  return { success: true }
}

/** A user's own change requests (most recent first). */
export async function fetchMyChangeRequests(): Promise<{
  requests: ChangeRequest[]
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { requests: [], error: "Not authenticated" }

  const { data, error } = await supabase
    .from("profile_change_requests")
    .select("id, user_id, changes, reason, status, review_note, reviewed_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) return { requests: [], error: error.message }
  return { requests: (data ?? []) as ChangeRequest[] }
}

async function assertAdmin(): Promise<{ adminId: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return { error: "Only administrators can review requests" }
  return { adminId: user.id }
}

/** All change requests for the admin review queue (pending first). */
export async function fetchAllChangeRequests(): Promise<{
  requests: AdminChangeRequest[]
  error?: string
}> {
  const auth = await assertAdmin()
  if ("error" in auth) return { requests: [], error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("profile_change_requests")
    .select("id, user_id, changes, reason, status, review_note, reviewed_at, created_at")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) return { requests: [], error: error.message }

  const rows = (data ?? []) as ChangeRequest[]
  const userIds = [...new Set(rows.map((r) => r.user_id))]
  const applicants: Record<string, AdminChangeRequest["applicant"]> = {}

  if (userIds.length > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, display_name, email, agro_id, role")
      .in("id", userIds)
    for (const p of profs ?? []) {
      applicants[p.id] = {
        display_name: p.display_name,
        email: p.email,
        agro_id: p.agro_id,
        role: p.role,
      }
    }
  }

  return {
    requests: rows.map((r) => ({ ...r, applicant: applicants[r.user_id] ?? null })),
  }
}

/** Approve a request: apply the requested changes to the profile (and auth email). */
export async function approveChangeRequest(
  requestId: string,
  note?: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await assertAdmin()
  if ("error" in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data: request, error: fetchErr } = await admin
    .from("profile_change_requests")
    .select("id, user_id, changes, status")
    .eq("id", requestId)
    .single()

  if (fetchErr || !request) return { error: "Request not found" }
  if (request.status !== "pending") return { error: "This request has already been reviewed" }

  const changes = request.changes as Record<string, ChangeEntry>
  const updates: Record<string, string> = {}
  for (const [field, entry] of Object.entries(changes)) {
    if ((EDITABLE_FIELDS as readonly string[]).includes(field)) {
      updates[field] = entry.requested
    }
  }

  // Email changes must also be reflected in the auth record.
  if (updates.email) {
    const { error: authErr } = await admin.auth.admin.updateUserById(request.user_id, {
      email: updates.email,
      email_confirm: true,
    })
    if (authErr) {
      const msg = authErr.message.toLowerCase()
      if (msg.includes("already") || msg.includes("registered")) {
        return { error: "That email is already in use by another account" }
      }
      return { error: `Failed to update login email: ${authErr.message}` }
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error: profErr } = await admin
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", request.user_id)
    if (profErr) return { error: `Failed to apply changes: ${profErr.message}` }
  }

  const { error: statusErr } = await admin
    .from("profile_change_requests")
    .update({
      status: "approved",
      review_note: note?.trim() || null,
      reviewed_by: auth.adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)

  if (statusErr) return { error: statusErr.message }

  revalidatePath("/dashboard/organization")
  revalidatePath("/dashboard/settings")
  return { success: true }
}

/** Reject a request with an optional note. */
export async function rejectChangeRequest(
  requestId: string,
  note?: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await assertAdmin()
  if ("error" in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data: request } = await admin
    .from("profile_change_requests")
    .select("status")
    .eq("id", requestId)
    .single()

  if (!request) return { error: "Request not found" }
  if (request.status !== "pending") return { error: "This request has already been reviewed" }

  const { error } = await admin
    .from("profile_change_requests")
    .update({
      status: "rejected",
      review_note: note?.trim() || null,
      reviewed_by: auth.adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/organization")
  revalidatePath("/dashboard/settings")
  return { success: true }
}
