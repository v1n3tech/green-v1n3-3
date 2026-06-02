"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Check, MapPin } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
}

/* ------------------------------------------------------------------ */
/* Single-select dropdown styled to the app (replaces native <select>) */
/* ------------------------------------------------------------------ */
export function SelectMenu({
  value,
  options,
  onChange,
  placeholder = "Select…",
}: {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

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
        className={`flex w-full items-center justify-between gap-2 rounded-[2px] border bg-secondary/50 px-3 py-2 text-left transition-colors ${
          open ? "border-primary" : "border-border hover:border-primary/40"
        }`}
      >
        <span className={`mono-xs truncate text-[11px] ${selected ? "text-foreground" : "text-muted-foreground/60"}`}>
          {selected ? selected.label : placeholder}
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
            className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-[2px] border border-border bg-card p-1 shadow-lg"
          >
            {options.map((o) => {
              const active = o.value === value
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-[2px] px-2.5 py-2 text-left transition-colors ${
                      active ? "bg-primary/10" : "hover:bg-secondary"
                    }`}
                  >
                    <span className={`mono-xs truncate text-[10px] ${active ? "text-primary" : "text-foreground/80"}`}>
                      {o.label}
                    </span>
                    {active && <Check className="h-3 w-3 flex-shrink-0 text-primary" />}
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

/* ------------------------------------------------------------------ */
/* Multi-select for pickup terminals where a product is available      */
/* ------------------------------------------------------------------ */
export interface TerminalOption {
  id: string
  name: string
  state: string
  lga: string
}

export function TerminalMultiSelect({
  terminals,
  selected,
  onChange,
}: {
  terminals: TerminalOption[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id))
    else onChange([...selected, id])
  }

  const summary =
    selected.length === 0
      ? "Select pickup terminals…"
      : selected.length === 1
        ? terminals.find((t) => t.id === selected[0])?.name ?? "1 terminal"
        : `${selected.length} terminals selected`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-[2px] border bg-secondary/50 px-3 py-2 text-left transition-colors ${
          open ? "border-primary" : "border-border hover:border-primary/40"
        }`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className={`h-3 w-3 flex-shrink-0 ${selected.length ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`mono-xs truncate text-[11px] ${selected.length ? "text-foreground" : "text-muted-foreground/60"}`}>
            {summary}
          </span>
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
            className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-[2px] border border-border bg-card p-1 shadow-lg"
          >
            {terminals.length === 0 && (
              <li className="mono-xs px-2.5 py-2 text-[10px] text-muted-foreground">
                No active terminals yet. Ask an admin to add one.
              </li>
            )}
            {terminals.map((t) => {
              const active = selected.includes(t.id)
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => toggle(t.id)}
                    className={`flex w-full items-start gap-2 rounded-[2px] px-2.5 py-2 text-left transition-colors ${
                      active ? "bg-primary/10" : "hover:bg-secondary"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-[2px] border ${
                        active ? "border-primary bg-primary text-background" : "border-border"
                      }`}
                    >
                      {active && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mono-xs block truncate text-[10px] text-foreground">{t.name}</span>
                      <span className="mono-xs block truncate text-[9px] text-muted-foreground">
                        {t.lga}, {t.state}
                      </span>
                    </span>
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
