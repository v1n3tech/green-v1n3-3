import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { COMMUNITIES } from "@/components/onboarding/data"
import { Sparkles, Sprout, Wallet, MapPin, Activity } from "lucide-react"

export const metadata = {
  title: "Dashboard — GreenV1n3",
  description: "Your AgroV1n3 command center.",
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, display_name, agro_id, role, community, lga, wallet_address, weekly_rating, operational_rating, total_earnings, v1n3_balance",
    )
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

  const community = COMMUNITIES.find((c) => c.key === profile.community)
  const isExecutive = profile.role === "agro_executive"

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.display_name ||
    "AGRO EXECUTIVE"

  return (
    <div className="bg-background min-h-screen">
      <Header />

      <main className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="absolute inset-0 grid-pattern pointer-events-none -z-10" />

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-primary" />
            <span className="mono-xs text-primary text-[10px] tracking-wider">
              / 01 — DASHBOARD
            </span>
          </div>
          <span className="mono-xs text-muted-foreground text-[10px] tracking-wider hidden sm:inline">
            {profile.display_name ?? "ANON"}
          </span>
        </div>

        {/* Welcome */}
        <div className="mb-8 sm:mb-10">
          <h1 className="font-mono text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight text-balance">
            <span className="text-foreground">Welcome back,</span>
            <br />
            <span className="text-primary">{fullName}.</span>
          </h1>
          <p className="mt-4 text-foreground/55 max-w-lg text-sm sm:text-base leading-relaxed">
            Your field is live. Track your ratings, manage your wallet, and engage with the
            network across the agriculture value chain.
          </p>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatTile
            index="01"
            label="AGRO ID"
            value={profile.agro_id ?? "—"}
            mono
            icon={<Sparkles className="w-3.5 h-3.5" />}
          />
          <StatTile
            index="02"
            label="ROLE"
            value={isExecutive ? "EXECUTIVE" : "EXPLORER"}
            icon={<Activity className="w-3.5 h-3.5" />}
            accent
          />
          <StatTile
            index="03"
            label="COMMUNITY"
            value={community?.label ?? "—"}
            icon={<Sprout className="w-3.5 h-3.5" />}
          />
          <StatTile
            index="04"
            label="LOCATION"
            value={profile.lga ? `PLATEAU / ${profile.lga.toUpperCase()}` : "—"}
            icon={<MapPin className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Two-column section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Wallet — V1n3 balance + fiat earnings + on-chain address */}
          <div className="lg:col-span-1 bg-background border border-border rounded-[2px] overflow-hidden">
            <div className="border-b border-border px-4 h-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="status-dot status-dot-pulse" />
                <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.18em]">
                  / WALLET
                </span>
              </div>
              <span className="mono-xs text-primary text-[9px] tracking-wider">
                SOLANA
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="mono-xs text-muted-foreground/70 text-[9px] mb-1.5 tracking-[0.18em]">
                  / V1N3 BALANCE
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl text-foreground tracking-tight">
                    {Number(profile.v1n3_balance ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: Number(profile.v1n3_balance ?? 0) < 1 ? 4 : 2,
                      maximumFractionDigits: 4,
                    })}
                  </span>
                  <span className="mono-xs text-primary/80 text-[10px] tracking-[0.2em]">
                    V1N3
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                <span className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.18em]">
                  / EARNINGS
                </span>
                <span className="font-mono text-foreground/85 text-[12px] tracking-wider whitespace-nowrap">
                  N{Number(profile.total_earnings ?? 0).toLocaleString()}
                </span>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="mono-xs text-muted-foreground/70 text-[9px] mb-1.5 tracking-[0.18em]">
                  / ADDRESS
                </p>
                <p className="font-mono text-[11px] text-foreground/85 tracking-wider truncate">
                  {profile.wallet_address
                    ? `${profile.wallet_address.slice(0, 6)}…${profile.wallet_address.slice(-6)}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Ratings */}
          <div className="lg:col-span-2 bg-background border border-border rounded-[2px] overflow-hidden">
            <div className="border-b border-border px-4 h-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-muted-foreground" />
                <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.18em]">
                  / RATINGS
                </span>
              </div>
              <span className="mono-xs text-muted-foreground/60 text-[9px] tracking-wider">
                WEEKLY CYCLE
              </span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RatingTile
                label="WEEKLY RATING"
                value={Number(profile.weekly_rating ?? 0)}
              />
              <RatingTile
                label="OPERATIONAL"
                value={Number(profile.operational_rating ?? 0)}
              />
            </div>
          </div>
        </div>

        {/* Empty-state hint */}
        <div className="mt-8 px-4 py-3 border border-border rounded-[2px] flex items-center gap-3">
          <Wallet className="w-4 h-4 text-primary shrink-0" />
          <p className="mono-xs text-foreground/70 text-[10px] tracking-wider leading-relaxed">
            / FIELD MODULES COMING ONLINE — SHOP, INVESTORS, MEDIA, AND TRAINING
            WILL APPEAR HERE.
          </p>
        </div>
      </main>
    </div>
  )
}

function StatTile({
  index,
  label,
  value,
  icon,
  mono,
  accent,
}: {
  index: string
  label: string
  value: string
  icon: React.ReactNode
  mono?: boolean
  accent?: boolean
}) {
  return (
    <div className="bg-background border border-border rounded-[2px] p-3.5">
      <div className="flex items-center justify-between mb-3">
        <span className="mono-xs text-muted-foreground/60 text-[9px] tracking-wider">
          {index}
        </span>
        <span className={accent ? "text-accent" : "text-primary/70"}>
          {icon}
        </span>
      </div>
      <p className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.2em] mb-1.5">
        / {label}
      </p>
      <p
        className={`text-foreground tracking-wider truncate ${mono ? "font-mono text-[14px]" : "mono-sm text-[12px]"}`}
      >
        {value}
      </p>
    </div>
  )
}

function RatingTile({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="border border-border rounded-[2px] p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.18em]">
          / {label}
        </span>
        <span className="font-mono text-primary text-[12px] tracking-wider">
          {pct.toFixed(1)}
        </span>
      </div>
      <div className="h-[3px] bg-border rounded-[2px] overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
