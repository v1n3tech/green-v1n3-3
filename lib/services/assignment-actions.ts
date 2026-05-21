"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications/actions"

export interface LocationDetails {
  state: string
  lga: string
  address: string
  details: string
  utilityBillUrl?: string
}

export interface ServiceAssignment {
  id: string
  request_id: string
  executive_id: string
  assigned_by: string
  role_description: string | null
  notes: string | null
  status: string
  executive_response: string | null
  created_at: string
  accepted_at: string | null
  completed_at: string | null
  executive?: {
    id: string
    display_name: string
    agro_id: string
    avatar_url: string | null
    lga: string | null
    phone: string | null
    community: string
  }
}

export interface AssignmentLetter {
  id: string
  assignment_id: string
  request_id: string
  letter_reference: string
  letter_content: {
    title: string
    date: string
    executiveName: string
    executiveAgroId: string
    gcmName: string
    gcmSignatureUrl: string
    serviceName: string
    serviceDescription: string
    requesterName: string
    locationDetails: LocationDetails
    roleDescription: string
    notes: string
    communityName: string
  }
  gcm_signature_url: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface ExecutiveNotification {
  id: string
  executive_id: string
  type: string
  assignment_id: string | null
  request_id: string | null
  letter_id: string | null
  title: string
  message: string
  is_read: boolean
  read_at: string | null
  created_at: string
  letter?: AssignmentLetter
}

// ============ LOCATION DETAILS ============

export async function submitLocationDetails(
  requestId: string,
  details: LocationDetails
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }
  
  // Verify user is the requester
  const { data: request } = await supabase
    .from("service_requests")
    .select("requester_id, status")
    .eq("id", requestId)
    .single()
  
  if (!request || request.requester_id !== user.id) {
    return { success: false, error: "Unauthorized" }
  }
  
  if (request.status !== "accepted" && request.status !== "payment_pending") {
    return { success: false, error: "Request must be accepted first" }
  }
  
  const { error } = await supabase
    .from("service_requests")
    .update({
      location_state: details.state,
      location_lga: details.lga,
      location_address: details.address,
      location_details: details.details,
      utility_bill_url: details.utilityBillUrl,
      details_submitted_at: new Date().toISOString(),
      status: "payment_pending", // Move to payment pending after details submitted
    })
    .eq("id", requestId)
  
  if (error) {
    console.error("[v0] submitLocationDetails error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard/requests")
  return { success: true }
}

// ============ PAYMENT (QUASI - FOR TESTING) ============

export async function togglePaymentStatus(
  requestId: string,
  paid: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }
  
  // Verify user is the GCM (only GCM can toggle for testing)
  const { data: request } = await supabase
    .from("service_requests")
    .select("gcm_id")
    .eq("id", requestId)
    .single()
  
  if (!request || request.gcm_id !== user.id) {
    return { success: false, error: "Unauthorized" }
  }
  
