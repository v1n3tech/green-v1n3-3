import { Sparkles, Power } from "lucide-react"
import { getAiConfig } from "@/lib/ai/config"
import { AdvisorChat } from "@/components/ai/advisor-chat"

export const metadata = {
  title: "AI Advisor | GreenV1n3 Dashboard",
  description: "Ask the GreenV1n3 Farmer Advisor about crops, weather and prices — grounded in real data.",
}

export default async function AdvisorPage() {
  const config = await getAiConfig()
  const enabled = config.ai_enabled && config.advisory_enabled

  if (!enabled) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-[2px] border border-border bg-card/40 p-10 text-center">
          <Power className="mb-3 size-8 text-muted-foreground" />
          <h1 className="text-lg font-medium text-foreground">Advisor is currently offline</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            An administrator has turned off the AI Advisor. Please check back later or contact your GCM for help.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4">
        <p className="mono-xs mb-1 flex items-center gap-1.5 text-primary">
          <Sparkles className="size-3.5" />
          {"// AI ADVISOR"}
        </p>
        <h1 className="text-balance text-2xl font-medium tracking-tight text-foreground">Farmer Advisor</h1>
      </div>
      <AdvisorChat disclaimer={config.disclaimer} />
    </div>
  )
}
