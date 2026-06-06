import "server-only"
import { generateText } from "ai"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAiConfig, logAiUsage } from "@/lib/ai/config"
import { LGA_COORDS, PLATEAU_CENTER } from "@/lib/ai/weather"

/**
 * Predictive BETA heuristics.
 *
 * Every number here is computed from REAL platform data (marketplace_orders,
 * delivery_requests, profiles) or from real climate normals (Open-Meteo
 * archive). The LLM is only used to write a short plain-language summary of the
 * already-computed figures — it never fabricates the underlying metrics.
 *
 * These are decision-support indicators labelled BETA, not guarantees, and the
 * credit/reliability score is explicitly NOT a loan decision.
 */

const DAY = 1000 * 60 * 60 * 24

// ---------------------------------------------------------------------------
// 1. Reliability / credit indicator (per member)
// ---------------------------------------------------------------------------

export type ReliabilityScore = {
  score: number // 0-100
  band: "Building" | "Fair" | "Good" | "Strong"
  factors: { label: string; value: string; weight: number }[]
  dataPoints: number
  summary: string | null
}

export async function getReliabilityScore(userId: string): Promise<ReliabilityScore> {
  const admin = createAdminClient()

  const [{ data: profile }, sells, buys, deliveries] = await Promise.all([
    admin
      .from("profiles")
      .select("weekly_rating, operational_rating, total_earnings, created_at")
      .eq("id", userId)
      .single(),
    admin
      .from("marketplace_orders")
      .select("id, status, fulfillment_status")
      .eq("seller_id", userId),
    admin.from("marketplace_orders").select("id, status").eq("buyer_id", userId),
    admin
      .from("delivery_requests")
      .select("id, status")
      .eq("seller_id", userId),
  ])

  const sales = sells.data ?? []
  const purchases = buys.data ?? []
  const deliveryRows = deliveries.data ?? []

  const completedSales = sales.filter(
    (o) => o.status === "completed" || o.fulfillment_status === "delivered",
  ).length
  const totalSales = sales.length
  const completedDeliveries = deliveryRows.filter((d) => d.status === "delivered").length
  const totalDeliveries = deliveryRows.length

  const weekly = Number(profile?.weekly_rating ?? 0)
  const operational = Number(profile?.operational_rating ?? 0)
  const tenureDays = profile?.created_at
    ? Math.max(0, (Date.now() - new Date(profile.created_at).getTime()) / DAY)
    : 0

  // Weighted sub-scores (each 0-1).
  const ratingScore = Math.min(1, (weekly + operational) / 200)
  const fulfillmentScore = totalSales > 0 ? completedSales / totalSales : 0.5
  const deliveryScore = totalDeliveries > 0 ? completedDeliveries / totalDeliveries : 0.5
  const activityScore = Math.min(1, (totalSales + purchases.length) / 20)
  const tenureScore = Math.min(1, tenureDays / 180)

  const score = Math.round(
    (ratingScore * 0.3 +
      fulfillmentScore * 0.25 +
      deliveryScore * 0.2 +
      activityScore * 0.15 +
      tenureScore * 0.1) *
      100,
  )

  const band: ReliabilityScore["band"] =
    score >= 80 ? "Strong" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Building"

  const factors = [
    { label: "Member ratings", value: `${weekly.toFixed(0)}/${operational.toFixed(0)}`, weight: 30 },
    {
      label: "Order fulfilment",
      value: totalSales > 0 ? `${completedSales}/${totalSales} sales` : "No sales yet",
      weight: 25,
    },
    {
      label: "Delivery completion",
      value: totalDeliveries > 0 ? `${completedDeliveries}/${totalDeliveries}` : "No deliveries",
      weight: 20,
    },
    { label: "Marketplace activity", value: `${totalSales + purchases.length} orders`, weight: 15 },
    { label: "Account tenure", value: `${Math.round(tenureDays)} days`, weight: 10 },
  ]

  const dataPoints = totalSales + purchases.length + totalDeliveries

  let summary: string | null = null
  const config = await getAiConfig()
  if (config.ai_enabled && config.predictive_enabled) {
    try {
      const { text, usage } = await generateText({
        model: config.model,
        temperature: 0.3,
        maxOutputTokens: 200,
        system:
          "You explain a platform reliability indicator to a Nigerian agricultural cooperative member. " +
          "Be encouraging and concrete. 2-3 sentences, max 55 words. Suggest one action to improve. " +
          "State clearly this is an advisory indicator, NOT a loan decision. Plain text only.",
        prompt:
          `Reliability score: ${score}/100 (band: ${band}), based on ${dataPoints} data points.\n` +
          factors.map((f) => `${f.label}: ${f.value} (weight ${f.weight}%)`).join("\n"),
      })
      summary = text.trim()
      logAiUsage({
        userId,
        feature: "insight_reliability",
        model: config.model,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      })
    } catch (err) {
      console.log("[v0] reliability summary failed:", (err as Error).message)
    }
  }

  return { score, band, factors, dataPoints, summary }
}

