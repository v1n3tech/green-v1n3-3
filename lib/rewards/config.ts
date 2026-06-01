import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface PlatformConfig {
  feePercent: number
  pointsPerTransaction: number
  pointsPerV1n3: number
  minConversionPoints: number
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  feePercent: 2.5,
  pointsPerTransaction: 40,
  pointsPerV1n3: 1000,
  minConversionPoints: 1000,
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value) : (value as number)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Read the admin-editable marketplace fee + loyalty point settings from
 * platform_config. Falls back to sensible defaults if a key is missing.
 */
export async function getPlatformConfig(supabase: SupabaseClient): Promise<PlatformConfig> {
  const { data } = await supabase.from("platform_config").select("key, value")

  const map = new Map<string, unknown>((data ?? []).map((r) => [r.key as string, r.value]))

  return {
    feePercent: toNumber(map.get("marketplace_fee_percent"), DEFAULT_PLATFORM_CONFIG.feePercent),
    pointsPerTransaction: toNumber(
      map.get("points_per_transaction"),
      DEFAULT_PLATFORM_CONFIG.pointsPerTransaction,
    ),
    pointsPerV1n3: toNumber(map.get("points_per_v1n3"), DEFAULT_PLATFORM_CONFIG.pointsPerV1n3),
    minConversionPoints: toNumber(
      map.get("min_conversion_points"),
      DEFAULT_PLATFORM_CONFIG.minConversionPoints,
    ),
  }
}
