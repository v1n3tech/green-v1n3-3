"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Package, ShoppingBag, Store, Truck, Clock, MapPin, Phone, CalendarClock } from "lucide-react"
import { StatsBar, StatusPill, type StatDef } from "@/components/dashboard/fulfillment/chrome"
import { BuyerFulfillment } from "@/components/dashboard/orders/buyer-fulfillment"
import { SellerRequestDelivery } from "@/components/dashboard/orders/seller-delivery"
import { ngnToV1n3 } from "@/lib/marketplace/types"

type Tab = "purchases" | "sales"

interface TerminalLite {
  id: string
  name: string
  state: string
  lga: string
  address: string
}

interface OrdersViewProps {
  purchases: any[]
  sales: any[]
  terminals: TerminalLite[]
}

function firstOf<T>(v: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(v)) return v[0]
  return v ?? undefined
}

function formatV1n3(v: number) {
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 4 })
}

export function OrdersView({ purchases, sales, terminals }: OrdersViewProps) {
  const [tab, setTab] = useState<Tab>("purchases")

  const awaitingChoice = purchases.filter((o) => !o.fulfillment_method).length
  const inDelivery = [...purchases, ...sales].filter((o) => o.fulfillment_method === "delivery").length

  const stats: StatDef[] = [
    { icon: <ShoppingBag className="h-3.5 w-3.5" />, label: "PURCHASES", value: purchases.length },
    { icon: <Store className="h-3.5 w-3.5" />, label: "SALES", value: sales.length, tone: "accent" },
    { icon: <Clock className="h-3.5 w-3.5" />, label: "ACTION NEEDED", value: awaitingChoice, tone: "orange" },
    { icon: <Truck className="h-3.5 w-3.5" />, label: "IN DELIVERY", value: inDelivery, tone: "primary" },
  ]

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "purchases", label: "PURCHASES", count: purchases.length },
    { key: "sales", label: "SALES", count: sales.length },
  ]

  return (
    <div className="space-y-6">
      <StatsBar stats={stats} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2.5 mono-xs text-[10px] tracking-wider transition-colors ${
              tab === t.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {t.label}
              {t.count > 0 && (
                <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[8px] text-muted-foreground">
                  {t.count}
                </span>
              )}
            </span>
            {tab === t.key && <motion.div layoutId="orders-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {tab === "purchases" && (
        <div className="space-y-3">
          {purchases.length === 0 ? (
            <EmptyState icon={<ShoppingBag className="h-5 w-5" />} text="No purchases yet." />
          ) : (
            purchases.map((order, i) => {
              const product = firstOf<any>(order.product)
              const terminal = firstOf<any>(order.terminal)
              const dr = firstOf<any>(order.delivery_request)
              const feeNgn = Number(product?.delivery_fee ?? 0)
              return (
                <OrderCard key={order.id} index={i}>
                  <CardHeader
                    title={order.product_title}
                    counterparty={firstOf<any>(order.seller)?.display_name ?? "Seller"}
                    counterpartyLabel="from"
                    v1n3={order.v1n3_amount}
                    method={order.fulfillment_method}
                    status={order.fulfillment_status}
                  />

                  {order.fulfillment_method === "pickup" && terminal && (
                    <DetailRow icon={<MapPin className="h-3 w-3" />}>
                      Collect at <span className="text-foreground">{terminal.name}</span> — {terminal.lga}, {terminal.state}
                    </DetailRow>
                  )}
                  {order.fulfillment_method === "delivery" && (
                    <DetailRow icon={<Truck className="h-3 w-3" />}>
                      {dr?.status === "scheduled" && dr?.scheduled_delivery_at
                        ? `Scheduled for ${new Date(dr.scheduled_delivery_at).toLocaleString()}`
                        : dr?.status
                          ? `Courier status: ${dr.status}`
                          : "Awaiting seller to dispatch a courier"}
                    </DetailRow>
                  )}

                  {!order.fulfillment_method && (
                    <BuyerFulfillment
                      orderId={order.id}
                      offersDelivery={Boolean(product?.offers_delivery)}
                      pickupAvailable={product?.pickup_available !== false}
                      deliveryFeeNgn={feeNgn}
                      deliveryFeeV1n3={ngnToV1n3(feeNgn)}
                      terminals={terminals}
                    />
                  )}
                </OrderCard>
              )
            })
          )}
        </div>
      )}

      {tab === "sales" && (
        <div className="space-y-3">
          {sales.length === 0 ? (
            <EmptyState icon={<Store className="h-5 w-5" />} text="No sales yet." />
          ) : (
            sales.map((order, i) => {
              const dr = firstOf<any>(order.delivery_request)
              const needsCourier = order.fulfillment_method === "delivery" && !dr
              return (
                <OrderCard key={order.id} index={i}>
                  <CardHeader
                    title={order.product_title}
                    counterparty={firstOf<any>(order.buyer)?.display_name ?? "Buyer"}
                    counterpartyLabel="to"
                    v1n3={order.v1n3_amount}
                    method={order.fulfillment_method}
                    status={order.fulfillment_status}
                  />

                  {order.fulfillment_method === "pickup" && (
                    <DetailRow icon={<Store className="h-3 w-3" />}>
                      Buyer will collect at terminal. Drop the item off when ready.
                    </DetailRow>
                  )}

                  {order.fulfillment_method === "delivery" && (order.delivery_address || dr) && (
                    <DetailRow icon={<MapPin className="h-3 w-3" />}>
                      {order.delivery_address}, {order.delivery_lga}, {order.delivery_state}
                      {order.delivery_contact_phone && (
                        <span className="inline-flex items-center gap-1 ml-2">
                          <Phone className="h-3 w-3" />
                          {order.delivery_contact_phone}
                        </span>
                      )}
                    </DetailRow>
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
                    <DetailRow icon={<CalendarClock className="h-3 w-3" />}>
                      Courier {dr.status}
                      {dr.scheduled_delivery_at ? ` · scheduled ${new Date(dr.scheduled_delivery_at).toLocaleString()}` : ""}
                    </DetailRow>
                  )}
                </OrderCard>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function OrderCard({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      className="rounded-[2px] border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/30"
    >
      {children}
    </motion.div>
  )
}

function CardHeader({
  title,
  counterparty,
  counterpartyLabel,
  v1n3,
  method,
  status,
}: {
  title: string
  counterparty: string
  counterpartyLabel: string
  v1n3: number
  method?: string | null
  status?: string | null
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-[2px] border border-border bg-background text-muted-foreground">
          <Package className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12px] text-foreground">{title}</p>
          <p className="mono-xs text-[10px] text-muted-foreground mt-0.5">
            {formatV1n3(v1n3)} V1N3 · {counterpartyLabel} {counterparty}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {method && (
          <span className="mono-xs inline-flex items-center gap-1 text-[8px] text-primary">
            {method === "delivery" ? <Truck className="h-2.5 w-2.5" /> : <Store className="h-2.5 w-2.5" />}
            {method.toUpperCase()}
          </span>
        )}
        <StatusPill status={status} />
      </div>
    </div>
  )
}

function DetailRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="mono-xs mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {children}
    </p>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[2px] border border-dashed border-border bg-secondary/20 py-12 text-muted-foreground">
      {icon}
      <p className="mono-xs text-[10px]">{text}</p>
    </div>
  )
}
