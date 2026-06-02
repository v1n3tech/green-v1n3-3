"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/notifications/actions"

export interface TerminalManager {
  id: string
  user_id: string
  appointed_by: string | null
  is_active: boolean
  created_at: string
  profile?: {
    id: string
    display_name: string | null
    agro_id: string | null
    avatar_url: string | null
    lga: string | null
    phone: string | null
  }
}

export interface MarketingExecutive {
  id: string
  display_name: string | null
  agro_id: string | null
  avatar_url: string | null
  lga: string | null
  phone: string | null
}

export interface PickupOrder {
  id: string
  product_title: string | null
  product_thumbnail: string | null
  quantity: number | null
  v1n3_amount: number | null
  fulfillment_status: string | null
  created_at: string
  picked_up_at: string | null
  terminal: { id: string; name: string; lga: string; state: string } | null
  buyer: { display_name: string | null; phone: string | null } | null
  seller: { display_name: string | null } | null
}

/**
 * Resolve the terminal-related access for the current user.
 *  - canAppoint: marketing GCM (primary/secondary) or admin
 *  - isManager:  an active appointed manager OR an appointer
 */
export async function getTerminalAccess(): Promise<{
  isManager: boolean
  canAppoint: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { isManager: false, canAppoint: false }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, community, secondary_communities")
    .eq("id", user.id)
    .single()

  const secondary = (profile?.secondary_communities ?? []) as string[]
  const canAppoint =
    profile?.role === "admin" ||
    (profile?.role === "gcm" &&
      (profile?.community === "agro_marketing" || secondary.includes("agro_marketing")))

  if (canAppoint) return { isManager: true, canAppoint: true }

  const { data: appointment } = await supabase
    .from("terminal_managers")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  return { isManager: Boolean(appointment), canAppoint: false }
}

/** Marketing executives the GCM/admin can appoint as terminal managers. */
export async function fetchMarketingExecutives(): Promise<{
  executives: MarketingExecutive[]
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, agro_id, avatar_url, lga, phone")
    .eq("role", "agro_executive")
    .eq("community", "agro_marketing")
    .eq("is_active", true)
    .order("display_name", { ascending: true })

  if (error) return { executives: [], error: error.message }
  return { executives: (data ?? []) as MarketingExecutive[], error: null }
}

/** Current (active) terminal managers with their profile. */
export async function fetchTerminalManagers(): Promise<{
  managers: TerminalManager[]
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("terminal_managers")
    .select(
      `id, user_id, appointed_by, is_active, created_at,
       profile:profiles!user_id(id, display_name, agro_id, avatar_url, lga, phone)`,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) return { managers: [], error: error.message }
  return { managers: (data ?? []) as unknown as TerminalManager[], error: null }
}

/** Appoint an executive as a terminal manager. */
export async function appointTerminalManager(userId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const { isManager, canAppoint } = await getTerminalAccess()
  if (!canAppoint) return { success: false, error: "Only Marketing GCM or admin can appoint terminal managers" }
  void isManager

  // Upsert: re-activate if a row already exists for this user.
  const { error } = await supabase
    .from("terminal_managers")
    .upsert(
      { user_id: userId, appointed_by: user.id, is_active: true },
      { onConflict: "user_id" },
    )

  if (error) return { success: false, error: error.message }

  try {
    await createNotification({
      userId,
      type: "system",
      title: "You are now a Terminal Manager",
      body: "You have been appointed to manage terminal pickups. Open the Terminal dashboard to confirm collected orders.",
      actionUrl: "/dashboard/terminals",
    })
  } catch (e) {
    console.error("[v0] appoint notify error:", e)
  }

  revalidatePath("/dashboard/marketing")
  revalidatePath("/dashboard/terminals")
  return { success: true, error: null }
}

/** Revoke a terminal manager appointment. */
export async function revokeTerminalManager(userId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()
  const { canAppoint } = await getTerminalAccess()
  if (!canAppoint) return { success: false, error: "Only Marketing GCM or admin can revoke terminal managers" }

  const { error } = await supabase
    .from("terminal_managers")
    .update({ is_active: false })
    .eq("user_id", userId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/dashboard/marketing")
  revalidatePath("/dashboard/terminals")
  return { success: true, error: null }
}

/** Orders that chose terminal pickup, for the terminal dashboard. */
export async function fetchPickupOrders(): Promise<{
  orders: PickupOrder[]
  error: string | null
}> {
  const { isManager } = await getTerminalAccess()
  if (!isManager) return { orders: [], error: "Access denied" }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("marketplace_orders")
    .select(
      `id, product_title, product_thumbnail, quantity, v1n3_amount, fulfillment_status,
       created_at, picked_up_at,
       terminal:terminal_id(id, name, lga, state),
       buyer:buyer_id(display_name, phone),
       seller:seller_id(display_name)`,
    )
    .eq("fulfillment_method", "pickup")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) return { orders: [], error: error.message }
  return { orders: (data ?? []) as unknown as PickupOrder[], error: null }
}

/** Terminal manager confirms a buyer has collected their order at the terminal. */
export async function confirmPickup(orderId: string): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const { isManager } = await getTerminalAccess()
  if (!isManager) return { success: false, error: "Only terminal managers can confirm pickups" }

  const admin = createAdminClient()

  const { data: order } = await admin
    .from("marketplace_orders")
    .select("id, buyer_id, seller_id, product_title, fulfillment_method, fulfillment_status")
    .eq("id", orderId)
    .single()

  if (!order) return { success: false, error: "Order not found" }
  if (order.fulfillment_method !== "pickup") {
    return { success: false, error: "This order is not a terminal pickup" }
  }
  if (order.fulfillment_status === "collected") {
    return { success: false, error: "This order is already marked collected" }
  }

  const { error } = await admin
    .from("marketplace_orders")
    .update({
      fulfillment_status: "collected",
      picked_up_at: new Date().toISOString(),
      picked_up_by: user.id,
    })
    .eq("id", orderId)

  if (error) return { success: false, error: error.message }

  // Notify buyer + seller of the confirmed collection.
  try {
    await createNotification({
      userId: order.buyer_id,
      type: "system",
      title: "Order collected",
      body: `Your pickup for "${order.product_title}" was confirmed at the terminal.`,
      actionUrl: "/dashboard/orders",
    })
    await createNotification({
      userId: order.seller_id,
      type: "system",
      title: "Order collected at terminal",
      body: `"${order.product_title}" has been collected by the buyer.`,
      actionUrl: "/dashboard/orders",
    })
  } catch (e) {
    console.error("[v0] confirmPickup notify error:", e)
  }

  revalidatePath("/dashboard/terminals")
  revalidatePath("/dashboard/marketing")
  revalidatePath("/dashboard/orders")
  return { success: true, error: null }
}
