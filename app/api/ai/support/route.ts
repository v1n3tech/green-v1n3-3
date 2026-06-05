import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { createClient } from "@/lib/supabase/server"
import { assertFeatureEnabled, AiDisabledError, logAiUsage } from "@/lib/ai/config"
import { getKnowledgeForBot, buildKnowledgeBlock } from "@/lib/ai/context"
import { supportSystemPrompt } from "@/lib/ai/prompts"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const config = await assertFeatureEnabled("support_bot_enabled")

    // The support bot is available to everyone (including pre-login visitors),
    // so an authenticated user is optional — we just log usage if present.
    let userId: string | null = null
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      userId = null
    }

    const { messages }: { messages: UIMessage[] } = await req.json()

    const kb = await getKnowledgeForBot()
    const system = supportSystemPrompt({
      knowledge: buildKnowledgeBlock(kb),
      disclaimer: config.disclaimer,
    })

    const result = streamText({
      model: config.model,
      system,
      messages: await convertToModelMessages(messages),
      temperature: 0.3,
      maxOutputTokens: config.max_output_tokens,
      onFinish: async ({ usage }) => {
        await logAiUsage({
          userId,
          feature: "support",
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
    console.log("[v0] support route error:", (err as Error).message)
    return Response.json({ error: "Support assistant is unavailable right now." }, { status: 500 })
  }
}