  const { error } = await supabase
    .from("service_requests")
    .update({
      payment_status: paid ? "paid" : "pending",
      status: paid ? "paid" : "payment_pending",
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", requestId)
  
  if (error) {
    console.error("[v0] togglePaymentStatus error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard/requests")
  return { success: true }
}

// ============ GCM SIGNATURE ============

export async function uploadGcmSignature(
  signatureUrl: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }
  
  // Verify user is a GCM
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (profile?.role !== "gcm") {
    return { success: false, error: "Only GCMs can upload signatures" }
  }
  
  const { error } = await supabase
    .from("profiles")
    .update({ signature_url: signatureUrl })
    .eq("id", user.id)
  
  if (error) {
    console.error("[v0] uploadGcmSignature error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard/requests")
  return { success: true }
}

export async function getGcmSignature(): Promise<{ signatureUrl: string | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { signatureUrl: null, error: "Not authenticated" }
  
  const { data, error } = await supabase
    .from("profiles")
    .select("signature_url")
    .eq("id", user.id)
    .single()
  
  if (error) {
    console.error("[v0] getGcmSignature error:", error)
    return { signatureUrl: null, error: error.message }
  }
  
  return { signatureUrl: data?.signature_url ?? null }
}

// ============ FETCH AVAILABLE EXECUTIVES ============

export async function fetchAvailableExecutives(options?: {
  lga?: string
  community?: string
  search?: string
  limit?: number
}): Promise<{ executives: Array<{
  id: string
  display_name: string
  agro_id: string
  avatar_url: string | null
  lga: string | null
  phone: string | null
  community: string
  verification_status: string
  is_active: boolean
}>; error?: string }> {
  const supabase = await createClient()
  
  let query = supabase
    .from("profiles")
    .select("id, display_name, agro_id, avatar_url, lga, phone, community, verification_status, is_active")
    .eq("verification_status", "verified")
    .eq("is_active", true)
    .in("role", ["agro_executive", "gcm", "lgpa"]) // Include all active roles
    .order("display_name", { ascending: true })
  
  if (options?.lga) {
    query = query.eq("lga", options.lga)
  }
  
  if (options?.search) {
    query = query.or(`display_name.ilike.%${options.search}%,agro_id.ilike.%${options.search}%`)
  }
  
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("[v0] fetchAvailableExecutives error:", error)
    return { executives: [], error: error.message }
  }
  
  return { executives: data ?? [] }
}

// ============ ASSIGNMENTS ============

export async function assignExecutives(
  requestId: string,
  executives: Array<{ executiveId: string; roleDescription?: string; notes?: string }>
): Promise<{ success: boolean; assignmentIds: string[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, assignmentIds: [], error: "Not authenticated" }
  
  // Get request details to verify GCM and get service info
  const { data: request } = await supabase
    .from("service_requests")
    .select(`
      *,
      service:community_services (
        id, title, description, community
      ),
      requester:profiles!requester_id (
        id, display_name, agro_id
      )
    `)
    .eq("id", requestId)
    .single()
  
  if (!request || request.gcm_id !== user.id) {
    return { success: false, assignmentIds: [], error: "Unauthorized" }
  }
  
  if (request.payment_status !== "paid") {
    return { success: false, assignmentIds: [], error: "Payment must be confirmed before assigning executives" }
  }
  
  // Get GCM profile with signature
  const { data: gcmProfile } = await supabase
    .from("profiles")
    .select("display_name, signature_url, community")
    .eq("id", user.id)
    .single()
  
  if (!gcmProfile?.signature_url) {
    return { success: false, assignmentIds: [], error: "Please upload your signature before assigning executives" }
  }
  
  const assignmentIds: string[] = []
  
  // Create assignments for each executive
  for (const exec of executives) {
    // Get executive details
    const { data: executive } = await supabase
      .from("profiles")
      .select("id, display_name, agro_id, avatar_url, lga, community, verification_status, is_active")
      .eq("id", exec.executiveId)
      .single()
    
    if (!executive || executive.verification_status !== "verified" || !executive.is_active) {
      continue // Skip invalid executives
    }
    
    // Create the assignment
    const { data: assignment, error: assignError } = await supabase
      .from("service_assignments")
      .insert({
        request_id: requestId,
        executive_id: exec.executiveId,
        assigned_by: user.id,
        role_description: exec.roleDescription,
        notes: exec.notes,
        status: "assigned",
      })
      .select()
      .single()
    
    if (assignError) {
      console.error("[v0] assignExecutives error:", assignError)
      continue
    }
    
    assignmentIds.push(assignment.id)
    
    // Generate letter reference
    const { data: letterRef } = await supabase.rpc("generate_letter_reference")
    const letterReference = letterRef || `AGV-ASN-${new Date().getFullYear()}-${Date.now()}`
    
    // Create assignment letter
    const letterContent = {
      title: "Letter of Assignment",
      date: new Date().toISOString(),
      executiveName: executive.display_name,
      executiveAgroId: executive.agro_id,
      gcmName: gcmProfile.display_name,
      gcmSignatureUrl: gcmProfile.signature_url,
      serviceName: request.service?.title ?? "Service",
      serviceDescription: request.service?.description ?? "",
      requesterName: request.requester?.display_name ?? "Requester",
      locationDetails: {
        state: request.location_state ?? "",
        lga: request.location_lga ?? "",
        address: request.location_address ?? "",
        details: request.location_details ?? "",
      },
      roleDescription: exec.roleDescription ?? "Execute assigned tasks",
      notes: exec.notes ?? "",
      communityName: request.service?.community ?? gcmProfile.community,
    }
    
    const { data: letter, error: letterError } = await supabase
      .from("assignment_letters")
      .insert({
        assignment_id: assignment.id,
        request_id: requestId,
        letter_reference: letterReference,
        letter_content: letterContent,
        gcm_signature_url: gcmProfile.signature_url,
      })
      .select()
      .single()
    
    if (letterError) {
      console.error("[v0] createAssignmentLetter error:", letterError)
    }
    
    // Create notification for executive
    if (letter) {
      // Old executive_notifications table (for legacy support)
      await supabase
        .from("executive_notifications")
        .insert({
          executive_id: exec.executiveId,
          type: "assignment_letter",
          assignment_id: assignment.id,
          request_id: requestId,
          letter_id: letter.id,
          title: "New Assignment",
          message: `You have been assigned to: ${request.service?.title}. Please review your assignment letter.`,
        })
      
      // New unified notifications system
      await createNotification({
        userId: exec.executiveId,
        type: 'assignment_new',
        title: 'New Assignment Received',
        body: `You have been assigned to: ${request.service?.title}. Please review your assignment letter and accept or decline.`,
        referenceType: 'assignment',
        referenceId: assignment.id,
        actionUrl: `/dashboard/assignments?id=${assignment.id}`,
        metadata: { letterReference: letter.letter_reference },
      })
    }
  }
  
  // Update request status to in_progress
  if (assignmentIds.length > 0) {
    await supabase
      .from("service_requests")
      .update({ status: "in_progress" })
      .eq("id", requestId)
  }
  
  revalidatePath("/dashboard/requests")
  revalidatePath("/dashboard")
  
  return { success: true, assignmentIds }
}

export async function fetchRequestAssignments(
  requestId: string
): Promise<{ assignments: ServiceAssignment[]; error?: string }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("service_assignments")
    .select(`
      *,
      executive:profiles!executive_id (
        id, display_name, agro_id, avatar_url, lga, phone, community
      )
    `)
    .eq("request_id", requestId)
    .order("created_at", { ascending: true })
  
  if (error) {
    console.error("[v0] fetchRequestAssignments error:", error)
    return { assignments: [], error: error.message }
  }
  
  return { assignments: data as ServiceAssignment[] }
}

// ============ EXECUTIVE NOTIFICATIONS & LETTERS ============

export async function fetchMyNotifications(options?: {
  unreadOnly?: boolean
  limit?: number
}): Promise<{ notifications: ExecutiveNotification[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { notifications: [], error: "Not authenticated" }
  
  let query = supabase
    .from("executive_notifications")
    .select(`
      *,
      letter:assignment_letters (
        id, letter_reference, letter_content, gcm_signature_url, is_read, created_at
      )
    `)
    .eq("executive_id", user.id)
    .order("created_at", { ascending: false })
  
  if (options?.unreadOnly) {
    query = query.eq("is_read", false)
  }
  
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("[v0] fetchMyNotifications error:", error)
    return { notifications: [], error: error.message }
  }
  
  return { notifications: data as ExecutiveNotification[] }
}

export async function fetchMyAssignments(options?: {
  status?: string
  limit?: number
}): Promise<{ assignments: ServiceAssignment[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { assignments: [], error: "Not authenticated" }
  
  let query = supabase
    .from("service_assignments")
    .select(`
      *,
      executive:profiles!executive_id (
        id, display_name, agro_id, avatar_url, lga, phone, community
      )
    `)
    .eq("executive_id", user.id)
    .order("created_at", { ascending: false })
  
  if (options?.status) {
    query = query.eq("status", options.status)
  }
  
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("[v0] fetchMyAssignments error:", error)
    return { assignments: [], error: error.message }
  }
  
  return { assignments: data as ServiceAssignment[] }
}

export async function fetchAssignmentLetter(
  assignmentId: string
): Promise<{ letter: AssignmentLetter | null; error?: string }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("assignment_letters")
    .select("*")
    .eq("assignment_id", assignmentId)
    .single()
  
