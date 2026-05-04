"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { AgroCommunityKey } from "@/components/onboarding/data"

export type ServiceRequestStatus = 
  | "pending" 
  | "accepted" 
  | "payment_pending"
  | "paid"
  | "in_progress"
  | "rejected" 
  | "negotiating" 
  | "completed" 
  | "cancelled"

export interface CommunityService {
  id: string
  gcm_id: string
  title: string
  description: string
  community: AgroCommunityKey
  price: number
  price_unit: string
  is_active: boolean
  is_featured: boolean
  thumbnail: string | null
  gallery: string[] | null
  tags: string[] | null
  turnaround_time: string | null
  requests_count: number
  completed_count: number
  rating: number
  reviews_count: number
  created_at: string
  updated_at: string
  // Joined data
  gcm?: {
    id: string
    display_name: string
    agro_id: string
    avatar_url: string | null
    community: string
  }
}

export interface ServiceRequest {
  id: string
  service_id: string
  requester_id: string
  gcm_id: string
  message: string | null
  original_price: number
  requester_quote: number | null
  gcm_quote: number | null
  final_price: number | null
  status: ServiceRequestStatus
  gcm_response: string | null
  created_at: string
  updated_at: string
  accepted_at: string | null
  completed_at: string | null
  // Location details (added after acceptance)
  location_state: string | null
  location_lga: string | null
  location_address: string | null
  location_details: string | null
  utility_bill_url: string | null
  details_submitted_at: string | null
  // Payment info
  payment_status: string | null
  payment_reference: string | null
  paid_at: string | null
  // Joined data
  service?: CommunityService
  requester?: {
    id: string
    display_name: string
    agro_id: string
    avatar_url: string | null
  }
  gcm?: {
    id: string
    display_name: string
    agro_id: string
    avatar_url: string | null
  }
}

export interface RequestMessage {
  id: string
  request_id: string
  sender_id: string
  message: string
  quote_amount: number | null
  created_at: string
  sender?: {
    id: string
    display_name: string
    agro_id: string
  }
}

// ============ SERVICES ============

export async function fetchServices(options?: {
  community?: AgroCommunityKey
  gcmId?: string
  activeOnly?: boolean
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("community_services")
    .select(`
      *,
      gcm:profiles!gcm_id (
        id,
        display_name,
        agro_id,
        avatar_url,
        community
      )
    `)
    .order("created_at", { ascending: false })
  
  if (options?.community) {
    query = query.eq("community", options.community)
  }
  
  if (options?.gcmId) {
    query = query.eq("gcm_id", options.gcmId)
  }
  
  if (options?.activeOnly !== false) {
    query = query.eq("is_active", true)
  }
  
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("[v0] fetchServices error:", error)
    return { services: [], error: error.message }
  }
  
  return { services: data as CommunityService[], error: null }
}

export async function fetchServiceById(serviceId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("community_services")
    .select(`
      *,
      gcm:profiles!gcm_id (
        id,
        display_name,
        agro_id,
        avatar_url,
        community
      )
    `)
    .eq("id", serviceId)
    .single()
  
  if (error) {
    console.error("[v0] fetchServiceById error:", error)
    return { service: null, error: error.message }
  }
  
  return { service: data as CommunityService, error: null }
}

export async function createService(data: {
  title: string
  description: string
  community: AgroCommunityKey
  price: number
  price_unit?: string
  thumbnail?: string
  gallery?: string[]
  tags?: string[]
  turnaround_time?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { service: null, error: "Not authenticated" }
  }
  
  // Verify user is a GCM
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (profile?.role !== "gcm") {
    return { service: null, error: "Only GCMs can create services" }
  }
  
  const { data: service, error } = await supabase
    .from("community_services")
    .insert({
      gcm_id: user.id,
      title: data.title,
      description: data.description,
      community: data.community,
      price: data.price,
      price_unit: data.price_unit ?? "per service",
      thumbnail: data.thumbnail,
      gallery: data.gallery,
      tags: data.tags,
      turnaround_time: data.turnaround_time,
    })
    .select()
    .single()
  
  if (error) {
    console.error("[v0] createService error:", error)
    return { service: null, error: error.message }
  }
  
  revalidatePath("/dashboard/requests")
  revalidatePath("/communities")
  revalidatePath("/dashboard/communities")
  
  return { service, error: null }
}

