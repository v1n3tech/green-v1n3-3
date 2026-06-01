"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Truck, Store, Loader2 } from "lucide-react"
import type { MarketplaceTerminal } from "@/lib/fulfillment/types"

interface Props {
  orderId: string
  offersDelivery: boolean
  pickupAvailable: boolean
  deliveryFeeNgn: number
  deliveryFeeV1n3: number
  terminals: Pick<MarketplaceTerminal, "id" | "name" | "state" | "lga" | "address">[]
}

const inputCls =
  "w-full bg-background border border-border rounded-[2px] px-2.5 py-1.5 mono-xs text-[10px] text-foreground focus:outline-none focus:border-primary"
const labelCls = "mono-xs text-[9px] text-muted-foreground tracking-wider mb-1 block"

export function BuyerFulfillment({
  orderId,
  offersDelivery,
  pickupAvailable,
  deliveryFeeNgn,
  deliveryFeeV1n3,
  terminals,
}: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<"none" | "pickup" | "delivery">("none")
  const [terminalId, setTerminalId] = useState("")
  const [addr, setAddr] = useState({ deliveryAddress: "", deliveryState: "Plateau", deliveryLga: "", deliveryPhone: "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(payload: Record<string, unknown>) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/marketplace/orders/${orderId}/fulfillment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Something went wrong")
        return
      }
      router.refresh()
    } catch {
      setError("Network error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      <span className={labelCls}>HOW WOULD YOU LIKE TO RECEIVE THIS?</span>

      {mode === "none" && (
        <div className="flex flex-wrap gap-2">
          {pickupAvailable && (
            <button
              onClick={() => setMode("pickup")}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-[2px] bg-secondary/40 hover:border-primary transition-colors mono-xs text-[10px] text-foreground"
            >
              <Store className="w-3.5 h-3.5" />
              Collect at terminal
            </button>
          )}
          {offersDelivery && (
            <button
              onClick={() => setMode("delivery")}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-[2px] bg-secondary/40 hover:border-primary transition-colors mono-xs text-[10px] text-foreground"
            >
              <Truck className="w-3.5 h-3.5" />
              {"Request delivery · N"}
              {deliveryFeeNgn.toLocaleString()}
            </button>
          )}
          {!offersDelivery && !pickupAvailable && (
            <p className="mono-xs text-[10px] text-muted-foreground">Seller has not configured fulfillment yet.</p>
          )}
        </div>
      )}

      {mode === "pickup" && (
        <div className="space-y-2">
          <div>
            <span className={labelCls}>SELECT TERMINAL</span>
            <select className={inputCls} value={terminalId} onChange={(e) => setTerminalId(e.target.value)}>
              <option value="">Choose a pickup terminal…</option>
              {terminals.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.lga}, {t.state}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="mono-xs text-[10px] text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={busy || !terminalId}
              onClick={() => submit({ method: "pickup", terminalId })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-[2px] mono-xs text-[10px] disabled:opacity-50"
            >
              {busy && <Loader2 className="w-3 h-3 animate-spin" />}
              Confirm pickup
            </button>
            <button onClick={() => setMode("none")} className="px-3 py-1.5 mono-xs text-[10px] text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "delivery" && (
        <div className="space-y-2">
          <div>
            <span className={labelCls}>DELIVERY ADDRESS</span>
            <input
              className={inputCls}
              value={addr.deliveryAddress}
              onChange={(e) => setAddr({ ...addr, deliveryAddress: e.target.value })}
              placeholder="Street, building, landmark"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className={labelCls}>STATE</span>
              <input
                className={inputCls}
                value={addr.deliveryState}
                onChange={(e) => setAddr({ ...addr, deliveryState: e.target.value })}
              />
            </div>
            <div>
              <span className={labelCls}>LGA</span>
              <input
                className={inputCls}
                value={addr.deliveryLga}
                onChange={(e) => setAddr({ ...addr, deliveryLga: e.target.value })}
              />
            </div>
          </div>
          <div>
            <span className={labelCls}>CONTACT PHONE</span>
            <input
              className={inputCls}
              value={addr.deliveryPhone}
              onChange={(e) => setAddr({ ...addr, deliveryPhone: e.target.value })}
              placeholder="080..."
            />
          </div>
          <p className="mono-xs text-[9px] text-muted-foreground">
            {"Delivery fee: N"}
            {deliveryFeeNgn.toLocaleString()}
            {" ("}
            {deliveryFeeV1n3.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            {" V1N3) will be charged from your wallet."}
          </p>
          {error && <p className="mono-xs text-[10px] text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => submit({ method: "delivery", ...addr })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-[2px] mono-xs text-[10px] disabled:opacity-50"
            >
              {busy && <Loader2 className="w-3 h-3 animate-spin" />}
              Pay fee & request delivery
            </button>
            <button onClick={() => setMode("none")} className="px-3 py-1.5 mono-xs text-[10px] text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
