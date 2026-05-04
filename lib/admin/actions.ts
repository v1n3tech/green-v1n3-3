"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type UserRole = "user" | "agro_executive" | "gcm" | "lgpa" | "scc_member" | "admin"

export type UserProfile = {
  id: string
  email: string | null
  display_name: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  agro_id: string | null
  role: UserRole
  community: string | null
  secondary_communities: string[] | null
  lga: string | null
  state: string | null
  is_active: boolean
  verification_status: "pending" | "verified" | "rejected"
  onboarding_completed: boolean
  created_at: string
  last_active_at: string | null
  v1n3_balance: number
  total_earnings: number
  weekly_rating: number
  operational_rating: number
}

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  return profile?.role === "admin"
}

export async function fetchAllUsers(options?: {
  search?: string
  role?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<{ users: UserProfile[]; total: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { users: [], total: 0, error: "Not authenticated" }
  
  // Verify admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (adminProfile?.role !== "admin") {
    return { users: [], total: 0, error: "Unauthorized" }
  }
  
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
  
  // Apply filters
  if (options?.search) {
    query = query.or(`display_name.ilike.%${options.search}%,email.ilike.%${options.search}%,first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,agro_id.ilike.%${options.search}%`)
  }
  
  if (options?.role && options.role !== "all") {
    query = query.eq("role", options.role)
  }
  
  if (options?.status && options.status !== "all") {
    if (options.status === "active") {
      query = query.eq("is_active", true)
    } else if (options.status === "inactive") {
      query = query.eq("is_active", false)
    } else if (options.status === "pending") {
      query = query.eq("verification_status", "pending")
    }
  }
  
  // Order by created_at descending
  query = query.order("created_at", { ascending: false })
  
  // Pagination
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1)
  }
  
  const { data, error, count } = await query
  
  if (error) {
    console.error("[v0] fetchAllUsers error:", error)
    return { users: [], total: 0, error: error.message }
  }
  
  return { users: data ?? [], total: count ?? 0 }
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }
  
  // Verify admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (adminProfile?.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }
  
  // Prevent changing own role
  if (userId === user.id) {
    return { success: false, error: "Cannot change your own role" }
  }
  
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)
  
  if (error) {
    console.error("[v0] updateUserRole error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/admin")
  return { success: true }
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }
  
  // Verify admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (adminProfile?.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }
  
  // Prevent deactivating self
  if (userId === user.id && !isActive) {
    return { success: false, error: "Cannot deactivate your own account" }
  }
  
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId)
  
  if (error) {
    console.error("[v0] updateUserStatus error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/admin")
  return { success: true }
}

export async function updateVerificationStatus(
  userId: string,
  status: "pending" | "verified" | "rejected"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }
  
  // Verify admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (adminProfile?.role !== "admin") {
    return { success: false, error: "Unauthorized" }
  }
  
  const { error } = await supabase
    .from("profiles")
    .update({ verification_status: status })
    .eq("id", userId)
  
  if (error) {
    console.error("[v0] updateVerificationStatus error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/admin")
  return { success: true }
}

export async function getAdminStats(): Promise<{
  totalUsers: number
  pendingVerifications: number
  activeExecutives: number
  totalGCMs: number
  totalLGPAs: number
  totalSCCMembers: number
  recentSignups: number
}> {
  const supabase = await createClient()
  
  const [
    { count: totalUsers },
    { count: pendingVerifications },
    { count: activeExecutives },
    { count: totalGCMs },
    { count: totalLGPAs },
    { count: totalSCCMembers },
    { count: recentSignups },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "agro_executive").eq("is_active", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "gcm"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "lgpa"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "scc_member"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])
  
  return {
    totalUsers: totalUsers ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    activeExecutives: activeExecutives ?? 0,
    totalGCMs: totalGCMs ?? 0,
    totalLGPAs: totalLGPAs ?? 0,
    totalSCCMembers: totalSCCMembers ?? 0,
    recentSignups: recentSignups ?? 0,
  }
}

export async function getUserById(userId: string): Promise<{ user: UserProfile | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { user: null, error: "Not authenticated" }
  
  // Verify admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (adminProfile?.role !== "admin") {
    return { user: null, error: "Unauthorized" }
  }
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  
  if (error) {
    return { user: null, error: error.message }
  }
  
  return { user: data }
}
