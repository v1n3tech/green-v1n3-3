import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Receipt } from "lucide-react"
import { PageHeading } from "@/components/dashboard/fulfillment/chrome"
import { OrdersView } from "@/components/dashboard/orders/orders-view"

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

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeading
        icon={<Receipt className="h-4 w-4" />}
        title="Orders"
        subtitle="Track your purchases and manage fulfillment for your sales."
      />
      <OrdersView purchases={asBuyer ?? []} sales={asSeller ?? []} terminals={terminals ?? []} />
    </div>
  )
}
