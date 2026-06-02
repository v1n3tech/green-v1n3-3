"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Truck, Loader2 } from "lucide-react"
import { createDeliveryRequest } from "@/lib/fulfillment/delivery"

interface Props {
  orderId: string
  deliveryAddress: string
  deliveryState: string
  deliveryLga: string
  deliveryPhone: string
}

export function SellerRequestDelivery({ orderId, deliveryAddress, deliveryState, deliveryLga, deliveryPhone }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  function request() {
    setError(null)
    startTransition(async () => {
      const { error } = await createDeliveryRequest({
        order_id: orderId,
        delivery_address: deliveryAddress,
        delivery_state: deliveryState,
        delivery_lga: deliveryLga,
        delivery_contact_phone: deliveryPhone,
        notes: notes || undefined,
      })
      if (error) {
        setError(error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      <p className="mono-xs text-[10px] text-foreground">
        {"Buyer paid for delivery to: "}
        <span className="text-muted-foreground">
          {deliveryAddress}, {deliveryLga}, {deliveryState} · {deliveryPhone}
        </span>
      </p>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-[2px] bg-secondary/40 hover:border-primary transition-colors mono-xs text-[10px] text-foreground"
        >
          <Truck className="w-3.5 h-3.5" />
          Request courier from logistics
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full bg-background border border-border rounded-[2px] px-2.5 py-1.5 mono-xs text-[10px] text-foreground focus:outline-none focus:border-primary"
            rows={2}
            placeholder="Notes for the courier (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {error && <p className="mono-xs text-[10px] text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={request}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-[2px] mono-xs text-[10px] disabled:opacity-50"
            >
              {pending && <Loader2 className="w-3 h-3 animate-spin" />}
              Send request
            </button>
            <button onClick={() => setOpen(false)} className="px-3 py-1.5 mono-xs text-[10px] text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
