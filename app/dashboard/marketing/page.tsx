import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Megaphone, Receipt, Clock, Truck, Building2, ShieldCheck } from "lucide-react"
import { fetchTerminals } from "@/lib/fulfillment/terminals"
import {
  getTerminalAccess,
  fetchMarketingExecutives,
  fetchTerminalManagers,
} from "@/lib/fulfillment/terminal-managers"
import { TerminalsList } from "@/components/dashboard/terminals/terminals-list"
import { TerminalManagersPanel } from "@/components/dashboard/terminals/terminal-managers-panel"
import { OrdersList } from "@/components/dashboard/marketing/orders-list"
import { PageHeading, StatsBar, type StatDef } from "@/components/dashboard/fulfillment/chrome"

export default async function AgroMarketingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/auth/login")

  // Verify user is in agro_marketing community
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, community, secondary_communities")
    .eq("id", user.id)
    .single()

  const isMarketing =
    profile?.community === "agro_marketing" ||
    (profile?.secondary_communities ?? []).includes("agro_marketing") ||
    profile?.role === "admin"

  if (!isMarketing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="rounded-[2px] border border-dashed border-border bg-secondary/20 px-6 py-10 text-center">
          <p className="mono-xs text-[10px] text-muted-foreground">Access denied. You must be part of Agro Marketing.</p>
        </div>
      </div>
    )
  }

  const canManageTerminals = profile?.role === "gcm" || profile?.role === "admin"

  // Fetch orders and terminals
  const { data: orders } = await supabase
    .from("marketplace_orders")
    .select(`
      id, product_title, total_price, v1n3_amount, fulfillment_method,
      fulfillment_status, created_at, buyer:buyer_id(display_name),
      seller:seller_id(display_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  const { terminals } = await fetchTerminals(false) // Include inactive

  const { canAppoint } = await getTerminalAccess()
  const executives = canAppoint ? (await fetchMarketingExecutives()).executives : []
  const managers = canAppoint ? (await fetchTerminalManagers()).managers : []

  const orderList = orders ?? []
  const awaitingChoice = orderList.filter((o: any) => o.fulfillment_status === "awaiting_choice").length
  const inDelivery = orderList.filter((o: any) => o.fulfillment_method === "delivery").length
  const activeTerminals = terminals.filter((t) => t.is_active).length

  const stats: StatDef[] = [
    { icon: <Receipt className="h-3.5 w-3.5" />, label: "ORDERS", value: orderList.length },
    { icon: <Clock className="h-3.5 w-3.5" />, label: "AWAITING CHOICE", value: awaitingChoice, tone: "orange" },
    { icon: <Truck className="h-3.5 w-3.5" />, label: "IN DELIVERY", value: inDelivery, tone: "accent" },
    { icon: <Building2 className="h-3.5 w-3.5" />, label: "ACTIVE TERMINALS", value: activeTerminals, tone: "primary" },
  ]

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        icon={<Megaphone className="h-4 w-4" />}
        title="Agro Marketing"
        subtitle="Monitor marketplace activity and operate pickup terminals."
      />

      <StatsBar stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5 text-primary" />
            <h2 className="mono-sm text-xs text-muted-foreground">Marketplace Orders</h2>
          </div>
          <OrdersList orders={orderList} />
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <h2 className="mono-sm text-xs text-muted-foreground">Terminals</h2>
            </div>
            <TerminalsList terminals={terminals} canManage={canManageTerminals} />
          </div>

          {canAppoint && (
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <h2 className="mono-sm text-xs text-muted-foreground">Terminal Managers</h2>
              </div>
              <TerminalManagersPanel executives={executives} managers={managers} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
