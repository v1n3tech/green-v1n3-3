import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { fetchTerminals } from "@/lib/fulfillment/terminals"
import { TerminalsList } from "@/components/dashboard/terminals/terminals-list"
import { OrdersList } from "@/components/dashboard/marketing/orders-list"

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
      <div className="p-6">
        <p className="text-muted-foreground">Access denied. You must be part of Agro Marketing.</p>
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

  return (
    <div className="p-6 space-y-8">
      <h1 className="mono-lg text-foreground uppercase">Agro Marketing</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mono-sm text-xs text-muted-foreground uppercase mb-4">Marketplace Orders</h2>
          <OrdersList orders={orders || []} />
        </div>

        <div>
          <h2 className="mono-sm text-xs text-muted-foreground uppercase mb-4">Terminals</h2>
          <TerminalsList terminals={terminals} canManage={canManageTerminals} />
        </div>
      </div>
    </div>
  )
}
