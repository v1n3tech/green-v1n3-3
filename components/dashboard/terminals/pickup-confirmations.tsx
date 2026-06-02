"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Package, CheckCircle2, Loader2, MapPin, Phone, ArrowRight } from "lucide-react"
import { confirmPickup, type PickupOrder } from "@/lib/fulfillment/terminal-managers"
import { StatusPill } from "@/components/dashboard/fulfillment/chrome"

interface Props {
  orders: PickupOrder[]
}

type Tab = "awaiting" | "collected"

export function PickupConfirmations({ orders }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("awaiting")

  const { awaiting, collected } = useMemo(() => {
    const awaiting = orders.filter((o) => o.fulfillment_status !== "collected")
    const collected = orders.filter((o) => o.fulfillment_status === "collected")
    return { awaiting, collected }
  }, [orders])

  const visible = tab === "awaiting" ? awaiting : collected

  function confirm(orderId: string) {
    setBusyId(orderId)
    setError(null)
    startTransition(async () => {
      const res = await confirmPickup(orderId)
      setBusyId(null)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-[2px] border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-[10px] text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <TabButton active={tab === "awaiting"} onClick={() => setTab("awaiting")} label="AWAITING PICKUP" count={awaiting.length} />
        <TabButton active={tab === "collected"} onClick={() => setTab("collected")} label="COLLECTED" count={collected.length} />
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[2px] border border-dashed border-border bg-secondary/20 py-12 text-muted-foreground">
          <Package className="h-5 w-5" />
          <p className="mono-xs text-[10px]">
            {tab === "awaiting" ? "No orders awaiting pickup." : "No collected orders yet."}
          </p>
        </div>
      ) : (
        <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {visible.map((o) => (
            <div
              key={o.id}
              className="rounded-[2px] border border-border bg-secondary/30 p-3 transition-colors hover:border-primary/30"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border border-border bg-background text-primary">
                    <Package className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-foreground">{o.product_title ?? "Order"}</p>
                    <p className="mono-xs mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground">
                      {o.seller?.display_name ?? "Seller"}
                      <ArrowRight className="h-2.5 w-2.5" />
                      {o.buyer?.display_name ?? "Buyer"}
                    </p>
                  </div>
                </div>
                <StatusPill status={o.fulfillment_status} />
              </div>

              <div className="space-y-1 border-t border-border/60 pt-2">
                {o.terminal && (
                  <p className="mono-xs flex items-center gap-1.5 text-[9px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5 text-primary" />
                    {o.terminal.name} — {o.terminal.lga}, {o.terminal.state}
                  </p>
                )}
                {o.buyer?.phone && (
                  <p className="mono-xs flex items-center gap-1.5 text-[9px] text-muted-foreground">
                    <Phone className="h-2.5 w-2.5 text-primary" />
                    {o.buyer.phone}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="mono-xs text-[9px] text-muted-foreground">
                    {Number(o.v1n3_amount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} V1N3
                    {o.quantity ? ` · QTY ${o.quantity}` : ""}
                  </span>
                  {o.fulfillment_status === "collected" ? (
                    <span className="mono-xs inline-flex items-center gap-1 text-[9px] text-primary">
                      <CheckCircle2 className="h-3 w-3" />
                      COLLECTED
                    </span>
                  ) : (
                    <button
                      onClick={() => confirm(o.id)}
                      disabled={pending && busyId === o.id}
                      className="flex shrink-0 items-center gap-1.5 rounded-[2px] bg-primary px-2.5 py-1.5 text-[9px] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {pending && busyId === o.id ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      )}
                      CONFIRM PICKUP
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`mono-xs flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1.5 text-[9px] transition-colors ${
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <span className={`rounded-[2px] px-1 ${active ? "bg-primary/20" : "bg-secondary"}`}>{count}</span>
    </button>
  )
}
