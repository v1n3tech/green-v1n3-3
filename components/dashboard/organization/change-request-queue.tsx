"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check, X, Clock, CircleSlash, Inbox, ChevronDown } from "lucide-react"
import { FIELD_LABELS, type EditableField, type AdminChangeRequest } from "@/lib/profile/change-request-types"
import { approveChangeRequest, rejectChangeRequest } from "@/lib/profile/change-requests"

const labelCls = "mono-xs text-[9px] tracking-[0.16em] text-muted-foreground"

const STATUS_META: Record<
  AdminChangeRequest["status"],
  { label: string; cls: string; icon: typeof Clock }
> = {
  pending: { label: "Pending", cls: "border-orange/30 bg-orange-soft text-orange", icon: Clock },
  approved: { label: "Approved", cls: "border-primary/40 bg-primary/15 text-primary", icon: Check },
  rejected: { label: "Rejected", cls: "border-destructive/30 bg-destructive/10 text-destructive", icon: CircleSlash },
}

interface Props {
  initialRequests: AdminChangeRequest[]
}

export function ChangeRequestQueue({ initialRequests }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [showResolved, setShowResolved] = useState(false)

  const pendingReqs = initialRequests.filter((r) => r.status === "pending")
  const resolvedReqs = initialRequests.filter((r) => r.status !== "pending")

  function act(id: string, kind: "approve" | "reject") {
    setActingId(id)
    setError(null)
    startTransition(async () => {
      const note = notes[id]
      const res =
        kind === "approve" ? await approveChangeRequest(id, note) : await rejectChangeRequest(id, note)
      setActingId(null)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  function renderCard(r: AdminChangeRequest, reviewable: boolean) {
    const meta = STATUS_META[r.status]
    const Icon = meta.icon
    const busy = pending && actingId === r.id
    return (
      <div key={r.id} className="space-y-3 rounded-[2px] border border-border bg-secondary/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[12px] text-foreground">{r.applicant?.display_name ?? "Unknown user"}</p>
            <p className="mono-xs truncate text-[9px] text-muted-foreground">
              {r.applicant?.agro_id ?? "—"} · {r.applicant?.email ?? "—"}
            </p>
          </div>
          <span className={`mono-xs inline-flex shrink-0 items-center gap-1 rounded-[2px] border px-1.5 py-0.5 text-[8px] ${meta.cls}`}>
            <Icon className="h-2.5 w-2.5" />
            {meta.label.toUpperCase()}
          </span>
        </div>

        <div className="space-y-1.5 rounded-[2px] border border-border bg-background p-2.5">
          {Object.entries(r.changes).map(([field, entry]) => (
            <div key={field} className="text-[10px]">
              <span className={labelCls}>{(FIELD_LABELS[field as EditableField] ?? field).toUpperCase()}</span>
              <p className="flex items-center gap-1.5 text-foreground">
                <span className="truncate text-muted-foreground/70 line-through">{entry.current || "—"}</span>
                <span className="text-primary">→</span>
                <span className="truncate font-medium">{entry.requested}</span>
              </p>
            </div>
          ))}
        </div>

        {r.reason && (
          <p className="mono-xs text-[9px] leading-relaxed text-muted-foreground">
            <span className="text-muted-foreground/60">Reason: </span>
            {r.reason}
          </p>
        )}

        {reviewable ? (
          <div className="space-y-2">
            <input
              value={notes[r.id] ?? ""}
              onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
              placeholder="Review note (optional)..."
              className="w-full rounded-[2px] border border-border bg-background px-2.5 py-1.5 text-[10px] text-foreground outline-none focus:border-primary/50 placeholder:text-muted-foreground/40"
            />
            <div className="flex gap-2">
              <button
                onClick={() => act(r.id, "approve")}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[2px] bg-primary px-3 py-2 text-[10px] font-medium tracking-[0.12em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                APPROVE
              </button>
              <button
                onClick={() => act(r.id, "reject")}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[2px] border border-destructive/40 px-3 py-2 text-[10px] font-medium tracking-[0.12em] text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
                REJECT
              </button>
            </div>
          </div>
        ) : (
          r.review_note && (
            <p className="rounded-[2px] border border-border bg-background px-2 py-1.5 mono-xs text-[9px] text-muted-foreground">
              Note: {r.review_note}
            </p>
          )
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Inbox className="h-3.5 w-3.5 text-primary" />
        <h2 className="mono-sm text-xs text-muted-foreground">
          Profile Change Requests — {pendingReqs.length} pending
        </h2>
      </div>

      {error && (
        <p className="rounded-[2px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          {error}
        </p>
      )}

      {pendingReqs.length === 0 ? (
        <p className="rounded-[2px] border border-dashed border-border bg-secondary/20 px-3 py-8 text-center mono-xs text-[10px] text-muted-foreground">
          No pending change requests.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">{pendingReqs.map((r) => renderCard(r, true))}</div>
      )}

      {resolvedReqs.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowResolved((s) => !s)}
            className="flex items-center gap-1.5 mono-xs text-[10px] text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showResolved ? "rotate-180" : ""}`} />
            Resolved ({resolvedReqs.length})
          </button>
          {showResolved && (
            <div className="grid gap-3 sm:grid-cols-2">{resolvedReqs.map((r) => renderCard(r, false))}</div>
          )}
        </div>
      )}
    </div>
  )
}
