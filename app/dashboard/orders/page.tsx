import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ngnToV1n3 } from "@/lib/marketplace/types"
import { BuyerFulfillment } from "@/components/dashboard/orders/buyer-fulfillment"
import { SellerRequestDelivery } from "@/components/dashboard/orders/seller-delivery"

const STATUS_LABELS: Record<string, string> = {
  awaiting_choice: "Awaiting your choice",
  awaiting_pickup: "Awaiting pickup",
  delivery_paid: "Delivery paid",
  pending: "Pending",
}

function firstOf<T>(v: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(v)) return v[0]
  return v ?? undefined
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/auth/login")

  const { data: asBuyer } = await supabase
    .from("marketplace_orders")
    .select(
      `
      id, product_id, product_title, total_price, v1n3_amount, fulfillment_method, fulfillment_status, created_at,
      terminal:terminal_id(name, lga, state),
      product:product_id(offers_delivery, pickup_available, delivery_fee),
      delivery_request:delivery_requests(status, scheduled_delivery_at),
      seller:seller_id(display_name)
    `,
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const { data: asSeller } = await supabase
    .from("marketplace_orders")
    .select(
      `
      id, product_title, total_price, v1n3_amount, fulfillment_method, fulfillment_status, created_at,
      delivery_address, delivery_state, delivery_lga, delivery_contact_phone,
      delivery_request:delivery_requests(status, scheduled_delivery_at),
      buyer:buyer_id(display_name)
    `,
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const { data: terminals } = await supabase
    .from("marketplace_terminals")
    .select("id, name, state, lga, address")
    .eq("is_active", true)
    .order("name")

  const activeTerminals = terminals ?? []

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <h1 className="mono-lg text-foreground uppercase">Orders</h1>

      {/* PURCHASES */}
      <section className="space-y-4">
        <h2 className="mono-sm text-xs text-muted-foreground uppercase tracking-wider">Purchases</h2>
        {asBuyer && asBuyer.length > 0 ? (
          <div className="space-y-3">
            {asBuyer.map((order: any) => {
              const product = firstOf<any>(order.product)
              const terminal = firstOf<any>(order.terminal)
              const dr = firstOf<any>(order.delivery_request)
              const feeNgn = Number(product?.delivery_fee ?? 0)
              return (
                <div key={order.id} className="p-4 border border-border rounded-[2px] bg-secondary/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="mono-xs text-[11px] text-foreground">{order.product_title}</p>
                      <p className="mono-xs text-[10px] text-muted-foreground mt-1">
                        {Number(order.v1n3_amount).toLocaleString(undefined, { maximumFractionDigits: 4 })} V1N3 ·{" "}
                        {firstOf<any>(order.seller)?.display_name ?? "Seller"}
                      </p>
                    </div>
                    <span className="mono-xs text-[8px] text-muted-foreground uppercase shrink-0">
                      {order.fulfillment_method
                        ? order.fulfillment_method
                        : STATUS_LABELS[order.fulfillment_status] ?? order.fulfillment_status}
                    </span>
                  </div>

                  {/* Chosen state */}
                  {order.fulfillment_method === "pickup" && terminal && (
                    <p className="mono-xs text-[10px] text-muted-foreground mt-2">
                      Collect at <span className="text-foreground">{terminal.name}</span> — {terminal.lga}, {terminal.state}
                    </p>
                  )}
                  {order.fulfillment_method === "delivery" && (
                    <p className="mono-xs text-[10px] text-muted-foreground mt-2">
                      {dr?.status === "scheduled" && dr?.scheduled_delivery_at
                        ? `Scheduled for ${new Date(dr.scheduled_delivery_at).toLocaleString()}`
                        : dr?.status
                          ? `Courier status: ${dr.status}`
                          : "Awaiting seller to dispatch a courier"}
                    </p>
                  )}

                  {/* Buyer must choose */}
                  {!order.fulfillment_method && (
                    <BuyerFulfillment
                      orderId={order.id}
                      offersDelivery={Boolean(product?.offers_delivery)}
                      pickupAvailable={product?.pickup_available !== false}
                      deliveryFeeNgn={feeNgn}
                      deliveryFeeV1n3={ngnToV1n3(feeNgn)}
                      terminals={activeTerminals}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No purchases yet.</p>
        )}
      </section>

      {/* SALES */}
      <section className="space-y-4">
        <h2 className="mono-sm text-xs text-muted-foreground uppercase tracking-wider">Sales</h2>
        {asSeller && asSeller.length > 0 ? (
          <div className="space-y-3">
            {asSeller.map((order: any) => {
              const dr = firstOf<any>(order.delivery_request)
              const needsCourier = order.fulfillment_method === "delivery" && !dr
              return (
                <div key={order.id} className="p-4 border border-border rounded-[2px] bg-secondary/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="mono-xs text-[11px] text-foreground">{order.product_title}</p>
                      <p className="mono-xs text-[10px] text-muted-foreground mt-1">
                        {Number(order.v1n3_amount).toLocaleString(undefined, { maximumFractionDigits: 4 })} V1N3 ·{" "}
                        {firstOf<any>(order.buyer)?.display_name ?? "Buyer"}
                      </p>
                    </div>
                    <span className="mono-xs text-[8px] text-muted-foreground uppercase shrink-0">
                      {order.fulfillment_method
                        ? order.fulfillment_method
                        : STATUS_LABELS[order.fulfillment_status] ?? order.fulfillment_status}
                    </span>
                  </div>

                  {order.fulfillment_method === "pickup" && (
                    <p className="mono-xs text-[10px] text-muted-foreground mt-2">
                      Buyer will collect at terminal. Drop the item off when ready.
                    </p>
                  )}

                  {needsCourier && (
                    <SellerRequestDelivery
                      orderId={order.id}
                      deliveryAddress={order.delivery_address ?? ""}
                      deliveryState={order.delivery_state ?? ""}
                      deliveryLga={order.delivery_lga ?? ""}
                      deliveryPhone={order.delivery_contact_phone ?? ""}
                    />
                  )}

                  {order.fulfillment_method === "delivery" && dr && (
                    <p className="mono-xs text-[10px] text-muted-foreground mt-2">
                      Courier {dr.status}
                      {dr.scheduled_delivery_at
                        ? ` · scheduled ${new Date(dr.scheduled_delivery_at).toLocaleString()}`
                        : ""}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No sales yet.</p>
        )}
      </section>
    </div>
  )
}
