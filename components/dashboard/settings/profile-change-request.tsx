"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send, Check, Clock, CircleSlash, ShieldCheck } from "lucide-react"
import {
  EDITABLE_FIELDS,
  FIELD_LABELS,
  MULTILINE_FIELDS,
  type EditableField,
  type ChangeRequest,
} from "@/lib/profile/change-request-types"
import { submitChangeRequest } from "@/lib/profile/change-requests"

const inputCls =
  "w-full rounded-[2px] border border-border bg-background px-2.5 py-2 text-[11px] text-foreground outline-none transition-colors focus:border-primary/50 placeholder:text-muted-foreground/40"
const labelCls = "mono-xs text-[9px] tracking-[0.16em] text-muted-foreground"

type ProfileSnapshot = Partial<Record<EditableField, string | null>>

interface Props {
  profile: ProfileSnapshot
  initialRequests: ChangeRequest[]
}

const STATUS_META: Record<
  ChangeRequest["status"],
  { label: string; cls: string; icon: typeof Clock }
> = {
  pending: { label: "Pending review", cls: "border-orange/30 bg-orange-soft text-orange", icon: Clock },
  approved: { label: "Approved", cls: "border-primary/40 bg-primary/15 text-primary", icon: Check },
  rejected: { label: "Rejected", cls: "border-destructive/30 bg-destructive/10 text-destructive", icon: CircleSlash },
}

export function ProfileChangeRequest({ profile, initialRequests }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [values, setValues] = useState<Partial<Record<EditableField, string>>>({})
  const [reason, setReason] = useState("")

  const hasPending = initialRequests.some((r) => r.status === "pending")

  function setField(field: EditableField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await submitChangeRequest({ changes: values, reason })
      if (res.error) {
        setError(res.error)
        return
      }
      setSuccess(true)
      setValues({})
      setReason("")
      router.refresh()
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Request form */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <h2 className="mono-sm text-xs text-muted-foreground">Request Profile Changes</h2>
        </div>

        <form onSubmit={submit} className="space-y-3.5 rounded-[2px] border border-border bg-secondary/20 p-5">
          <p className="mono-xs text-[9px] leading-relaxed text-muted-foreground">
            Submit the fields you&apos;d like updated. Leave the rest blank. Your request is sent to the
            admin organization for review — changes (including your login email) apply once approved.
          </p>

          {hasPending && (
            <div className="flex items-start gap-2 rounded-[2px] border border-orange/30 bg-orange-soft p-2.5">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange" />
              <p className="mono-xs text-[9px] leading-relaxed text-orange">
                You have a request awaiting review. You can submit a new one once it&apos;s resolved.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {EDITABLE_FIELDS.map((field) => {
              const current = profile[field] ?? ""
              const multiline = MULTILINE_FIELDS.includes(field)
              return (
                <div key={field} className={`space-y-1.5 ${multiline ? "sm:col-span-2" : ""}`}>
                  <label className={labelCls}>{FIELD_LABELS[field].toUpperCase()}</label>
                  {multiline ? (
                    <textarea
                      className={`${inputCls} min-h-[64px] resize-y`}
                      value={values[field] ?? ""}
                      onChange={(e) => setField(field, e.target.value)}
                      placeholder={current ? String(current) : "Not set"}
                      disabled={hasPending}
                    />
                  ) : (
                    <input
                      type={field === "email" ? "email" : "text"}
                      className={inputCls}
                      value={values[field] ?? ""}
                      onChange={(e) => setField(field, e.target.value)}
                      placeholder={current ? String(current) : "Not set"}
                      disabled={hasPending}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>REASON / NOTE (OPTIONAL)</label>
            <textarea
              className={`${inputCls} min-h-[56px] resize-y`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add context to help the admin review your request..."
              disabled={hasPending}
            />
          </div>

          {error && (
            <p className="rounded-[2px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
              {error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-1.5 rounded-[2px] border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] text-primary">
              <Check className="h-3.5 w-3.5" /> Request submitted for review.
            </p>
          )}

          <button
            type="submit"
            disabled={pending || hasPending}
            className="flex w-full items-center justify-center gap-2 rounded-[2px] bg-primary px-3 py-2.5 text-[10px] font-medium tracking-[0.12em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            SUBMIT FOR REVIEW
          </button>
        </form>
      </div>

      {/* Request history */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <h2 className="mono-sm text-xs text-muted-foreground">My Requests — {initialRequests.length}</h2>
        </div>

        {initialRequests.length === 0 ? (
          <p className="rounded-[2px] border border-dashed border-border bg-secondary/20 px-3 py-8 text-center mono-xs text-[10px] text-muted-foreground">
            No requests yet. Submit one to update your details.
          </p>
        ) : (
          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {initialRequests.map((r) => {
              const meta = STATUS_META[r.status]
              const Icon = meta.icon
              return (
                <div key={r.id} className="space-y-2 rounded-[2px] border border-border bg-secondary/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`mono-xs inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-0.5 text-[8px] ${meta.cls}`}
                    >
                      <Icon className="h-2.5 w-2.5" />
                      {meta.label.toUpperCase()}
                    </span>
                    <span className="mono-xs text-[8px] text-muted-foreground/70">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(r.changes).map(([field, entry]) => (
                      <div key={field} className="text-[10px]">
                        <span className={labelCls}>
                          {(FIELD_LABELS[field as EditableField] ?? field).toUpperCase()}
                        </span>
                        <p className="flex items-center gap-1.5 text-foreground">
                          <span className="truncate text-muted-foreground/70 line-through">
                            {entry.current || "—"}
                          </span>
                          <span className="text-primary">→</span>
                          <span className="truncate">{entry.requested}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  {r.review_note && (
                    <p className="rounded-[2px] border border-border bg-background px-2 py-1.5 mono-xs text-[9px] text-muted-foreground">
                      Admin note: {r.review_note}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
