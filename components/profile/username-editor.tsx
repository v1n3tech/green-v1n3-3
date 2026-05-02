"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Pencil, X } from "lucide-react"
import { updateDisplayName } from "@/lib/auth/actions"

const NAME_RE = /^[A-Za-z0-9_-]+$/

interface Props {
  initial: string | null
}

/**
 * Inline editor for the user's display_name (callsign). Renders the name as
 * a large terminal-style heading with a small EDIT control. On submit it
 * calls `updateDisplayName`, which validates format/uniqueness and (for the
 * first user to claim "mantim") atomically promotes them to admin.
 */
export function UsernameEditor({ initial }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initial ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const cancel = () => {
    setEditing(false)
    setValue(initial ?? "")
    setError(null)
  }

  const submit = async () => {
    const next = value.trim()
    if (!next) {
      setError("username cannot be empty")
      return
    }
    if (next === initial) {
      setEditing(false)
      return
    }
    if (next.length < 3 || next.length > 24) {
      setError("must be 3–24 characters")
      return
    }
    if (!NAME_RE.test(next)) {
      setError("letters, numbers, _ and - only")
      return
    }

    setSubmitting(true)
    setError(null)
    const result = await updateDisplayName(next)
    setSubmitting(false)

    if (result.error) {
      setError(result.error.toLowerCase())
      return
    }

    setEditing(false)
    setSuccess(
      next.toLowerCase() === "mantim"
        ? "FOUNDER CLAIM ACCEPTED — ADMIN PRIVILEGES GRANTED"
        : "CALLSIGN UPDATED",
    )
    setTimeout(() => setSuccess(null), 4000)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="mono-xs text-primary/80 text-[9px] tracking-[0.25em]">
          / CALLSIGN
        </p>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-2 py-1 border border-border hover:border-primary/50 hover:bg-primary/5 rounded-[2px] mono-xs text-muted-foreground hover:text-primary text-[9px] tracking-wider transition-colors"
            aria-label="Edit callsign"
          >
            <Pencil className="w-2.5 h-2.5" />
            EDIT
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  submit()
                } else if (e.key === "Escape") {
                  e.preventDefault()
                  cancel()
                }
              }}
              maxLength={24}
              spellCheck={false}
              autoComplete="off"
              className="flex-1 min-w-0 font-mono text-2xl sm:text-3xl text-foreground tracking-[0.18em] bg-transparent border-b border-primary/40 focus:border-primary outline-none px-0 py-1"
              placeholder="YOUR_CALLSIGN"
            />
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-[2px] mono-xs hover:bg-primary/90 transition-colors disabled:opacity-50 text-[9.5px] tracking-wider shrink-0"
              aria-label="Save callsign"
            >
              {submitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              SAVE
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={submitting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border hover:border-destructive/40 rounded-[2px] mono-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 text-[9.5px] tracking-wider shrink-0"
              aria-label="Cancel"
            >
              <X className="w-3 h-3" />
              CANCEL
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pl-0.5">
            <p className="mono-xs text-muted-foreground/55 text-[9px] tracking-wider">
              3–24 CHARS / LETTERS, NUMBERS, _ , -
            </p>
            <p className="mono-xs text-muted-foreground/40 text-[9px] tracking-wider">
              {value.length}/24
            </p>
          </div>

          {error && (
            <p className="mono-xs text-destructive text-[9.5px] tracking-wider uppercase">
              / {error}
            </p>
          )}
        </div>
      ) : (
        <h1 className="font-mono text-2xl sm:text-3xl text-foreground tracking-[0.18em] truncate">
          {initial ?? "ANONYMOUS"}
        </h1>
      )}

      {success && (
        <p className="mono-xs text-primary text-[9.5px] tracking-wider">
          / {success}
        </p>
      )}
    </div>
  )
}
