import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage } from "ai"
import { z } from "zod"
import {
  assertFeatureEnabled,
  AiDisabledError,
  isUnderDailyCap,
  logAiUsage,
} from "@/lib/ai/config"
import {
  getFarmerContext,
  describeFarmerContext,
  getCommodityPrices,
  describeCommodityPrices,
} from "@/lib/ai/context"
import { advisorySystemPrompt } from "@/lib/ai/prompts"
import { getWeatherForecast, summarizeForecast, LGA_COORDS } from "@/lib/ai/weather"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const config = await assertFeatureEnabled("advisory_enabled")

    const farmer = await getFarmerContext()
    if (!farmer) {
      return Response.json({ error: "Please sign in to use the Farmer Advisor." }, { status: 401 })
    }

    if (!(await isUnderDailyCap(farmer.userId, config.daily_message_cap))) {
      return Response.json(
        { error: "You've reached today's AI message limit. Please try again tomorrow." },
        { status: 429 },
      )
    }

    const { messages }: { messages: UIMessage[] } = await req.json()

    // Ground the model in REAL data: profile + live commodity prices.
    const prices = await getCommodityPrices()
    const system = advisorySystemPrompt({
      farmerContext: describeFarmerContext(farmer),
      weather: null, // weather is fetched on-demand via the tool below
      prices: describeCommodityPrices(prices),
      disclaimer: config.disclaimer,
    })

    const lgaNames = Object.keys(LGA_COORDS)

    const result = streamText({
      model: config.model,
      system,
      messages: await convertToModelMessages(messages),
      temperature: config.temperature,
      maxOutputTokens: config.max_output_tokens,
      stopWhen: stepCountIs(5),
      tools: {
        getWeather: tool({
          description:
            "Get the real 7-day weather forecast and recent rainfall for a Plateau State LGA. Use this whenever the member asks about planting timing, rain, drought, irrigation, spraying or harvest weather. Defaults to the member's own LGA if none is given.",
          inputSchema: z.object({
            lga: z
              .string()
              .nullable()
              .describe(`Plateau LGA name, or null to use the member's LGA. Valid: ${lgaNames.join(", ")}`),
          }),
          execute: async ({ lga }) => {
            const target = lga ?? farmer.lga ?? null
            const forecast = await getWeatherForecast(target)
            if (!forecast) {
              return { ok: false, message: "Weather data is temporarily unavailable. Do not invent figures." }
            }
            return { ok: true, summary: summarizeForecast(forecast), data: forecast }
          },
        }),
        getCommodityPrices: tool({
          description:
            "Get the latest recorded commodity prices from the platform (NGN). Use when the member asks about prices, what to sell, or market value. Never state a price that is not returned here.",
          inputSchema: z.object({}),
          execute: async () => {
            const latest = await getCommodityPrices()
            return { ok: true, summary: describeCommodityPrices(latest) }
          },
        }),
        suggestPlantingLocation: tool({
          description:
            "Compare recent rainfall across several Plateau LGAs to suggest where conditions look most favourable for a rain-dependent crop right now. Returns real rainfall figures per LGA.",
          inputSchema: z.object({
            lgas: z
              .array(z.string())
              .nullable()
              .describe("Specific LGAs to compare, or null to compare a representative spread."),
          }),
          execute: async ({ lgas }) => {
            const targets = (lgas && lgas.length ? lgas : ["Jos North", "Mangu", "Shendam", "Wase", "Bokkos"])
              .filter((l) => lgaNames.includes(l))
              .slice(0, 6)
            const results = await Promise.all(
              targets.map(async (l) => {
                const f = await getWeatherForecast(l)
                return f ? { lga: l, recentRainfallMm: f.recentRainfallMm, location: f.location } : null
              }),
            )
            const valid = results.filter(Boolean)
            if (valid.length === 0) return { ok: false, message: "Weather data unavailable." }
            return { ok: true, comparison: valid }
          },
        }),
      },
      onFinish: async ({ usage }) => {
        await logAiUsage({
          userId: farmer.userId,
          feature: "advisory",
          model: config.model,
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
        })
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (err) {
    if (err instanceof AiDisabledError) {
      return Response.json({ error: err.message }, { status: 403 })
    }
    console.log("[v0] advisory route error:", (err as Error).message)
    return Response.json({ error: "The advisor is unavailable right now. Please try again." }, { status: 500 })
  }
}
