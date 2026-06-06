"use server"

import { createClient } from "@/lib/supabase/server"
import { getYieldEstimate, type YieldEstimate } from "@/lib/ai/insights"
import { getAiConfig } from "@/lib/ai/config"

/**
 * Server action backing the BETA yield estimator. Validates input, resolves the
 * member's LGA for the rainfall lookup, and returns the grounded estimate.
 */
export async function estimateYieldAction(
  crop: string,
  areaHectares: number,
): Promise<{ ok: true; data: YieldEstimate } | { ok: false; error: string }> {
  const config = await getAiConfig()
  if (!config.ai_enabled || !config.predictive_enabled) {
    return { ok: false, error: "Predictive tools are currently turned off by an administrator." }
  }

  if (!crop?.trim()) return { ok: false, error: "Choose a crop." }
  const area = Number(areaHectares)
  if (!Number.isFinite(area) || area <= 0 || area > 10000) {
    return { ok: false, error: "Enter a valid area between 0 and 10,000 hectares." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "You must be signed in." }

  const { data: profile } = await supabase.from("profiles").select("lga").eq("id", user.id).single()

  const data = await getYieldEstimate(crop, area, profile?.lga)
  if (!data.matched) {
    return { ok: false, error: `No yield baseline for "${crop}" yet. Try a supported crop.` }
  }
  return { ok: true, data }
}
