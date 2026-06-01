import "server-only"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPlatformConfig, type PlatformConfig } from "@/lib/rewards/config"
import { ADMIN_WALLET } from "@/lib/staking/staking-program"

export interface PointsSummary {
  balance: number
  lifetime: number
  config: PlatformConfig
  walletAddress: string | null
  isAdmin: boolean
  ledger: Array<{
    id: string
    delta: number
    reason: string
    created_at: string
  }>
  conversions: Array<{
    id: string
    points_spent: number
    v1n3_amount: number
    status: string
    signature: string | null
    created_at: string
  }>
}

export async function getPointsSummary(): Promise<PointsSummary | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const config = await getPlatformConfig(supabase)

  const [{ data: profile }, { data: ledger }, { data: conversions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("points_balance, points_lifetime, wallet_address")
      .eq("id", user.id)
      .single(),
    supabase
      .from("points_ledger")
      .select("id, delta, reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("points_conversions")
      .select("id, points_spent, v1n3_amount, status, signature, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  return {
    balance: profile?.points_balance ?? 0,
    lifetime: profile?.points_lifetime ?? 0,
    config,
    walletAddress: profile?.wallet_address ?? null,
    isAdmin: profile?.wallet_address === ADMIN_WALLET,
    ledger: ledger ?? [],
    conversions: conversions ?? [],
  }
}

export interface FeesSummary {
  totalFeeV1n3: number
  totalFeeNgn: number
  orderCount: number
  fee30dV1n3: number
  fee7dV1n3: number
  recent: Array<{
    id: string
    product_title: string
    platform_fee_v1n3: number
    platform_fee_ngn: number
    v1n3_amount: number
    created_at: string
    fee_signature: string | null
  }>
}

/**
 * Admin-only aggregate of platform fees collected. Caller MUST verify the
 * requesting user is the treasury/dev wallet before rendering this.
 */
export async function getFeesSummary(): Promise<FeesSummary> {
  const admin = createAdminClient()
  const now = Date.now()
  const d7 = new Date(now - 7 * 864e5).toISOString()
  const d30 = new Date(now - 30 * 864e5).toISOString()

  const { data: all } = await admin
    .from("marketplace_orders")
    .select("platform_fee_v1n3, platform_fee_ngn, created_at")
    .gt("platform_fee_v1n3", 0)

  const rows = all ?? []
  const totalFeeV1n3 = rows.reduce((s, r) => s + Number(r.platform_fee_v1n3 ?? 0), 0)
  const totalFeeNgn = rows.reduce((s, r) => s + Number(r.platform_fee_ngn ?? 0), 0)
  const fee7dV1n3 = rows
    .filter((r) => r.created_at >= d7)
    .reduce((s, r) => s + Number(r.platform_fee_v1n3 ?? 0), 0)
  const fee30dV1n3 = rows
    .filter((r) => r.created_at >= d30)
    .reduce((s, r) => s + Number(r.platform_fee_v1n3 ?? 0), 0)

  const { data: recent } = await admin
    .from("marketplace_orders")
    .select("id, product_title, platform_fee_v1n3, platform_fee_ngn, v1n3_amount, created_at, fee_signature")
    .gt("platform_fee_v1n3", 0)
    .order("created_at", { ascending: false })
    .limit(20)

  return {
    totalFeeV1n3,
    totalFeeNgn,
    orderCount: rows.length,
    fee7dV1n3,
    fee30dV1n3,
    recent: recent ?? [],
  }
}
