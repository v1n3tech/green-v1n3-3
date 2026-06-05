import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { assertFeatureEnabled, AiDisabledError, logAiUsage } from "@/lib/ai/config"
import { NEWS_AI_SYSTEM, SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/ai/prompts"

// Never use the edge runtime with the AI SDK.
export const runtime = "nodejs"
export const maxDuration = 60

const NEWS_MANAGER_ROLES = ["admin", "scc_member", "lgpa", "gcm"]

type NewsAction = "draft" | "improve" | "excerpt" | "tags" | "translate"

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, community")
      .eq("id", user.id)
      .single()

    const canManageNews =
      !!profile &&
      (NEWS_MANAGER_ROLES.includes(profile.role) ||
        (profile.role === "agro_executive" && profile.community === "agro_media_branding"))

    if (!canManageNews) {
      return Response.json({ error: "You do not have permission to use News AI." }, { status: 403 })
    }

    const config = await assertFeatureEnabled("news_ai_enabled")

    const body = (await req.json()) as {
      action: NewsAction
      title?: string
      excerpt?: string
      content?: string
      category?: string
      language?: LanguageCode
    }

    const action = body.action
    const title = (body.title ?? "").trim()
    const content = (body.content ?? "").trim()
    const plainContent = stripHtml(content)

    let prompt = ""
    switch (action) {
      case "draft":
        if (!title) return Response.json({ error: "Add a title or topic first." }, { status: 400 })
        prompt = `Write a complete news article for the GreenV1n3 agricultural platform (Plateau State, Nigeria).
Topic / working title: "${title}"
${body.category ? `Category: ${body.category}` : ""}
${plainContent ? `Notes from the editor to incorporate: ${plainContent}` : ""}

Return ONLY the article body as clean semantic HTML using <p>, <h2>, <h3>, <ul>, <li>, and <strong> tags.
Do not include the headline as an <h1>, a code fence, or any commentary. Use 4-7 short paragraphs with one or two subheadings. Write in clear, professional journalistic English suitable for Nigerian farmers and agro-businesses.`
        break
      case "improve":
        if (!plainContent) return Response.json({ error: "Write some content first." }, { status: 400 })
        prompt = `Improve and polish the following news article body. Fix grammar, clarity, flow and structure while preserving the facts and meaning. Keep it professional and readable for a Nigerian agricultural audience.

Return ONLY the improved body as clean semantic HTML (<p>, <h2>, <h3>, <ul>, <li>, <strong>). No code fences or commentary.

Current article:
${content}`
        break
      case "excerpt":
        if (!plainContent) return Response.json({ error: "Write some content first." }, { status: 400 })
        prompt = `Write a single compelling excerpt (one to two sentences, max 220 characters) that summarises this article for a news card. Return ONLY the excerpt text, no quotes or labels.

Title: ${title}
Article: ${plainContent.slice(0, 4000)}`
        break
      case "tags":
        if (!plainContent && !title)
          return Response.json({ error: "Add a title or content first." }, { status: 400 })
        prompt = `Suggest 5 to 7 concise, relevant tags for this agricultural news article. Return ONLY a comma-separated list of lowercase tags, no other text.

Title: ${title}
Article: ${plainContent.slice(0, 3000)}`
        break
      case "translate": {
        const lang = body.language
        if (!lang || !SUPPORTED_LANGUAGES[lang])
          return Response.json({ error: "Choose a valid language." }, { status: 400 })
        if (!plainContent) return Response.json({ error: "Write some content first." }, { status: 400 })
        prompt = `Translate the following news article body into ${SUPPORTED_LANGUAGES[lang]}. Preserve the HTML structure and tags exactly; only translate the human-readable text. Keep proper nouns like GreenV1n3 and V1N3 unchanged. Return ONLY the translated HTML, no commentary.

${content}`
        break
      }
      default:
        return Response.json({ error: "Unknown action." }, { status: 400 })
    }

    const { text, usage } = await generateText({
      model: config.model,
      system: NEWS_AI_SYSTEM,
      prompt,
      temperature: action === "translate" ? 0.2 : config.temperature,
      maxOutputTokens: config.max_output_tokens,
    })

    await logAiUsage({
      userId: user.id,
      feature: `news_${action}`,
      model: config.model,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
    })

    // Clean any stray code fences the model may add.
    const cleaned = text
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim()

    return Response.json({ result: cleaned })
  } catch (err) {
    if (err instanceof AiDisabledError) {
      return Response.json({ error: err.message }, { status: 403 })
    }
    console.log("[v0] news AI route error:", (err as Error).message)
    return Response.json({ error: "AI request failed. Please try again." }, { status: 500 })
  }
}
