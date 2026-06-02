"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { AgroCommunityKey } from "@/components/onboarding/data"
import { createNotification } from "@/lib/notifications/actions"
import { LISTING_ROLES, APPROVER_ROLES } from "@/lib/marketplace/types"
import type { MarketplaceProduct, ProductStatus } from "@/lib/marketplace/types"

function canList(role: string | null | undefined) {
  return !!role && LISTING_ROLES.includes(role)
}

function canApprove(role: string | null | undefined) {
  return !!role && APPROVER_ROLES.includes(role)
}

const SELLER_SELECT = `
  *,
  seller:profiles!seller_id (
    id,
    display_name,
    agro_id,
    avatar_url,
    community,
    verification_status
  )
`

// ============ READ ============

export async function fetchApprovedProducts(options?: {
  category?: string
  community?: AgroCommunityKey
  search?: string
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from("marketplace_products")
    .select(SELLER_SELECT)
    .eq("status", "approved")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })

  if (options?.category && options.category !== "all") {
    query = query.eq("category", options.category)
  }
  if (options?.community) {
    query = query.eq("community", options.community)
  }
  if (options?.search) {
    query = query.ilike("title", `%${options.search}%`)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 12) - 1)
  }

  const { data, error } = await query
  if (error) {
    console.error("[v0] fetchApprovedProducts error:", error)
    return { products: [], error: error.message }
  }
  return { products: data as MarketplaceProduct[], error: null }
}

export async function fetchMyProducts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { products: [], error: "Not authenticated" }

  const { data, error } = await supabase
    .from("marketplace_products")
    .select(SELLER_SELECT)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] fetchMyProducts error:", error)
    return { products: [], error: error.message }
  }
  return { products: data as MarketplaceProduct[], error: null }
}

// Review queue for GCM / Admin
export async function fetchPendingProducts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { products: [], error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!canApprove(profile?.role)) {
    return { products: [], error: "Not authorized" }
  }

  const { data, error } = await supabase
    .from("marketplace_products")
    .select(SELLER_SELECT)
    .eq("status", "pending_review")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] fetchPendingProducts error:", error)
    return { products: [], error: error.message }
  }
  return { products: data as MarketplaceProduct[], error: null }
}

export async function fetchPendingCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!canApprove(profile?.role)) return 0

  const { count } = await supabase
    .from("marketplace_products")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_review")

  return count ?? 0
}

// ============ CREATE ============