  if (error) {
    console.error("[v0] fetchAssignmentLetter error:", error)
    return { letter: null, error: error.message }
  }
  
  return { letter: data as AssignmentLetter }
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }
  
  const { error } = await supabase
    .from("executive_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("executive_id", user.id)
  
  if (error) {
    console.error("[v0] markNotificationRead error:", error)
    return { success: false, error: error.message }
  }
  
  // Also mark the letter as read if exists
  const { data: notification } = await supabase
    .from("executive_notifications")
    .select("letter_id")
    .eq("id", notificationId)
    .single()
  
  if (notification?.letter_id) {
    await supabase
      .from("assignment_letters")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notification.letter_id)
  }
  
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: "accepted" | "declined" | "completed",
  response?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }
  
  const updateData: Record<string, unknown> = {
    status,
    executive_response: response,
  }
  
  if (status === "accepted") {
    updateData.accepted_at = new Date().toISOString()
  } else if (status === "completed") {
    updateData.completed_at = new Date().toISOString()
  }
  
  const { error } = await supabase
    .from("service_assignments")
    .update(updateData)
    .eq("id", assignmentId)
    .eq("executive_id", user.id)
  
  if (error) {
    console.error("[v0] updateAssignmentStatus error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard/requests")
  revalidatePath("/dashboard")
  
  return { success: true }
}

// ============ UNREAD NOTIFICATION COUNT ============

export async function getUnreadNotificationCount(): Promise<{ count: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { count: 0, error: "Not authenticated" }
  
  const { count, error } = await supabase
    .from("executive_notifications")
    .select("*", { count: "exact", head: true })
    .eq("executive_id", user.id)
    .eq("is_read", false)
  
  if (error) {
    console.error("[v0] getUnreadNotificationCount error:", error)
    return { count: 0, error: error.message }
  }
  
  return { count: count ?? 0 }
}