// ---------------------------------------------------------------------------
// 2. Demand forecast (per community, from real order flow)
// ---------------------------------------------------------------------------

export type DemandTrend = {
  product: string
  community: string | null
  recentOrders: number
  priorOrders: number
  changePct: number | null
  totalQuantity: number
}

export type DemandForecast = {
  windowDays: number
  trends: DemandTrend[]
  totalRecentOrders: number
  summary: string | null
}

export async function getDemandForecast(community?: string | null): Promise<DemandForecast> {
  const admin = createAdminClient()
  const windowDays = 30
  const now = Date.now()
  const recentSince = new Date(now - windowDays * DAY).toISOString()
  const priorSince = new Date(now - 2 * windowDays * DAY).toISOString()

  let query = admin
    .from("marketplace_orders")
    .select("product_title, community, quantity, created_at")
    .gte("created_at", priorSince)
  if (community) query = query.eq("community", community as never)

  const { data } = await query
  const rows = data ?? []

  const agg = new Map<string, DemandTrend>()
  for (const r of rows) {
    const key = `${r.product_title}`
    const isRecent = r.created_at >= recentSince
    const existing =
      agg.get(key) ??
      ({
        product: r.product_title ?? "Unknown",
        community: r.community ?? null,
        recentOrders: 0,
        priorOrders: 0,
        changePct: null,
        totalQuantity: 0,
      } as DemandTrend)
    if (isRecent) {
      existing.recentOrders += 1
      existing.totalQuantity += Number(r.quantity ?? 0)
    } else {
      existing.priorOrders += 1
    }
    agg.set(key, existing)
  }

  const trends = [...agg.values()]
    .map((t) => ({
      ...t,
      changePct:
        t.priorOrders > 0
          ? Math.round(((t.recentOrders - t.priorOrders) / t.priorOrders) * 100)
          : t.recentOrders > 0
            ? 100
            : 0,
    }))
    .sort((a, b) => b.recentOrders - a.recentOrders)
    .slice(0, 8)

  const totalRecentOrders = trends.reduce((s, t) => s + t.recentOrders, 0)

  let summary: string | null = null
  const config = await getAiConfig()
  if (config.ai_enabled && config.predictive_enabled && trends.length > 0) {
    try {
      const { text, usage } = await generateText({
        model: config.model,
        temperature: 0.4,
        maxOutputTokens: 220,
        system:
          "You are a market analyst for an agricultural marketplace in Plateau State, Nigeria. " +
          "Given REAL 30-day vs prior-30-day order counts, write a SHORT demand read (2-3 sentences, max 60 words). " +
          "Name 1-2 rising products and any falling ones. Never invent figures beyond those given. Plain text.",
        prompt:
          `Window: last ${windowDays} days vs prior ${windowDays} days.\n` +
          trends
            .map(
              (t) =>
                `${t.product}: ${t.recentOrders} recent vs ${t.priorOrders} prior (${
                  t.changePct! > 0 ? "+" : ""
                }${t.changePct}%), qty ${t.totalQuantity}`,
            )
            .join("\n"),
      })
      summary = text.trim()
      logAiUsage({
        feature: "insight_demand",
        model: config.model,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      })
    } catch (err) {
      console.log("[v0] demand summary failed:", (err as Error).message)
    }
  }

  return { windowDays, trends, totalRecentOrders, summary }
}

// ---------------------------------------------------------------------------
// 3. Yield estimate (climate normals + crop + area)
// ---------------------------------------------------------------------------

// Rough rain-fed yield baselines for Plateau (tonnes/hectare), midpoints from
// Nigerian agronomy references. Used as a transparent heuristic, not a promise.
const CROP_YIELD_BASELINE: Record<string, { min: number; max: number; rainMm: [number, number] }> = {
  maize: { min: 1.5, max: 4.5, rainMm: [500, 800] },
  rice: { min: 2.0, max: 5.0, rainMm: [1000, 1500] },
  potato: { min: 8.0, max: 20.0, rainMm: [500, 700] },
  "irish potato": { min: 8.0, max: 20.0, rainMm: [500, 700] },
  cowpea: { min: 0.8, max: 2.0, rainMm: [300, 600] },
  beans: { min: 0.8, max: 2.0, rainMm: [300, 600] },
  millet: { min: 0.8, max: 2.5, rainMm: [300, 500] },
  sorghum: { min: 1.0, max: 3.0, rainMm: [400, 650] },
  yam: { min: 8.0, max: 25.0, rainMm: [1000, 1500] },
  tomato: { min: 10.0, max: 30.0, rainMm: [400, 600] },
  "soya bean": { min: 1.0, max: 2.8, rainMm: [450, 700] },
  soybean: { min: 1.0, max: 2.8, rainMm: [450, 700] },
}