export async function createProduct(data: {
  title: string
  description: string
  category: string
  price: number
  price_unit?: string
  quantity_available?: number
  location?: string
  community?: AgroCommunityKey
  on_behalf_of_community?: boolean
  thumbnail?: string
  gallery?: string[]
  tags?: string[]
  offers_delivery?: boolean
  delivery_fee?: number
  pickup_available?: boolean
  terminal_ids?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { product: null, error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, community, display_name")
    .eq("id", user.id)
    .single()

  if (!canList(profile?.role)) {
    return { product: null, error: "Only executives, GCMs, and admins can list products" }
  }

  const isApprover = canApprove(profile?.role)
  // GCM/Admin listings are auto-approved. Executives go to the review queue.
  const status: ProductStatus = isApprover ? "approved" : "pending_review"

  // Default the community to the seller's community when not provided.
  const community = data.community ?? (profile?.community as AgroCommunityKey | undefined) ?? null

  const insertPayload: Record<string, unknown> = {
    seller_id: user.id,
    title: data.title,
    description: data.description,
    category: data.category,
    price: data.price,
    price_unit: data.price_unit ?? "each",
    quantity_available: data.quantity_available ?? null,
    location: data.location ?? null,
    community,
    on_behalf_of_community: data.on_behalf_of_community ?? false,
    thumbnail: data.thumbnail ?? null,
    gallery: data.gallery ?? null,
    tags: data.tags ?? null,
    status,
    offers_delivery: data.offers_delivery ?? false,
    delivery_fee: data.delivery_fee ?? 0,
    pickup_available: data.pickup_available ?? true,
  }

  if (isApprover) {
    insertPayload.approved_by = user.id
    insertPayload.approved_at = new Date().toISOString()
  }

  const { data: product, error } = await supabase
    .from("marketplace_products")
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    console.error("[v0] createProduct error:", error)
    return { product: null, error: error.message }
  }

  // Associate the product with the terminals the seller chose for pickup.
  if (data.pickup_available !== false && data.terminal_ids && data.terminal_ids.length > 0) {
    const rows = data.terminal_ids.map((terminal_id) => ({ product_id: product.id, terminal_id }))
    const { error: linkErr } = await supabase.from("product_terminals").insert(rows)
    if (linkErr) console.error("[v0] createProduct terminal link error:", linkErr)
  }

  // If this needs review, notify the GCM(s) of the product's community.
  if (status === "pending_review") {
    try {
      let gcmQuery = supabase.from("profiles").select("id").eq("role", "gcm")
      if (community) gcmQuery = gcmQuery.eq("community", community)
      const { data: gcms } = await gcmQuery

      for (const gcm of gcms ?? []) {
        await createNotification({
          userId: gcm.id,
          type: "system",
          title: "New product awaiting approval",
          body: `${profile?.display_name ?? "An executive"} submitted "${data.title}" for review.`,
          actionUrl: "/dashboard/marketplace?tab=review",
          metadata: { productId: product.id, kind: "product_review" },
        })
      }
    } catch (notifErr) {
      console.error("[v0] createProduct notify error:", notifErr)
    }
  }

  revalidatePath("/dashboard/marketplace")
  revalidatePath("/dashboard")
  return { product, error: null }
}

// ============ UPDATE ============

export async function updateProduct(
  productId: string,
  data: Partial<{
    title: string
    description: string
    category: string
    price: number
    price_unit: string
    quantity_available: number | null
    location: string
    is_active: boolean
    thumbnail: string
    gallery: string[]
    tags: string[]
  }>,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  // When an executive edits a rejected/pending listing, send it back to review.
  const { data: existing } = await supabase
    .from("marketplace_products")
    .select("status, seller_id")
    .eq("id", productId)
    .single()

  const payload: Record<string, unknown> = { ...data }
  if (existing && existing.seller_id === user.id && existing.status === "rejected") {
    payload.status = "pending_review"
    payload.rejection_reason = null
  }

  const { error } = await supabase
    .from("marketplace_products")
    .update(payload)
    .eq("id", productId)
    .eq("seller_id", user.id)

  if (error) {
    console.error("[v0] updateProduct error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/marketplace")
  return { success: true, error: null }
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  // RLS allows seller OR approver to delete.
  const { error } = await supabase
    .from("marketplace_products")
    .delete()
    .eq("id", productId)

  if (error) {
    console.error("[v0] deleteProduct error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/marketplace")
  return { success: true, error: null }
}

// ============ APPROVE / REJECT (GCM, Admin) ============

export async function reviewProduct(
  productId: string,
  action: "approve" | "reject",
  rejectionReason?: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!canApprove(profile?.role)) {
    return { success: false, error: "Only GCMs and admins can review products" }
  }

  const { data: product } = await supabase
    .from("marketplace_products")
    .select("seller_id, title")
    .eq("id", productId)
    .single()

  if (!product) return { success: false, error: "Product not found" }

  const updatePayload =
    action === "approve"
      ? {
          status: "approved" as ProductStatus,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
        }
      : {
          status: "rejected" as ProductStatus,
          rejection_reason: rejectionReason ?? "Did not meet marketplace guidelines.",
        }

  const { error } = await supabase
    .from("marketplace_products")
    .update(updatePayload)
    .eq("id", productId)

  if (error) {
    console.error("[v0] reviewProduct error:", error)
    return { success: false, error: error.message }
  }

  // Notify the seller of the decision.
  try {
    await createNotification({
      userId: product.seller_id,
      type: "system",
      title: action === "approve" ? "Product approved" : "Product needs changes",
      body:
        action === "approve"
          ? `Your listing "${product.title}" is now live on the marketplace.`
          : `Your listing "${product.title}" was not approved. ${rejectionReason ?? ""}`.trim(),
      actionUrl: "/dashboard/marketplace?tab=listings",
      metadata: { productId, kind: "product_review_result" },
    })
  } catch (notifErr) {
    console.error("[v0] reviewProduct notify error:", notifErr)
  }

  revalidatePath("/dashboard/marketplace")
  revalidatePath("/dashboard")
  return { success: true, error: null }
}

// ============ FAVORITES ============

export async function fetchMyFavoriteIds() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ids: [] as string[], error: null }

  const { data, error } = await supabase
    .from("product_favorites")
    .select("product_id")
    .eq("user_id", user.id)

  if (error) {
    console.error("[v0] fetchMyFavoriteIds error:", error)
    return { ids: [] as string[], error: error.message }
  }
  return { ids: (data ?? []).map((r) => r.product_id as string), error: null }
}

export async function toggleFavorite(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { favorited: false, error: "Not authenticated" }

  const { data: existing } = await supabase
    .from("product_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from("product_favorites").delete().eq("id", existing.id)
    if (error) return { favorited: true, error: error.message }
    revalidatePath("/dashboard/marketplace")
    return { favorited: false, error: null }
  }

  const { error } = await supabase
    .from("product_favorites")
    .insert({ user_id: user.id, product_id: productId })
  if (error) return { favorited: false, error: error.message }
  revalidatePath("/dashboard/marketplace")
  return { favorited: true, error: null }
}

// ============ STATS ============

export async function fetchMarketplaceStats() {
  const supabase = await createClient()

  const { count: productsCount } = await supabase
    .from("marketplace_products")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("is_active", true)

  const { count: verifiedCount } = await supabase
    .from("marketplace_products")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("is_active", true)
    .eq("is_featured", true)

  return {
    stats: {
      products: productsCount ?? 0,
      verified: verifiedCount ?? 0,
    },
    error: null,
  }
}
