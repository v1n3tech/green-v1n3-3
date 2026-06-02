"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Truck, Calendar, MapPin, Phone, Loader2, CheckCircle2, PackageX } from "lucide-react"
import { DeliveryRequest } from "@/lib/fulfillment/types"
import { acceptDeliveryRequest, scheduleDelivery } from "@/lib/fulfillment/delivery"
import { StatusPill } from "@/components/dashboard/fulfillment/chrome"

interface DeliveryRequestsListProps {
  requests: DeliveryRequest[]
  isGcm: boolean
}

export function DeliveryRequestsList({ requests, isGcm }: DeliveryRequestsListProps) {
  const router = useRouter()
  const [accepting, setAccepting] = useState<string | null>(null)
  const [scheduling, setScheduling] = useState<string | null>(null)
  const [scheduledDate, setScheduledDate] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async (requestId: string) => {
    if (!isGcm) return
    setAccepting(requestId)
    setError(null)
    try {
      const { error } = await acceptDeliveryRequest(requestId)
      if (error) setError(error)
      else router.refresh()
    } catch (e) {
      console.error("[v0] accept error:", e)
      setError("Failed to accept request")
    } finally {
      setAccepting(null)
    }
  }

  const handleSchedule = async (requestId: string) => {
    if (!scheduledDate || !isGcm) return
    setScheduling(requestId)
    setError(null)
    try {
      const { error } = await scheduleDelivery(requestId, scheduledDate)
      if (error) {
        setError(error)
      } else {
        setScheduledDate("")
        router.refresh()
      }
    } catch (e) {
      console.error("[v0] schedule error:", e)
      setError("Failed to schedule delivery")
    } finally {
      setScheduling(null)
    }
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[2px] border border-dashed border-border bg-secondary/20 py-12 text-muted-foreground">
        <PackageX className="h-5 w-5" />
        <p className="mono-xs text-[10px]">No open delivery requests.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {requests.map((req, i) => (
        <motion.div
          key={req.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.25) }}
          className="space-y-3 rounded-[2px] border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[2px] border border-border bg-background text-primary">
                <Truck className="h-3.5 w-3.5" />
              </div>
              <p className="mono-xs text-[11px] text-foreground">Order {req.order_id?.slice(0, 8)}</p>
            </div>
            <StatusPill status={req.status} />
          </div>

          <div className="space-y-1.5 border-t border-border/60 pt-3">
            <p className="mono-xs flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              {req.delivery_lga}, {req.delivery_state}
            </p>
            {req.delivery_contact_phone && (
              <p className="mono-xs flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Phone className="h-3 w-3 text-primary" />
                {req.delivery_contact_phone}
              </p>
            )}
          </div>

          {isGcm && req.status === "pending" && (
            <button
              onClick={() => handleAccept(req.id)}
              disabled={accepting === req.id}
              className="mono-xs flex w-full items-center justify-center gap-1.5 rounded-[2px] bg-primary py-2 text-[10px] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {accepting === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              {accepting === req.id ? "ACCEPTING" : "ACCEPT REQUEST"}
            </button>
          )}

          {isGcm && req.status === "accepted" && !req.scheduled_delivery_at && (
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="mono-xs flex-1 rounded-[2px] border border-border bg-background px-2 py-1.5 text-[10px] text-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => handleSchedule(req.id)}
                disabled={scheduling === req.id || !scheduledDate}
                className="mono-xs flex items-center gap-1 rounded-[2px] bg-primary px-3 py-1.5 text-[10px] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {scheduling === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "SCHEDULE"}
              </button>
            </div>
          )}

          {req.scheduled_delivery_at && (
            <p className="mono-xs flex items-center gap-1.5 border-t border-border/60 pt-3 text-[10px] text-primary">
              <Calendar className="h-3 w-3" />
              Scheduled: {new Date(req.scheduled_delivery_at).toLocaleString()}
            </p>
          )}

          {error && accepting === null && scheduling === null && (
            <p className="mono-xs text-[10px] text-destructive">{error}</p>
          )}
        </motion.div>
      ))}
    </div>
  )
}