export async function updateService(
  serviceId: string,
  data: Partial<{
    title: string
    description: string
    price: number
    price_unit: string
    is_active: boolean
    is_featured: boolean
    thumbnail: string
    gallery: string[]
    tags: string[]
    turnaround_time: string
  }>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  const { error } = await supabase
    .from("community_services")
    .update(data)
    .eq("id", serviceId)
    .eq("gcm_id", user.id)
  
  if (error) {
    console.error("[v0] updateService error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard/requests")
  revalidatePath("/communities")
  
  return { success: true, error: null }
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  const { error } = await supabase
    .from("community_services")
    .delete()
    .eq("id", serviceId)
    .eq("gcm_id", user.id)
  
  if (error) {
    console.error("[v0] deleteService error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard/requests")
  
  return { success: true, error: null }
}

// ============ REQUESTS ============

export async function fetchMyRequests(options?: {
  status?: ServiceRequestStatus
  asGcm?: boolean
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { requests: [], error: "Not authenticated" }
  }
  
  let query = supabase
    .from("service_requests")
    .select(`
      *,
      service:community_services (
        id,
        title,
        description,
        community,
        price,
        price_unit,
        thumbnail,
        gcm_id
      ),
      requester:profiles!requester_id (
        id,
        display_name,
        agro_id,
        avatar_url
      ),
      gcm:profiles!gcm_id (
        id,
        display_name,
        agro_id,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })
  
  // Filter by role
  if (options?.asGcm) {
    query = query.eq("gcm_id", user.id)
  } else {
    query = query.eq("requester_id", user.id)
  }
  
  if (options?.status) {
    query = query.eq("status", options.status)
  }
  
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("[v0] fetchMyRequests error:", error)
    return { requests: [], error: error.message }
  }
  
  return { requests: data as ServiceRequest[], error: null }
}

export async function fetchRequestById(requestId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      service:community_services (
        id,
        title,
        description,
        community,
        price,
        price_unit,
        thumbnail,
        gcm_id
      ),
      requester:profiles!requester_id (
        id,
        display_name,
        agro_id,
        avatar_url
      ),
      gcm:profiles!gcm_id (
        id,
        display_name,
        agro_id,
        avatar_url
      )
    `)
    .eq("id", requestId)
    .single()
  
  if (error) {
    console.error("[v0] fetchRequestById error:", error)
    return { request: null, error: error.message }
  }
  
  return { request: data as ServiceRequest, error: null }
}

export async function createServiceRequest(data: {
  serviceId: string
  message?: string
  counterQuote?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { request: null, error: "Not authenticated" }
  }
  
  // Get service details
  const { data: service, error: serviceError } = await supabase
    .from("community_services")
    .select("id, gcm_id, price")
    .eq("id", data.serviceId)
    .single()
  
  if (serviceError || !service) {
    return { request: null, error: "Service not found" }
  }
  
  // Prevent requesting own service
  if (service.gcm_id === user.id) {
    return { request: null, error: "Cannot request your own service" }
  }
  
  const { data: request, error } = await supabase
    .from("service_requests")
    .insert({
      service_id: data.serviceId,
      requester_id: user.id,
      gcm_id: service.gcm_id,
      message: data.message,
      original_price: service.price,
      requester_quote: data.counterQuote,
      status: data.counterQuote ? "negotiating" : "pending",
    })
    .select()
    .single()
  
  if (error) {
    console.error("[v0] createServiceRequest error:", error)
    return { request: null, error: error.message }
  }
  
  revalidatePath("/dashboard/requests")
  
  return { request, error: null }
}

export async function respondToRequest(
  requestId: string,
  action: "accept" | "reject" | "counter",
  data?: {
    response?: string
    counterQuote?: number
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  // Get request to verify ownership
  const { data: request } = await supabase
    .from("service_requests")
    .select("gcm_id, requester_id, original_price, requester_quote")
    .eq("id", requestId)
    .single()
  
  if (!request) {
    return { success: false, error: "Request not found" }
  }
  
  const isGcm = request.gcm_id === user.id
  const isRequester = request.requester_id === user.id
  
  if (!isGcm && !isRequester) {
    return { success: false, error: "Unauthorized" }
  }
  
  let updateData: Record<string, unknown> = {}
  
  if (action === "accept") {
    if (!isGcm) {
      return { success: false, error: "Only GCM can accept requests" }
    }
    updateData = {
      status: "accepted",
      gcm_response: data?.response,
      final_price: request.requester_quote ?? request.original_price,
      accepted_at: new Date().toISOString(),
    }
  } else if (action === "reject") {
    if (!isGcm) {
      return { success: false, error: "Only GCM can reject requests" }
    }
    updateData = {
      status: "rejected",
      gcm_response: data?.response,
    }
  } else if (action === "counter") {
    if (isGcm) {
      updateData = {
        status: "negotiating",
        gcm_quote: data?.counterQuote,
        gcm_response: data?.response,
      }
    } else {
      updateData = {
        status: "negotiating",
        requester_quote: data?.counterQuote,
      }
    }
  }
  
  const { error } = await supabase
    .from("service_requests")
    .update(updateData)
    .eq("id", requestId)
  
  if (error) {
    console.error("[v0] respondToRequest error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard/requests")
  
  return { success: true, error: null }
}

export async function cancelRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  const { error } = await supabase
    .from("service_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("requester_id", user.id)
  
  if (error) {
    console.error("[v0] cancelRequest error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard/requests")
  
  return { success: true, error: null }
}

export async function completeRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }
  
  // Only GCM can mark as complete
  const { data: request } = await supabase
    .from("service_requests")
    .select("gcm_id, status")
    .eq("id", requestId)
    .single()
  
  if (!request || request.gcm_id !== user.id) {
    return { success: false, error: "Unauthorized" }
  }
  
  if (request.status !== "accepted") {
    return { success: false, error: "Request must be accepted first" }
  }
  
  const { error } = await supabase
    .from("service_requests")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
  
  if (error) {
    console.error("[v0] completeRequest error:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard/requests")
  
  return { success: true, error: null }
}

// ============ MESSAGES ============

export async function fetchRequestMessages(requestId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("service_request_messages")
    .select(`
      *,
      sender:profiles!sender_id (
        id,
        display_name,
        agro_id
      )
    `)
    .eq("request_id", requestId)
    .order("created_at", { ascending: true })
  
  if (error) {
    console.error("[v0] fetchRequestMessages error:", error)
    return { messages: [], error: error.message }
  }
  
  return { messages: data as RequestMessage[], error: null }
}

export async function sendRequestMessage(data: {
  requestId: string
  message: string
  quoteAmount?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { message: null, error: "Not authenticated" }
  }
  
  const { data: message, error } = await supabase
    .from("service_request_messages")
    .insert({
      request_id: data.requestId,
      sender_id: user.id,
      message: data.message,
      quote_amount: data.quoteAmount,
    })
    .select()
    .single()
  
  if (error) {
    console.error("[v0] sendRequestMessage error:", error)
    return { message: null, error: error.message }
  }
  
  // If quote amount provided, update the request
  if (data.quoteAmount) {
    const { data: request } = await supabase
      .from("service_requests")
      .select("gcm_id")
      .eq("id", data.requestId)
      .single()
    
    if (request?.gcm_id === user.id) {
      await supabase
        .from("service_requests")
        .update({ gcm_quote: data.quoteAmount, status: "negotiating" })
        .eq("id", data.requestId)
    } else {
      await supabase
        .from("service_requests")
        .update({ requester_quote: data.quoteAmount, status: "negotiating" })
        .eq("id", data.requestId)
    }
  }
  
  revalidatePath("/dashboard/requests")
  
  return { message, error: null }
}

// ============ STATS ============

export async function fetchServiceStats(gcmId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const targetId = gcmId ?? user?.id
  if (!targetId) {
    return { stats: null, error: "Not authenticated" }
  }
  
  // Get services count
  const { count: servicesCount } = await supabase
    .from("community_services")
    .select("*", { count: "exact", head: true })
    .eq("gcm_id", targetId)
  
  // Get requests stats
  const { data: requests } = await supabase
    .from("service_requests")
    .select("status")
    .eq("gcm_id", targetId)
  
  const pendingCount = requests?.filter(r => r.status === "pending").length ?? 0
  const acceptedCount = requests?.filter(r => r.status === "accepted").length ?? 0
  const completedCount = requests?.filter(r => r.status === "completed").length ?? 0
  const totalRequests = requests?.length ?? 0
  
  return {
    stats: {
      servicesCount: servicesCount ?? 0,
      totalRequests,
      pendingCount,
      acceptedCount,
      completedCount,
    },
    error: null,
  }
}
