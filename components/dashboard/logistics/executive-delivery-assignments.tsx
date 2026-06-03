"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Truck,
  MapPin,
  Phone,
  Calendar,
  Loader2,
  PackageCheck,
  PackageX,
  Upload,
  ImageIcon,
  Clock,
} from "lucide-react"
import { DeliveryRequest } from "@/lib/fulfillment/types"
import { reportDeliveryComplete } from "@/lib/fulfillment/delivery"
import { StatusPill } from "@/components/dashboard/fulfillment/chrome"

interface ExecutiveDeliveryAssignmentsProps {
  requests: DeliveryRequest[]
  /** Render without the section heading (e.g. when embedded in another page). */
  bare?: boolean
}

const ACTIONABLE = ["accepted", "scheduled", "in_transit"]

export function ExecutiveDeliveryAssignments({ requests, bare = false }: ExecutiveDeliveryAssignmentsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [proofByReq, setProofByReq] = useState<Record<string, string>>({})
  const [notesByReq, setNotesByReq] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleUpload = async (requestId: string, file: File) => {
    setUploading(requestId)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/delivery-proof", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Upload failed")
        return
      }
      setProofByReq((p) => ({ ...p, [requestId]: json.url }))
    } catch (e) {
      console.error("[v0] proof upload error:", e)
      setError("Upload failed")
    } finally {
      setUploading(null)
    }
  }

  const handleReport = async (requestId: string) => {
    const proofUrl = proofByReq[requestId]
    if (!proofUrl) {
      setError("Upload proof of delivery first")
      return
    }
    setBusy(requestId)
    setError(null)
    try {
      const { error } = await reportDeliveryComplete(requestId, proofUrl, notesByReq[requestId])
      if (error) setError(error)
      else router.refresh()
    } catch (e) {
      console.error("[v0] report delivery error:", e)
      setError("Failed to report delivery")
    } finally {
      setBusy(null)
    }
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[2px] border border-dashed border-border bg-secondary/20 py-12 text-muted-foreground">
        <PackageX className="h-5 w-5" />
        <p className="mono-xs text-[10px]">No delivery assignments yet.</p>
      </div>
    )
  }

  return (
    <div className={bare ? "" : "space-y-4"}>
      {!bare && (
        <div className="flex items-center gap-2">
          <Truck className="h-3.5 w-3.5 text-primary" />
          <h2 className="mono-sm text-xs text-muted-foreground">My Delivery Assignments</h2>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {requests.map((req, i) => {
          const proofUrl = proofByReq[req.id] || req.proof_of_delivery_url
          const isActionable = ACTIONABLE.includes(req.status)

          return (
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
                  <p className="mono-xs text-[11px] text-foreground">
                    {req.order?.product_title || `Order ${req.order_id?.slice(0, 8)}`}
                  </p>
                </div>
                <StatusPill status={req.status} />
              </div>

              <div className="space-y-1.5 border-t border-border/60 pt-3">
                <p className="mono-xs flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <MapPin className="h-3 w-3 text-primary" />
                  {req.delivery_address ? `${req.delivery_address}, ` : ""}
                  {req.delivery_lga}, {req.delivery_state}
                </p>
                {req.delivery_contact_phone && (
                  <p className="mono-xs flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Phone className="h-3 w-3 text-primary" />
                    {req.delivery_contact_phone}
                  </p>
                )}
                {req.scheduled_delivery_at && (
                  <p className="mono-xs flex items-center gap-1.5 text-[10px] text-primary">
                    <Calendar className="h-3 w-3" />
                    Scheduled: {new Date(req.scheduled_delivery_at).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Actionable: upload proof + report complete */}
              {isActionable && (
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <input
                    ref={(el) => {
                      fileInputs.current[req.id] = el
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(req.id, file)
                    }}
                  />

                  {proofUrl ? (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proofUrl || "/placeholder.svg"}
                        alt="Proof of delivery"
                        className="h-12 w-12 rounded-[2px] border border-border object-cover"
                      />
                      <button
                        onClick={() => fileInputs.current[req.id]?.click()}
                        disabled={uploading === req.id}
                        className="mono-xs flex items-center gap-1.5 rounded-[2px] border border-border px-2 py-1.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {uploading === req.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ImageIcon className="h-3 w-3" />
                        )}
                        Replace proof
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputs.current[req.id]?.click()}
                      disabled={uploading === req.id}
                      className="mono-xs flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-dashed border-border py-2 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                    >
                      {uploading === req.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3" />
                      )}
                      {uploading === req.id ? "UPLOADING" : "UPLOAD PROOF (SIGNATURE / PHOTO)"}
                    </button>
                  )}

                  <textarea
                    value={notesByReq[req.id] ?? ""}
                    onChange={(e) => setNotesByReq((n) => ({ ...n, [req.id]: e.target.value }))}
                    placeholder="Delivery note (optional)"
                    rows={2}
                    className="mono-xs w-full resize-none rounded-[2px] border border-border bg-background px-2 py-1.5 text-[10px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                  />

                  <button
                    onClick={() => handleReport(req.id)}
                    disabled={busy === req.id || !proofUrl}
                    className="mono-xs flex w-full items-center justify-center gap-1.5 rounded-[2px] bg-primary py-2 text-[10px] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {busy === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3 w-3" />}
                    {busy === req.id ? "SUBMITTING" : "REPORT DELIVERED"}
                  </button>
                </div>
              )}

              {/* Reported, waiting on GCM */}
              {req.status === "awaiting_confirmation" && (
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <p className="mono-xs flex items-center gap-1.5 text-[10px] text-orange">
                    <Clock className="h-3 w-3" />
                    Reported — awaiting GCM confirmation
                  </p>
                  {req.proof_of_delivery_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={req.proof_of_delivery_url || "/placeholder.svg"}
                      alt="Submitted proof of delivery"
                      className="h-16 w-16 rounded-[2px] border border-border object-cover"
                    />
                  )}
                </div>
              )}

              {req.status === "delivered" && (
                <p className="mono-xs flex items-center gap-1.5 border-t border-border/60 pt-3 text-[10px] text-primary">
                  <PackageCheck className="h-3 w-3" />
                  Delivered{req.delivered_at ? ` ${new Date(req.delivered_at).toLocaleString()}` : ""}
                </p>
              )}

              {error && busy === null && uploading === null && (
                <p className="mono-xs text-[10px] text-destructive">{error}</p>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
