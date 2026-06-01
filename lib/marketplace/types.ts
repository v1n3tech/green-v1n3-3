import type { AgroCommunityKey } from "@/components/onboarding/data"

export type ProductStatus = "pending_review" | "approved" | "rejected" | "archived"

export const PRODUCT_CATEGORIES = [
  "crops",
  "livestock",
  "equipment",
  "seeds",
  "fertilizer",
  "services",
  "other",
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

// Roles allowed to create listings
export const LISTING_ROLES = ["agro_executive", "gcm", "lgpa", "scc_member", "admin"]
// Roles allowed to approve listings
export const APPROVER_ROLES = ["gcm", "admin"]

export interface MarketplaceProduct {
  id: string
  seller_id: string
  community: AgroCommunityKey | null
  on_behalf_of_community: boolean
  title: string
  description: string
  category: string
  price: number
  price_unit: string | null
  quantity_available: number | null
  location: string | null
  thumbnail: string | null
  gallery: string[] | null
  tags: string[] | null
  status: ProductStatus
  is_active: boolean
  is_featured: boolean
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  views_count: number
  orders_count: number
  favorites_count: number
  rating: number
  reviews_count: number
  created_at: string
  updated_at: string
  // Joined
  seller?: {
    id: string
    display_name: string | null
    agro_id: string | null
    avatar_url: string | null
    community: string | null
    verification_status: string | null
  }
}

// 1 V1N3 = this many NGN (mirrors V1N3_TOKEN.ngnRate in lib/wallet/v1n3-token.ts)
export const V1N3_NGN_RATE = 3002.4

export function ngnToV1n3(ngn: number): number {
  return ngn / V1N3_NGN_RATE
}

export type OrderStatus = "pending" | "paid" | "failed" | "fulfilled" | "cancelled"

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product?: MarketplaceProduct
}

export interface MarketplaceOrder {
  id: string
  buyer_id: string
  seller_id: string | null
  product_id: string | null
  product_title: string
  product_thumbnail: string | null
  community: AgroCommunityKey | null
  quantity: number
  unit_price: number
  total_price: number
  currency: string
  v1n3_amount: number
  payment_signature: string | null
  buyer_wallet: string | null
  seller_wallet: string | null
  status: OrderStatus
  memo: string | null
  created_at: string
  updated_at: string
}