export type YieldEstimate = {
  crop: string
  lga: string | null
  areaHectares: number
  perHectareRange: [number, number]
  totalRange: [number, number]
  seasonRainfallMm: number | null
  rainfallFit: "low" | "adequate" | "high" | "unknown"
  summary: string | null
  matched: boolean
}

/** Fetch the last 90-day rainfall total from Open-Meteo archive for an LGA. */
async function getRecentSeasonRainfall(lga?: string | null): Promise<number | null> {
  const coords = (lga && LGA_COORDS[lga]) || PLATEAU_CENTER
  try {
    const end = new Date()
    const start = new Date(Date.now() - 90 * DAY)
    const params = new URLSearchParams({
      latitude: String(coords.lat),
      longitude: String(coords.lon),
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      daily: "precipitation_sum",
      timezone: "Africa/Lagos",
    })
    const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params.toString()}`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const sums: number[] = data?.daily?.precipitation_sum ?? []
    const total = sums.reduce((s, v) => s + (Number(v) || 0), 0)
    return Math.round(total * 10) / 10
  } catch {
    return null
  }
}

export async function getYieldEstimate(
  crop: string,
  areaHectares: number,
  lga?: string | null,
): Promise<YieldEstimate> {
  const key = crop.trim().toLowerCase()
  const baseline = CROP_YIELD_BASELINE[key]
  const area = Math.max(0, areaHectares)

  if (!baseline) {
    return {
      crop,
      lga: lga ?? null,
      areaHectares: area,
      perHectareRange: [0, 0],
      totalRange: [0, 0],
      seasonRainfallMm: null,
      rainfallFit: "unknown",
      summary: null,
      matched: false,
    }
  }

  const rainfall = await getRecentSeasonRainfall(lga)
  let fit: YieldEstimate["rainfallFit"] = "unknown"
  let factor = 1
  if (rainfall !== null) {
    const [lo, hi] = baseline.rainMm
    if (rainfall < lo) {
      fit = "low"
      factor = 0.8
    } else if (rainfall > hi * 1.4) {
      fit = "high"
      factor = 0.9
    } else {
      fit = "adequate"
      factor = 1
    }
  }

  const perHa: [number, number] = [
    Math.round(baseline.min * factor * 100) / 100,
    Math.round(baseline.max * factor * 100) / 100,
  ]
  const total: [number, number] = [
    Math.round(perHa[0] * area * 100) / 100,
    Math.round(perHa[1] * area * 100) / 100,
  ]

  let summary: string | null = null
  const config = await getAiConfig()
  if (config.ai_enabled && config.predictive_enabled) {
    try {
      const { text, usage } = await generateText({
        model: config.model,
        temperature: 0.4,
        maxOutputTokens: 200,
        system:
          "You are an agronomist for Plateau State, Nigeria. Explain a rain-fed yield ESTIMATE based on the " +
          "supplied baseline range and recent rainfall fit. 2-3 sentences, max 55 words. Mention it is a rough " +
          "estimate dependent on inputs, seeds and management. Never invent numbers beyond those given. Plain text.",
        prompt:
          `Crop: ${crop}. Area: ${area} ha. LGA: ${lga ?? "Plateau"}.\n` +
          `Estimated yield: ${perHa[0]}–${perHa[1]} t/ha (total ${total[0]}–${total[1]} t).\n` +
          `Recent 90-day rainfall: ${rainfall ?? "unknown"} mm; fit vs crop need: ${fit}.`,
      })
      summary = text.trim()
      logAiUsage({
        feature: "insight_yield",
        model: config.model,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      })
    } catch (err) {
      console.log("[v0] yield summary failed:", (err as Error).message)
    }
  }

  return {
    crop,
    lga: lga ?? null,
    areaHectares: area,
    perHectareRange: perHa,
    totalRange: total,
    seasonRainfallMm: rainfall,
    rainfallFit: fit,
    summary,
    matched: true,
  }
}

export const SUPPORTED_YIELD_CROPS = Object.keys(CROP_YIELD_BASELINE).filter(
  (c) => !["irish potato", "soybean", "beans"].includes(c),
)
