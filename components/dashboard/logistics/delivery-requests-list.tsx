"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Truck, Calendar, MapPin, Phone, Loader2, CheckCircle2, PackageX, PackageCheck, UserCheck, Lock, Clock } from "lucide-react"
import { DeliveryRequest } from "@/lib/fulfillment/types"
import { acceptDeliveryRequest, scheduleDelivery, completeDelivery, assignDeliveryExecutive } from "@/lib/fulfillment/delivery"
import { StatusPill } from "@/components/dashboard/fulfillment/chrome"
import { AppSelect } from "@/components/ui/app-select"

export interface LogisticsExecutive {
  id: string
  display_name: string | null
  agro_id: string | null
  lga: string | null
}

interface DeliveryRequestsListProps {
  requests: DeliveryRequest[]
  isGcm: boolean
  executives?: LogisticsExecutive[]
}

export function DeliveryRequestsList({ requests, isGcm, executives = [] }: DeliveryRequestsListProps) {
  const router = useRouter()
  const [accepting, setAccepting] = useState<string | null>(null)
  const [scheduling, setScheduling] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
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

  const handleComplete = async (requestId: string) => {
    if (!isGcm) return
    setCompleting(requestId)
    setError(null)
    try {
      const { error } = await completeDelivery(requestId)
      if (error) setError(error)
      else router.refresh()
    } catch (e) {
      console.error("[v0] complete error:", e)
      setError("Failed to mark delivered")
    } finally {
      setCompleting(null)
    }
  }

  const handleAssign = async (requestId: string, executiveId: string) => {
    if (!isGcm || !executiveId) return
    setAssigning(requestId)
    setError(null)
    try {
      const { error } = await assignDeliveryExecutive(requestId, executiveId)
      if (error) setError(error)
      else router.refresh()
    } catch (e) {
      console.error("[v0] assign executive error:", e)
      setError("Failed to assign executive")
    } finally {
      setAssigning(null)
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

          {req.scheduled_delivery_at && req.status !== "delivered" && (
            <p className="mono-xs flex items-center gap-1.5 border-t border-border/60 pt-3 text-[10px] text-primary">
              <Calendar className="h-3 w-3" />
              Scheduled: {new Date(req.scheduled_delivery_at).toLocaleString()}
            </p>
          )}

          {isGcm && (req.status === "accepted" || req.status === "scheduled" || req.status === "in_transit") && (
            <div className="space-y-1.5 border-t border-border/60 pt-3">
              <p className="mono-xs flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <UserCheck className="h-3 w-3 text-primary" />
                {req.assigned_executive?.display_name
                  ? `Assigned: ${req.assigned_executive.display_name}`
                  : "Assign field executive"}
              </p>
              {executives.length > 0 ? (
                <AppSelect
                  value={req.assigned_executive_id ?? ""}
                  onChange={(v) => handleAssign(req.id, v)}
                  ariaLabel="Assign delivery executive"
                  placeholder={assigning === req.id ? "Assigning…" : "Select executive…"}
                  options={executives.map((e) => ({
                    value: e.id,
                    label: e.lga ? `${e.display_name ?? e.agro_id} · ${e.lga}` : e.display_name ?? e.agro_id ?? "Executive",
                  }))}
                />
              ) : (
                <p className="mono-xs text-[10px] text-muted-foreground/60">No logistics executives available yet.</p>
              )}
            </div>
          )}

          {isGcm && (req.status === "accepted" || req.status === "scheduled" || req.status === "in_transit") && (
            <div className="mt-2 space-y-1.5 border-t border-border/60 pt-3">
              <button
                disabled
                aria-disabled="true"
                title={
                  !req.assigned_executive_id
                    ? "Assign a field executive first"
                    : "Waiting for the executive to report this delivery"
                }
                className="mono-xs flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-[2px] border border-border bg-secondary/40 py-2 text-[10px] text-muted-foreground/60"
              >
                <Lock className="h-3 w-3" />
                MARK DELIVERED
              </button>
              <p className="mono-xs flex items-center gap-1.5 text-[9px] text-muted-foreground/70">
                <Clock className="h-2.5 w-2.5" />
                {!req.assigned_executive_id
                  ? "Assign a field executive to begin delivery."
                  : "Unlocks once the assigned executive reports delivery with proof."}
              </p>
            </div>
          )}

          {isGcm && req.status === "awaiting_confirmation" && (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <p className="mono-xs flex items-center gap-1.5 text-[10px] text-orange">
                <PackageCheck className="h-3 w-3" />
                Executive reported delivered — review proof
              </p>
              {req.proof_of_delivery_url && (
                <a href={req.proof_of_delivery_url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={req.proof_of_delivery_url || "/placeholder.svg"}
                    alt="Proof of delivery"
                    className="h-24 w-full rounded-[2px] border border-border object-cover transition-opacity hover:opacity-90"
                  />
                </a>
              )}
              {req.completion_notes && (
                <p className="mono-xs text-[10px] text-muted-foreground">&ldquo;{req.completion_notes}&rdquo;</p>
              )}
              <button
                onClick={() => handleComplete(req.id)}
                disabled={completing === req.id}
                className="mono-xs flex w-full items-center justify-center gap-1.5 rounded-[2px] bg-primary py-2 text-[10px] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {completing === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3 w-3" />}
                {completing === req.id ? "CONFIRMING" : "CONFIRM DELIVERED"}
              </button>
            </div>
          )}

          {req.status === "delivered" && (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <p className="mono-xs flex items-center gap-1.5 text-[10px] text-primary">
                <PackageCheck className="h-3 w-3" />
                Delivered{req.delivered_at ? ` ${new Date(req.delivered_at).toLocaleString()}` : ""}
              </p>
              {req.proof_of_delivery_url && (
                <a href={req.proof_of_delivery_url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={req.proof_of_delivery_url || "/placeholder.svg"}
                    alt="Proof of delivery"
                    className="h-16 w-16 rounded-[2px] border border-border object-cover transition-opacity hover:opacity-90"
                  />
                </a>
              )}
            </div>
          )}

          {error && accepting === null && scheduling === null && completing === null && assigning === null && (
            <p className="mono-xs text-[10px] text-destructive">{error}</p>
          )}
        </motion.div>
      ))}
    </div>
  )
}
