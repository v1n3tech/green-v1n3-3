"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications/actions"
import { DeliveryRequest, CreateDeliveryRequestInput } from "./types"

/**
 * Seller creates a delivery request for an order.
 * This notifies the logistics GCM of agro_logistics community.
 */
export async function createDeliveryRequest(input: CreateDeliveryRequestInput): Promise<{
  request: DeliveryRequest | null
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { request: null, error: "Unauthorized" }

  // Verify the order belongs to the seller.
  const { data: order } = await supabase
    .from("marketplace_orders")
    .select("id, seller_id")
    .eq("id", input.order_id)
    .single()

  if (!order || order.seller_id !== user.id) {
    return { request: null, error: "Order not found or not owned by you" }
  }

  // Create the delivery request.
  const { data, error } = await supabase
    .from("delivery_requests")
    .insert({
      order_id: input.order_id,
      seller_id: user.id,
      delivery_address: input.delivery_address,
      delivery_state: input.delivery_state,
      delivery_lga: input.delivery_lga,
      delivery_contact_phone: input.delivery_contact_phone,
      notes: input.notes || null,
      pickup_terminal_id: input.pickup_terminal_id || null,
      status: "pending",
    })
    .select()
    .single()

  if (error) return { request: null, error: error.message }

  // Notify all logistics GCMs of the new delivery request.
  try {
    const { data: logisticsGcms } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "gcm")
      .eq("community", "agro_logistics")

    for (const gcm of logisticsGcms ?? []) {
      await createNotification({
        userId: gcm.id,
        type: "system",
        title: "New delivery request",
        body: `Order ${input.order_id.slice(0, 8)} needs delivery to ${input.delivery_lga}, ${input.delivery_state}`,
        actionUrl: "/dashboard/logistics",
      })
    }
  } catch (e) {
    console.error("[v0] Failed to notify logistics GCM:", e)
  }

  revalidatePath("/dashboard/logistics")
  revalidatePath("/dashboard/orders")
  return { request: data as DeliveryRequest, error: null }
}

/**
 * Fetch all delivery requests visible to the current user.
 * Seller sees their own, logistics GCM sees pending + assigned to them,
 * assigned executive sees their assignments, marketing sees all.
 */
export async function fetchDeliveryRequests(): Promise<{
  requests: DeliveryRequest[]
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("delivery_requests")
    .select(
      `
      *,
      order:marketplace_orders(*),
      pickup_terminal:marketplace_terminals(*)
    `
    )
    .order("updated_at", { ascending: false })

  if (error) return { requests: [], error: error.message }
  return { requests: (data || []) as DeliveryRequest[], error: null }
}

/**
 * Logistics GCM accepts a delivery request and assigns an executive (or keeps unassigned for now).
 * This updates the request status to 'accepted' and optionally assigns an executive.
 */
export async function acceptDeliveryRequest(
  requestId: string,
  assignedExecutiveId?: string
): Promise<{
  request: DeliveryRequest | null
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { request: null, error: "Unauthorized" }

  // Verify user is the logistics GCM.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, community")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "gcm" || profile.community !== "agro_logistics") {
    return { request: null, error: "Only logistics GCM can accept delivery requests" }
  }

  const updates: any = {
    status: "accepted",
    logistics_gcm_id: user.id,
    accepted_at: new Date().toISOString(),
  }

  if (assignedExecutiveId) {
    updates.assigned_executive_id = assignedExecutiveId
  }

  const { data, error } = await supabase
    .from("delivery_requests")
    .update(updates)
    .eq("id", requestId)
    .select()
    .single()

  if (error) return { request: null, error: error.message }
  revalidatePath("/dashboard/logistics")
  return { request: data as DeliveryRequest, error: null }
}

/**
 * Logistics GCM or assigned executive schedules the delivery (sets scheduled_delivery_at).
 */
export async function scheduleDelivery(requestId: string, scheduledAt: string): Promise<{
  request: DeliveryRequest | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("delivery_requests")
    .update({
      status: "scheduled",
      scheduled_delivery_at: scheduledAt,
    })
    .eq("id", requestId)
    .select()
    .single()

  if (error) return { request: null, error: error.message }
  revalidatePath("/dashboard/logistics")
  revalidatePath("/dashboard/orders")
  return { request: data as DeliveryRequest, error: null }
}

/**
 * Mark a delivery as completed.
 */
export async function completeDelivery(requestId: string): Promise<{
  request: DeliveryRequest | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("delivery_requests")
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select()
    .single()

  if (error) return { request: null, error: error.message }
  revalidatePath("/dashboard/logistics")
  revalidatePath("/dashboard/orders")
  return { request: data as DeliveryRequest, error: null }
}
