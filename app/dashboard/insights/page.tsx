import { Sparkles, Power, ShieldCheck, TrendingUp, TrendingDown, Minus, Info } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getAiConfig } from "@/lib/ai/config"
import { getReliabilityScore, getDemandForecast, SUPPORTED_YIELD_CROPS } from "@/lib/ai/insights"
import { YieldEstimator } from "@/components/ai/yield-estimator"

export const metadata = {
  title: "Insights (Beta) | GreenV1n3 Dashboard",
  description: "Predictive decision-support: reliability score, demand trends and yield estimates from real data.",
}

export default async function InsightsPage() {
  const config = await getAiConfig()
  const enabled = config.ai_enabled && config.predictive_enabled

  if (!enabled) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-[2px] border border-border bg-card/40 p-10 text-center">
          <Power className="mb-3 size-8 text-muted-foreground" />
          <h1 className="text-lg font-medium text-foreground">Insights are currently offline</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            An administrator has turned off the predictive tools. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let community: string | null = null
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("community").eq("id", user.id).single()
    community = profile?.community ?? null
  }

  const [reliability, demand] = await Promise.all([
    user
      ? getReliabilityScore(user.id)
      : Promise.resolve(null),
    getDemandForecast(community),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ AI — PREDICTIVE INSIGHTS</span>
        </div>
        <span className="mono-xs text-accent text-[8px] tracking-[0.2em] border border-accent/30 px-1.5 py-0.5 rounded-[2px]">
          BETA
        </span>
      </div>

      <div>
        <h1 className="font-mono text-2xl sm:text-3xl leading-tight tracking-tight text-balance text-foreground">
          Decision <span className="text-primary">support.</span>
        </h1>
        <p className="mt-3 text-foreground/55 max-w-xl text-sm leading-relaxed">
          Early-stage analytics computed from your real platform activity, marketplace order flow and live
          climate data. Indicators are advisory — not guarantees or financial decisions.
        </p>
      </div>

      {/* Reliability + Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {reliability && (
          <div className="lg:col-span-1 bg-background border border-border rounded-[2px] overflow-hidden">
            <div className="border-b border-border px-4 h-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.18em]">
                  / RELIABILITY
                </span>
              </div>
              <span className="mono-xs text-primary text-[9px] tracking-wider">{reliability.band.toUpperCase()}</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-4xl text-foreground tracking-tight">{reliability.score}</span>
                <span className="mono-xs text-primary/80 text-[11px]">/ 100</span>
              </div>
              <div className="h-[3px] bg-border rounded-[2px] overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${reliability.score}%` }} />
              </div>
              <div className="space-y-2 pt-1">
                {reliability.factors.map((f) => (
                  <div key={f.label} className="flex items-center justify-between gap-2">
                    <span className="mono-xs text-[9px] text-muted-foreground/70 tracking-wider">
                      {f.label.toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] text-foreground/85">{f.value}</span>
                  </div>
                ))}
              </div>
              {reliability.summary && (
                <p className="text-[12px] leading-relaxed text-foreground/80 pt-3 border-t border-border">
                  {reliability.summary}
                </p>
              )}
              <p className="mono-xs text-[8px] text-muted-foreground/50 tracking-wider flex items-start gap-1">
                <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                ADVISORY INDICATOR ONLY — NOT A LOAN OR CREDIT DECISION.
              </p>
            </div>
          </div>
        )}

        {/* Demand */}
        <div className="lg:col-span-2 bg-background border border-border rounded-[2px] overflow-hidden">
          <div className="border-b border-border px-4 h-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.18em]">/ DEMAND TRENDS</span>
            </div>
            <span className="mono-xs text-muted-foreground/60 text-[9px] tracking-wider">
              {demand.windowDays}D · {community ? community.toUpperCase() : "ALL"}
            </span>
          </div>
          <div className="p-4">
            {demand.trends.length === 0 ? (
              <p className="mono-xs text-[10px] text-muted-foreground/60 tracking-wider py-6 text-center">
                NOT ENOUGH ORDER DATA YET TO READ DEMAND.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {demand.trends.map((t) => {
                    const up = (t.changePct ?? 0) > 0
                    const flat = (t.changePct ?? 0) === 0
                    return (
                      <div
                        key={t.product}
                        className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] text-foreground truncate">{t.product}</p>
                          <p className="mono-xs text-[9px] text-muted-foreground/60 tracking-wider">
                            {t.recentOrders} ORDERS · QTY {t.totalQuantity}
                          </p>
                        </div>
                        <span
                          className={`mono-xs text-[10px] tracking-wider flex items-center gap-1 ${
                            flat ? "text-muted-foreground/60" : up ? "text-primary" : "text-accent"
                          }`}
                        >
                          {flat ? (
                            <Minus className="w-3 h-3" />
                          ) : up ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {up ? "+" : ""}
                          {t.changePct}%
                        </span>
                      </div>
                    )
                  })}
                </div>
                {demand.summary && (
                  <p className="text-[12px] leading-relaxed text-foreground/80 mt-3 pt-3 border-t border-border">
                    <Sparkles className="inline w-3 h-3 text-primary mr-1 -mt-0.5" />
                    {demand.summary}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Yield estimator */}
      <YieldEstimator crops={SUPPORTED_YIELD_CROPS} />

      <p className="mono-xs text-[8px] text-muted-foreground/50 tracking-wider leading-relaxed">
        {config.disclaimer.toUpperCase()}
      </p>
    </div>
  )
}
