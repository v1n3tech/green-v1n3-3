import "server-only"
import { createClient } from "@/lib/supabase/server"

/**
 * Context builders that ground the AI in REAL platform data. The model is only
 * ever allowed to reason over these supplied facts — it must not invent prices,
 * balances or weather. Each builder degrades gracefully to null/empty.
 */

export type FarmerContext = {
  userId: string
  displayName: string | null
  role: string
  community: string | null
  secondaryCommunities: string[] | null
  lga: string | null
  state: string | null
  v1n3Balance: number
  verificationStatus: string | null
}

export async function getFarmerContext(): Promise<FarmerContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, role, community, secondary_communities, lga, state, v1n3_balance, verification_status",
    )
    .eq("id", user.id)
    .single()

  if (!profile) return null
  return {
    userId: user.id,
    displayName: profile.display_name,
    role: profile.role,
    community: profile.community,
    secondaryCommunities: profile.secondary_communities,
    lga: profile.lga,
    state: profile.state,
    v1n3Balance: Number(profile.v1n3_balance ?? 0),
    verificationStatus: profile.verification_status,
  }
}

export function describeFarmerContext(ctx: FarmerContext): string {
  const parts = [
    `Name: ${ctx.displayName ?? "Member"}`,
    `Role: ${ctx.role}`,
    ctx.community ? `Primary community: ${ctx.community}` : null,
    ctx.secondaryCommunities?.length ? `Other communities: ${ctx.secondaryCommunities.join(", ")}` : null,
    ctx.lga ? `LGA: ${ctx.lga}` : null,
    ctx.state ? `State: ${ctx.state}` : null,
  ].filter(Boolean)
  return parts.join(" | ")
}

export type CommodityPrice = {
  name: string
  symbol: string | null
  unit: string
  currentPrice: number | null
  priceChange24h: number | null
  lastUpdate: string | null
}

/** Real commodity prices from the admin/GCM-maintained commodities table. */
export async function getCommodityPrices(): Promise<CommodityPrice[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("commodities")
      .select("name, symbol, unit, current_price, price_change_24h, last_price_update")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    return (data ?? []).map((c) => ({
      name: c.name,
      symbol: c.symbol,
      unit: c.unit,
      currentPrice: c.current_price !== null ? Number(c.current_price) : null,
      priceChange24h: c.price_change_24h !== null ? Number(c.price_change_24h) : null,
      lastUpdate: c.last_price_update,
    }))
  } catch {
    return []
  }
}

export function describeCommodityPrices(prices: CommodityPrice[]): string {
  const priced = prices.filter((p) => p.currentPrice !== null)
  if (priced.length === 0) {
    return "No live commodity prices are recorded yet. Do not state any commodity price as fact — instead advise the member to check with their GCM or local market."
  }
  const lines = priced.map(
    (p) =>
      `${p.name}: ₦${p.currentPrice?.toLocaleString()}/${p.unit}${
        p.priceChange24h !== null ? ` (${p.priceChange24h > 0 ? "+" : ""}${p.priceChange24h}% 24h)` : ""
      }`,
  )
  return `Latest recorded commodity prices (NGN):\n${lines.join("\n")}`
}

export type KbEntry = {
  slug: string
  title: string
  category: string
  summary: string | null
  content: string
}

/** Published knowledge-base entries flagged for bot grounding. */
export async function getKnowledgeForBot(): Promise<KbEntry[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("knowledge_base")
      .select("slug, title, category, summary, content")
      .eq("is_published", true)
      .eq("use_in_bot", true)
      .order("sort_order", { ascending: true })
    return (data ?? []) as KbEntry[]
  } catch {
    return []
  }
}

/**
 * Assemble the knowledge base into a grounding block. Capped to keep the prompt
 * within budget; entries are already curated/short.
 */
export function buildKnowledgeBlock(entries: KbEntry[], maxChars = 14000): string {
  if (entries.length === 0) {
    return "No knowledge base articles are available. Answer only general questions and recommend contacting support for specifics."
  }
  let out = ""
  for (const e of entries) {
    const block = `\n### ${e.title} (${e.category})\n${e.summary ? e.summary + "\n" : ""}${e.content}\n`
    if (out.length + block.length > maxChars) break
    out += block
  }
  return out.trim()
}
