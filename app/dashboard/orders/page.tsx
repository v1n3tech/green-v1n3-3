import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/auth/login")

  // Buyer: orders they purchased
  // Seller: orders they received
  const { data: asBuyer } = await supabase
    .from("marketplace_orders")
    .select(
      `
      id, product_title, total_price, currency, v1n3_amount, fulfillment_method,
      fulfillment_status, created_at, seller:seller_id(display_name)
    `
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const { data: asSeller } = await supabase
    .from("marketplace_orders")
    .select(
      `
      id, product_title, total_price, currency, v1n3_amount, fulfillment_method,
      fulfillment_status, created_at, buyer:buyer_id(display_name)
    `
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="p-6 space-y-8">
      <h1 className="mono-lg text-foreground uppercase">Orders</h1>

      <div className="space-y-4">
        <h2 className="mono-sm text-xs text-muted-foreground uppercase">Purchases</h2>
        {asBuyer && asBuyer.length > 0 ? (
          <div className="space-y-2">
            {asBuyer.map((order: any) => (
              <div key={order.id} className="p-3 border border-border rounded-[2px] bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="mono-xs text-[10px] text-foreground">{order.product_title}</p>
                  <span className="mono-xs text-[8px] text-muted-foreground">
                    {order.fulfillment_method?.toUpperCase()}
                  </span>
                </div>
                <p className="mono-xs text-[10px] text-muted-foreground">
                  {order.v1n3_amount} V1N3 · {order.fulfillment_status}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No purchases yet.</p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="mono-sm text-xs text-muted-foreground uppercase">Sales</h2>
        {asSeller && asSeller.length > 0 ? (
          <div className="space-y-2">
            {asSeller.map((order: any) => (
              <div key={order.id} className="p-3 border border-border rounded-[2px] bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="mono-xs text-[10px] text-foreground">{order.product_title}</p>
                  <span className="mono-xs text-[8px] text-muted-foreground">
                    {order.fulfillment_method?.toUpperCase()}
                  </span>
                </div>
                <p className="mono-xs text-[10px] text-muted-foreground">
                  {order.v1n3_amount} V1N3 · {order.fulfillment_status}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No sales yet.</p>
        )}
      </div>
    </div>
  )
}
