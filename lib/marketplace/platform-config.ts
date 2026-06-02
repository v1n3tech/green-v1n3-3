import { createClient } from "@/lib/supabase/server"

// Used when a listing has no seller-set delivery fee. Mirrors the seed in
// scripts/migrations/20260602_default_delivery_fee.sql. The platform_config
// row is admin-editable, so this constant is only a last-resort fallback.
export const FALLBACK_DELIVERY_FEE_NGN = 1500

/**
 * Resolve the platform default delivery fee (NGN). Reads the admin-editable
 * `default_delivery_fee_ngn` value from platform_config, falling back to a
 * safe constant if it is missing or invalid.
 */
export async function getDefaultDeliveryFeeNgn(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("platform_config")
      .select("value")
      .eq("key", "default_delivery_fee_ngn")
      .single()
    const value = Number(data?.value)
    return Number.isFinite(value) && value > 0 ? value : FALLBACK_DELIVERY_FEE_NGN
  } catch {
    return FALLBACK_DELIVERY_FEE_NGN
  }
}

/** Resolve the effective delivery fee for a listing (seller fee or platform default). */
export function resolveDeliveryFeeNgn(sellerFee: number | null | undefined, platformDefault: number): number {
  const fee = Number(sellerFee ?? 0)
  return fee > 0 ? fee : platformDefault
}
