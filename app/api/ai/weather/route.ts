import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { getWeatherForecast, summarizeForecast } from "@/lib/ai/weather"
import { getAiConfig, logAiUsage } from "@/lib/ai/config"

export const maxDuration = 30

/**
 * Dashboard weather + advisory endpoint.
 *
 * Returns the real Open-Meteo forecast for the signed-in member's LGA plus a
 * short, grounded farming advisory generated from that forecast and the
 * member's primary agro community. Weather numbers are always real; the model
 * only interprets them.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("lga, community, full_name")
    .eq("id", user.id)
    .single()

  const forecast = await getWeatherForecast(profile?.lga)
  if (!forecast) {
    return NextResponse.json({ error: "Weather data is temporarily unavailable." }, { status: 503 })
  }

  const config = await getAiConfig()

  let advisory: string | null = null
  if (config.ai_enabled && config.weather_enabled) {
    try {
      const community = profile?.community ?? "general farming"
      const { text, usage } = await generateText({
        model: config.model,
        temperature: 0.5,
        maxOutputTokens: 320,
        system:
          "You are an agronomy advisor for farmers in Plateau State, Nigeria. " +
          "You are given a real 7-day weather forecast. Write a SHORT, practical advisory " +
          "(2-3 sentences, max 60 words) tailored to the member's agro community. " +
          "Focus on concrete near-term actions (planting, spraying, irrigation, drying, harvest, livestock). " +
          "Never invent prices. Do not repeat the raw numbers verbatim. Plain text, no markdown headings.",
        prompt:
          `Member's agro community: ${community}.\n` +
          `Location: ${forecast.location}.\n\n` +
          `${summarizeForecast(forecast)}\n\n` +
          `Write the advisory now.`,
      })
      advisory = text.trim()
      logAiUsage({
        userId: user.id,
        feature: "weather_advisory",
        model: config.model,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      })
    } catch (err) {
      console.log("[v0] weather advisory generation failed:", (err as Error).message)
    }
  }

  return NextResponse.json({
    forecast,
    advisory,
    disclaimer: config.disclaimer,
  })
}
