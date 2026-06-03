"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

/* ----------------------------------------------------------------------------
 * Shared visual chrome for the fulfillment surfaces (Orders / Marketing /
 * Logistics). Keeps the sleek, motion-driven look consistent with the rest of
 * the dashboard (stat tiles, mono headings, token-based status pills).
 * ------------------------------------------------------------------------- */

export function PageHeading({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-border bg-secondary/40 text-primary">
          {icon}
        </div>
        <div>
          <h1 className="mono-sm text-sm text-foreground">{title}</h1>
          {subtitle && <p className="mono-xs text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  )
}

export interface StatDef {
  icon: ReactNode
  label: string
  value: number | string
  tone?: "primary" | "accent" | "orange" | "muted"
}

export function StatsBar({ stats }: { stats: StatDef[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stats.map((s) => (
        <div key={s.label} className="rounded-[2px] border border-border bg-background p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className={toneText(s.tone)}>{s.icon}</span>
            <span className="mono-xs text-[9px] text-muted-foreground">{s.label}</span>
          </div>
          <p className="font-mono text-lg text-foreground tabular-nums">
            {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
          </p>
        </div>
      ))}
    </motion.div>
  )
}

function toneText(tone: StatDef["tone"]) {
  switch (tone) {
    case "accent":
      return "text-accent"
    case "orange":
      return "text-orange"
    case "muted":
      return "text-muted-foreground"
    default:
      return "text-primary"
  }
}

/* Status pill ------------------------------------------------------------- */

type Tone = "neutral" | "warning" | "info" | "success" | "danger"

const TONE_CLS: Record<Tone, string> = {
  neutral: "border-border bg-secondary/50 text-muted-foreground",
  warning: "border-orange/30 bg-orange-soft text-orange",
  info: "border-primary/30 bg-primary/10 text-primary",
  success: "border-primary/40 bg-primary/15 text-primary",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
}

const STATUS_TONE: Record<string, Tone> = {
  awaiting_choice: "warning",
  pending: "warning",
  awaiting_pickup: "info",
  delivery_paid: "info",
  accepted: "info",
  scheduled: "info",
  in_transit: "info",
  awaiting_confirmation: "warning",
  fulfilled: "success",
  completed: "success",
  delivered: "success",
  cancelled: "danger",
}

export function StatusPill({ status }: { status?: string | null }) {
  if (!status) return null
  const tone = STATUS_TONE[status] ?? "neutral"
  return (
    <span
      className={`mono-xs inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[8px] ${TONE_CLS[tone]}`}
    >
      {status.replace(/_/g, " ").toUpperCase()}
    </span>
  )
}
