"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { CartItem, MarketplaceProduct } from "@/lib/marketplace/types"

const CART_PRODUCT_SELECT = `
  *,
  product:marketplace_products!product_id (
    *,
    seller:profiles!seller_id (
      id,
      display_name,
      agro_id,
      avatar_url,
      community,
      verification_status,
      wallet_address
    )
  )
`

// ============ READ ============

export async function fetchCart(): Promise<{ items: CartItem[]; error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { items: [], error: "Not authenticated" }

  const { data, error } = await supabase
    .from("cart_items")
    .select(CART_PRODUCT_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] fetchCart error:", error)
    return { items: [], error: error.message }
  }

  // Drop items whose product is no longer purchasable.
  const items = (data as CartItem[]).filter(
    (it) => it.product && it.product.status === "approved" && it.product.is_active,
  )

  return { items, error: null }
}

export async function fetchCartCount(): Promise<number> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 0

  const { data, error } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", user.id)

  if (error) return 0
  return (data ?? []).reduce((sum, r) => sum + (r.quantity as number), 0)
}

// ============ MUTATE ============

export async function addToCart(productId: string, quantity = 1) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const qty = Math.max(1, Math.floor(quantity))

  // Validate the product is purchasable and not the user's own listing.
  const { data: product } = await supabase
    .from("marketplace_products")
    .select("id, seller_id, status, is_active, quantity_available")
    .eq("id", productId)
    .single()

  if (!product || product.status !== "approved" || !product.is_active) {
    return { success: false, error: "This product is not available" }
  }
  if (product.seller_id === user.id) {
    return { success: false, error: "You cannot buy your own listing" }
  }
  if (product.quantity_available != null && product.quantity_available <= 0) {
    return { success: false, error: "This product is out of stock" }
  }

  // Upsert: bump quantity if it's already in the cart.
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle()

  if (existing) {
    let nextQty = existing.quantity + qty
    if (product.quantity_available != null) {
      nextQty = Math.min(nextQty, product.quantity_available)
    }
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQty })
      .eq("id", existing.id)
    if (error) return { success: false, error: error.message }
  } else {
    const startQty =
      product.quantity_available != null ? Math.min(qty, product.quantity_available) : qty
    const { error } = await supabase
      .from("cart_items")
      .insert({ user_id: user.id, product_id: productId, quantity: startQty })
    if (error) return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/marketplace")
  revalidatePath("/dashboard/marketplace/cart")
  return { success: true, error: null }
}

export async function updateCartQuantity(productId: string, quantity: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const qty = Math.floor(quantity)
  if (qty < 1) {
    return removeFromCart(productId)
  }

  // Clamp to available stock.
  const { data: product } = await supabase
    .from("marketplace_products")
    .select("quantity_available")
    .eq("id", productId)
    .single()

  const finalQty =
    product?.quantity_available != null ? Math.min(qty, Math.max(product.quantity_available, 1)) : qty

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: finalQty })
    .eq("user_id", user.id)
    .eq("product_id", productId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/dashboard/marketplace/cart")
  return { success: true, error: null, quantity: finalQty }
}

export async function removeFromCart(productId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/dashboard/marketplace")
  revalidatePath("/dashboard/marketplace/cart")
  return { success: true, error: null }
}

export async function clearCart() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id)
  if (error) return { success: false, error: error.message }

  revalidatePath("/dashboard/marketplace/cart")
  return { success: true, error: null }
}

// ============ SINGLE PRODUCT (detail page) ============

export async function fetchProductById(
  id: string,
): Promise<{ product: MarketplaceProduct | null; inCart: boolean; favorited: boolean; isOwn: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("marketplace_products")
    .select(
      `
      *,
      seller:profiles!seller_id (
        id,
        display_name,
        agro_id,
        avatar_url,
        community,
        verification_status
      )
    `,
    )
    .eq("id", id)
    .single()

  if (error || !data) {
    return { product: null, inCart: false, favorited: false, isOwn: false }
  }

  const product = data as MarketplaceProduct
  let inCart = false
  let favorited = false
  const isOwn = !!user && product.seller_id === user.id

  if (user) {
    const [{ data: cartRow }, { data: favRow }] = await Promise.all([
      supabase
        .from("cart_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .maybeSingle(),
      supabase
        .from("product_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .maybeSingle(),
    ])
    inCart = !!cartRow
    favorited = !!favRow
  }

  // Best-effort view count bump.
  try {
    await supabase.rpc("increment_product_views", { p_product_id: id })
  } catch {
    // ignore
  }

  return { product, inCart, favorited, isOwn }
}
