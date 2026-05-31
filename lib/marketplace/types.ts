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
