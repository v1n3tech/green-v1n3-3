"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Truck, Store, Loader2, ChevronDown, MapPin, Check } from "lucide-react"
import type { MarketplaceTerminal } from "@/lib/fulfillment/types"

type TerminalLite = Pick<MarketplaceTerminal, "id" | "name" | "state" | "lga" | "address">

interface Props {
  orderId: string
  offersDelivery: boolean
  pickupAvailable: boolean
  deliveryFeeNgn: number
  deliveryFeeV1n3: number
  terminals: TerminalLite[]
}

const inputCls =
  "w-full bg-background border border-border rounded-[2px] px-2.5 py-1.5 mono-xs text-[10px] text-foreground focus:outline-none focus:border-primary"
const labelCls = "mono-xs text-[9px] text-muted-foreground tracking-wider mb-1 block"

function TerminalDropdown({
  terminals,
  value,
  onChange,
}: {
  terminals: TerminalLite[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = terminals.find((t) => t.id === value)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-[2px] border bg-background px-2.5 py-2 text-left transition-colors ${
          open ? "border-primary" : "border-border hover:border-primary/40"
        }`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className={`h-3 w-3 flex-shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
          {selected ? (
            <span className="mono-xs truncate text-[10px] text-foreground">
              {selected.name}
              <span className="text-muted-foreground">
                {" "}
                — {selected.lga}, {selected.state}
              </span>
            </span>
          ) : (
            <span className="mono-xs text-[10px] text-muted-foreground">Choose a pickup terminal…</span>
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-[2px] border border-border bg-card p-1 shadow-lg"
          >
            {terminals.length === 0 && (
              <li className="mono-xs px-2 py-2 text-[10px] text-muted-foreground">No active terminals yet.</li>
            )}
            {terminals.map((t) => {
              const active = t.id === value
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(t.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-start gap-2 rounded-[2px] px-2 py-2 text-left transition-colors ${
                      active ? "bg-primary/10" : "hover:bg-secondary"
                    }`}
                  >
                    <MapPin
                      className={`mt-0.5 h-3 w-3 flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="mono-xs block truncate text-[10px] text-foreground">{t.name}</span>
                      <span className="mono-xs block truncate text-[9px] text-muted-foreground">
                        {t.lga}, {t.state}
                      </span>
                    </span>
                    {active && <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

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
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <span className={labelCls}>HOW WOULD YOU LIKE TO RECEIVE THIS?</span>

      {mode === "none" && (
        <div className="flex flex-wrap gap-2">
          {pickupAvailable && (
            <button
              onClick={() => setMode("pickup")}
              className="mono-xs flex items-center gap-2 rounded-[2px] border border-border bg-secondary/40 px-3 py-2 text-[10px] text-foreground transition-colors hover:border-primary"
            >
              <Store className="h-3.5 w-3.5" />
              Collect at terminal
            </button>
          )}
          {offersDelivery && (
            <button
              onClick={() => setMode("delivery")}
              className="mono-xs flex items-center gap-2 rounded-[2px] border border-border bg-secondary/40 px-3 py-2 text-[10px] text-foreground transition-colors hover:border-primary"
            >
              <Truck className="h-3.5 w-3.5" />
              {"Request delivery · N"}
              {deliveryFeeNgn.toLocaleString()}
            </button>
          )}
        </div>
      )}

      {mode === "pickup" && (
        <div className="space-y-2">
          <div>
            <span className={labelCls}>SELECT TERMINAL</span>
            <TerminalDropdown terminals={terminals} value={terminalId} onChange={setTerminalId} />
          </div>
          {error && <p className="mono-xs text-[10px] text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={busy || !terminalId}
              onClick={() => submit({ method: "pickup", terminalId })}
              className="mono-xs flex items-center gap-1.5 rounded-[2px] bg-primary px-3 py-1.5 text-[10px] text-primary-foreground disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin" />}
              Confirm pickup
            </button>
            <button onClick={() => setMode("none")} className="mono-xs px-3 py-1.5 text-[10px] text-muted-foreground">
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
              className="mono-xs flex items-center gap-1.5 rounded-[2px] bg-primary px-3 py-1.5 text-[10px] text-primary-foreground disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin" />}
              Pay fee & request delivery
            </button>
            <button onClick={() => setMode("none")} className="mono-xs px-3 py-1.5 text-[10px] text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
