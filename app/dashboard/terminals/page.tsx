import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Building2, MapPin, Power, Globe2 } from "lucide-react"
import { fetchTerminals } from "@/lib/fulfillment/terminals"
import { TerminalsList } from "@/components/dashboard/terminals/terminals-list"
import { PageHeading, StatsBar, type StatDef } from "@/components/dashboard/fulfillment/chrome"

export const metadata = {
  title: "Terminals — Dashboard — GreenV1n3",
  description: "Manage marketplace pickup terminals.",
}

export default async function TerminalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  // Admin-only for now; expansion to logistics GCMs can be added later.
  if (profile?.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="rounded-[2px] border border-dashed border-border bg-secondary/20 px-6 py-10 text-center">
          <p className="mono-xs text-[10px] text-muted-foreground">
            Access denied. Terminal management is restricted to administrators.
          </p>
        </div>
      </div>
    )
  }

  const { terminals } = await fetchTerminals(false) // include inactive

  const activeCount = terminals.filter((t) => t.is_active).length
  const statesCovered = new Set(terminals.map((t) => t.state).filter(Boolean)).size

  const stats: StatDef[] = [
    { icon: <Building2 className="h-3.5 w-3.5" />, label: "TOTAL TERMINALS", value: terminals.length },
    { icon: <Power className="h-3.5 w-3.5" />, label: "ACTIVE", value: activeCount, tone: "primary" },
    { icon: <Power className="h-3.5 w-3.5" />, label: "DISABLED", value: terminals.length - activeCount, tone: "orange" },
    { icon: <Globe2 className="h-3.5 w-3.5" />, label: "STATES COVERED", value: statesCovered, tone: "accent" },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeading
        icon={<MapPin className="h-4 w-4" />}
        title="Terminals"
        subtitle="Create and manage the pickup terminals available across the marketplace."
      />

      <StatsBar stats={stats} />

      <div className="rounded-[2px] border border-border bg-secondary/20 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <h2 className="mono-sm text-xs text-muted-foreground">All Terminals</h2>
        </div>
        <TerminalsList terminals={terminals} canManage />
      </div>
    </div>
  )
}
