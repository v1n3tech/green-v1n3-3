import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Building2, MapPin, Power, Globe2, PackageCheck, ShieldCheck } from "lucide-react"
import { fetchTerminals } from "@/lib/fulfillment/terminals"
import {
  getTerminalAccess,
  fetchPickupOrders,
  fetchMarketingExecutives,
  fetchTerminalManagers,
} from "@/lib/fulfillment/terminal-managers"
import { TerminalsList } from "@/components/dashboard/terminals/terminals-list"
import { PickupConfirmations } from "@/components/dashboard/terminals/pickup-confirmations"
import { TerminalManagersPanel } from "@/components/dashboard/terminals/terminal-managers-panel"
import { PageHeading, StatsBar, type StatDef } from "@/components/dashboard/fulfillment/chrome"

export const metadata = {
  title: "Terminals — Dashboard — GreenV1n3",
  description: "Operate marketplace pickup terminals and confirm collected orders.",
}

export default async function TerminalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/auth/login")

  const { isManager, canAppoint } = await getTerminalAccess()

  // Access is granted to appointed terminal managers and to appointers
  // (Marketing GCM + admins).
  if (!isManager) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="rounded-[2px] border border-dashed border-border bg-secondary/20 px-6 py-10 text-center">
          <p className="mono-xs text-[10px] text-muted-foreground">
            Access denied. The terminal dashboard is restricted to terminal managers.
          </p>
        </div>
      </div>
    )
  }

  const [{ terminals }, { orders }] = await Promise.all([
    fetchTerminals(false), // include inactive
    fetchPickupOrders(),
  ])

  const activeCount = terminals.filter((t) => t.is_active).length
  const statesCovered = new Set(terminals.map((t) => t.state).filter(Boolean)).size
  const awaitingPickup = orders.filter((o) => o.fulfillment_status !== "collected").length

  const stats: StatDef[] = [
    { icon: <PackageCheck className="h-3.5 w-3.5" />, label: "AWAITING PICKUP", value: awaitingPickup, tone: "orange" },
    { icon: <Power className="h-3.5 w-3.5" />, label: "ACTIVE TERMINALS", value: activeCount, tone: "primary" },
    { icon: <Building2 className="h-3.5 w-3.5" />, label: "TOTAL TERMINALS", value: terminals.length },
    { icon: <Globe2 className="h-3.5 w-3.5" />, label: "STATES COVERED", value: statesCovered, tone: "accent" },
  ]

  // Appointers also get the management panels.
  const executives = canAppoint ? (await fetchMarketingExecutives()).executives : []
  const managers = canAppoint ? (await fetchTerminalManagers()).managers : []

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeading
        icon={<MapPin className="h-4 w-4" />}
        title="Terminals"
        subtitle="Confirm collected pickups and operate marketplace terminals."
      />

      <StatsBar stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-3.5 w-3.5 text-primary" />
            <h2 className="mono-sm text-xs text-muted-foreground">Pickup Confirmations</h2>
          </div>
          <div className="rounded-[2px] border border-border bg-secondary/20 p-5">
            <PickupConfirmations orders={orders} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <h2 className="mono-sm text-xs text-muted-foreground">Terminals</h2>
            </div>
            <div className="rounded-[2px] border border-border bg-secondary/20 p-5">
              <TerminalsList terminals={terminals} canManage={canAppoint} />
            </div>
          </div>

          {canAppoint && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <h2 className="mono-sm text-xs text-muted-foreground">Terminal Managers</h2>
              </div>
              <div className="rounded-[2px] border border-border bg-secondary/20 p-5">
                <TerminalManagersPanel executives={executives} managers={managers} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
