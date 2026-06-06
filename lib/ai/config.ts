import "server-only"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Central AI configuration for the GreenV1n3 AI suite.
 *
 * All LLM calls run through the Vercel AI Gateway (zero-config for Google
 * models here), so we only ever pass a model string. The single-row
 * `ai_config` table is admin-editable and controls which features are live,
 * which model is used, and the safety guardrails.
 *
 * Core principle enforced across the suite: the AI never invents prices or
 * weather. Those values are always supplied from real data (Supabase
 * commodities table, Open-Meteo) and the model only explains / advises.
 */

export type AiConfig = {
  ai_enabled: boolean
  news_ai_enabled: boolean
  advisory_enabled: boolean
  support_bot_enabled: boolean
  weather_enabled: boolean
  predictive_enabled: boolean
  translation_enabled: boolean
  model: string
  temperature: number
  max_output_tokens: number
  daily_message_cap: number
  disclaimer: string
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  ai_enabled: true,
  news_ai_enabled: true,
  advisory_enabled: true,
  support_bot_enabled: true,
  weather_enabled: true,
  predictive_enabled: true,
  translation_enabled: true,
  model: "google/gemini-3.5-flash",
  temperature: 0.4,
  max_output_tokens: 2048,
  daily_message_cap: 50,
  disclaimer:
    "AI guidance is advisory only. Always confirm prices, weather and financial decisions with your GCM or local market.",
}

export type AiFeature =
  | "ai_enabled"
  | "news_ai_enabled"
  | "advisory_enabled"
  | "support_bot_enabled"
  | "weather_enabled"
  | "predictive_enabled"
  | "translation_enabled"

/** Read the live AI config from the database, falling back to safe defaults. */
export async function getAiConfig(): Promise<AiConfig> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from("ai_config").select("*").eq("id", true).single()
    if (!data) return DEFAULT_AI_CONFIG
    return {
      ai_enabled: data.ai_enabled ?? true,
      news_ai_enabled: data.news_ai_enabled ?? true,
      advisory_enabled: data.advisory_enabled ?? true,
      support_bot_enabled: data.support_bot_enabled ?? true,
      weather_enabled: data.weather_enabled ?? true,
      predictive_enabled: data.predictive_enabled ?? true,
      translation_enabled: data.translation_enabled ?? true,
      model: data.model ?? DEFAULT_AI_CONFIG.model,
      temperature: Number(data.temperature ?? DEFAULT_AI_CONFIG.temperature),
      max_output_tokens: data.max_output_tokens ?? DEFAULT_AI_CONFIG.max_output_tokens,
      daily_message_cap: data.daily_message_cap ?? DEFAULT_AI_CONFIG.daily_message_cap,
      disclaimer: data.disclaimer ?? DEFAULT_AI_CONFIG.disclaimer,
    }
  } catch (err) {
    console.log("[v0] getAiConfig fell back to defaults:", (err as Error).message)
    return DEFAULT_AI_CONFIG
  }
}

/** Throwable guard: ensure the suite + a specific feature are enabled. */
export async function assertFeatureEnabled(feature: AiFeature): Promise<AiConfig> {
  const config = await getAiConfig()
  if (!config.ai_enabled) throw new AiDisabledError("The AI suite is currently turned off by an administrator.")
  if (feature !== "ai_enabled" && !config[feature]) {
    throw new AiDisabledError("This AI feature is currently turned off by an administrator.")
  }
  return config
}

export class AiDisabledError extends Error {}

/**
 * Fire-and-forget usage logging via the service-role client (the ai_usage_log
 * table only grants SELECT through RLS; inserts must bypass it). Never throws.
 */
export async function logAiUsage(entry: {
  userId?: string | null
  feature: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  ok?: boolean
}): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from("ai_usage_log").insert({
      user_id: entry.userId ?? null,
      feature: entry.feature,
      model: entry.model ?? null,
      input_tokens: entry.inputTokens ?? 0,
      output_tokens: entry.outputTokens ?? 0,
      ok: entry.ok ?? true,
    })
  } catch (err) {
    console.log("[v0] logAiUsage failed (non-fatal):", (err as Error).message)
  }
}

/**
 * Per-user daily message guard for the conversational features. Counts today's
 * usage_log rows for advisory + support. Returns whether the user is under cap.
 */
export async function isUnderDailyCap(userId: string, cap: number): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const since = new Date()
    since.setHours(0, 0, 0, 0)
    const { count } = await admin
      .from("ai_usage_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("feature", ["advisory", "support"])
      .gte("created_at", since.toISOString())
    return (count ?? 0) < cap
  } catch {
    return true // fail open — never block a user because logging is down
  }
}
