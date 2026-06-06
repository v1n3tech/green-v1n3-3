import { getAiConfig } from "@/lib/ai/config"
import { SupportWidget } from "@/components/ai/support-widget"

/**
 * Server gate: only render the floating support assistant when both the AI
 * suite and the support bot are enabled by an administrator.
 */
export async function SupportWidgetGate() {
  const config = await getAiConfig()
  if (!config.ai_enabled || !config.support_bot_enabled) return null
  return <SupportWidget />
}
