"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, UserMinus, ShieldCheck, Loader2, Search } from "lucide-react"
import {
  appointTerminalManager,
  revokeTerminalManager,
  type MarketingExecutive,
  type TerminalManager,
} from "@/lib/fulfillment/terminal-managers"

interface Props {
  executives: MarketingExecutive[]
  managers: TerminalManager[]
}

function initials(name?: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function TerminalManagersPanel({ executives, managers }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const managerIds = new Set(managers.map((m) => m.user_id))
  const candidates = executives
    .filter((e) => !managerIds.has(e.id))
    .filter((e) => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        (e.display_name ?? "").toLowerCase().includes(q) ||
        (e.agro_id ?? "").toLowerCase().includes(q) ||
        (e.lga ?? "").toLowerCase().includes(q)
      )
    })

  function appoint(userId: string) {
    setBusyId(userId)
    setError(null)
    startTransition(async () => {
      const res = await appointTerminalManager(userId)
      setBusyId(null)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  function revoke(userId: string) {
    setBusyId(userId)
    setError(null)
    startTransition(async () => {
      const res = await revokeTerminalManager(userId)
      setBusyId(null)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-[2px] border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-[10px] text-destructive">
          {error}
        </p>
      )}

      {/* Current managers */}
      <div className="space-y-2">
        <p className="mono-xs text-[9px] tracking-[0.18em] text-muted-foreground">
          / ACTIVE MANAGERS — {managers.length}
        </p>
        {managers.length === 0 ? (
          <p className="rounded-[2px] border border-dashed border-border bg-secondary/20 px-3 py-4 text-center mono-xs text-[10px] text-muted-foreground">
            No terminal managers appointed yet.
          </p>
        ) : (
          <div className="space-y-2">
            {managers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2.5 rounded-[2px] border border-primary/25 bg-primary/5 p-2.5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border border-primary/30 bg-background mono-xs text-[9px] text-primary">
                  {initials(m.profile?.display_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-[11px] text-foreground">
                    <ShieldCheck className="h-3 w-3 shrink-0 text-primary" />
                    {m.profile?.display_name ?? "Executive"}
                  </p>
                  <p className="mono-xs text-[9px] text-muted-foreground">
                    {m.profile?.agro_id ?? "—"}
                    {m.profile?.lga ? ` · ${m.profile.lga}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => revoke(m.user_id)}
                  disabled={pending && busyId === m.user_id}
                  className="flex shrink-0 items-center gap-1 rounded-[2px] bg-destructive/15 px-2 py-1 text-[9px] text-destructive transition-colors hover:bg-destructive/25 disabled:opacity-50"
                >
                  {pending && busyId === m.user_id ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <UserMinus className="h-2.5 w-2.5" />
                  )}
                  REVOKE
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appoint new */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="mono-xs text-[9px] tracking-[0.18em] text-muted-foreground">/ APPOINT EXECUTIVE</p>
        <div className="flex items-center gap-2 rounded-[2px] border border-border bg-background px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search marketing executives..."
            className="mono-xs flex-1 bg-transparent text-[10px] text-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        {candidates.length === 0 ? (
          <p className="rounded-[2px] border border-dashed border-border bg-secondary/20 px-3 py-4 text-center mono-xs text-[10px] text-muted-foreground">
            {executives.length === 0
              ? "No marketing executives available."
              : "No matching executives."}
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {candidates.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-2.5 rounded-[2px] border border-border bg-secondary/30 p-2.5 transition-colors hover:border-primary/30"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border border-border bg-background mono-xs text-[9px] text-muted-foreground">
                  {initials(e.display_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] text-foreground">{e.display_name ?? "Executive"}</p>
                  <p className="mono-xs text-[9px] text-muted-foreground">
                    {e.agro_id ?? "—"}
                    {e.lga ? ` · ${e.lga}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => appoint(e.id)}
                  disabled={pending && busyId === e.id}
                  className="flex shrink-0 items-center gap-1 rounded-[2px] bg-primary px-2 py-1 text-[9px] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {pending && busyId === e.id ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-2.5 w-2.5" />
                  )}
                  APPOINT
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
