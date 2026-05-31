import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardMarketplace } from "@/components/dashboard/dashboard-marketplace"
import {
  fetchApprovedProducts,
  fetchMyProducts,
  fetchPendingProducts,
  fetchMyFavoriteIds,
  fetchMarketplaceStats,
  LISTING_ROLES,
  APPROVER_ROLES,
  type MarketplaceProduct,
} from "@/lib/marketplace/actions"
import type { AgroCommunityKey } from "@/components/onboarding/data"

export const metadata = {
  title: "Marketplace — Dashboard — GreenV1n3",
  description: "Browse and trade agricultural products.",
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, community")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

  const role = (profile.role as string) ?? "user"
  const canList = LISTING_ROLES.includes(role)
  const canApprove = APPROVER_ROLES.includes(role)

  // Resolve the initial tab from the URL, gated by permissions.
  let initialTab: "browse" | "listings" | "review" = "browse"
  if (tab === "review" && canApprove) initialTab = "review"
  else if (tab === "listings" && canList) initialTab = "listings"

  // Fetch everything in parallel
  const [approved, mine, pending, favorites, stats] = await Promise.all([
    fetchApprovedProducts({ limit: 48 }),
    canList ? fetchMyProducts() : Promise.resolve({ products: [] as MarketplaceProduct[], error: null }),
    canApprove ? fetchPendingProducts() : Promise.resolve({ products: [] as MarketplaceProduct[], error: null }),
    fetchMyFavoriteIds(),
    fetchMarketplaceStats(),
  ])

  return (
    <DashboardMarketplace
      role={role}
      canList={canList}
      canApprove={canApprove}
      initialTab={initialTab}
      userCommunity={(profile.community as AgroCommunityKey) ?? null}
      initialProducts={approved.products}
      myProducts={mine.products}
      pendingProducts={pending.products}
      favoriteIds={favorites.ids}
      stats={stats.stats}
    />
  )
}
