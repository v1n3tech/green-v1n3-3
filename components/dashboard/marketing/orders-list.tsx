"use client"

import { Package, Store, Truck, ArrowRight } from "lucide-react"
import { StatusPill } from "@/components/dashboard/fulfillment/chrome"

interface OrdersListProps {
  orders: any[]
}

export function OrdersList({ orders }: OrdersListProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[2px] border border-dashed border-border bg-secondary/20 py-12 text-muted-foreground">
        <Package className="h-5 w-5" />
        <p className="mono-xs text-[10px]">No orders yet.</p>
      </div>
    )
  }

  return (
    <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-[2px] border border-border bg-secondary/30 p-3 transition-colors hover:border-primary/30"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border border-border bg-background text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] text-foreground">{order.product_title}</p>
                <p className="mono-xs mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                  {order.buyer?.display_name ?? "Buyer"}
                  <ArrowRight className="h-2.5 w-2.5" />
                  {order.seller?.display_name ?? "Seller"}
                </p>
              </div>
            </div>
            {order.fulfillment_method ? (
              <span className="mono-xs inline-flex shrink-0 items-center gap-1 text-[8px] text-primary">
                {order.fulfillment_method === "delivery" ? (
                  <Truck className="h-2.5 w-2.5" />
                ) : (
                  <Store className="h-2.5 w-2.5" />
                )}
                {order.fulfillment_method.toUpperCase()}
              </span>
            ) : (
              <span className="mono-xs shrink-0 text-[8px] text-orange">PENDING CHOICE</span>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-2">
            <p className="mono-xs text-[9px] text-muted-foreground">
              {Number(order.v1n3_amount).toLocaleString(undefined, { maximumFractionDigits: 4 })} V1N3
            </p>
            <StatusPill status={order.fulfillment_status} />
          </div>
        </div>
      ))}
    </div>
  )
}
