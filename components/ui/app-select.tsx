'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

export interface AppSelectOption {
  value: string
  label: string
}

interface AppSelectProps {
  value: string
  onChange: (value: string) => void
  options: AppSelectOption[]
  placeholder?: string
  /** Extra classes for the outer wrapper (use to control width). */
  className?: string
  /** Aligns the popup panel to the right edge of the trigger. */
  align?: 'left' | 'right'
  ariaLabel?: string
}

/**
 * App-styled dropdown that mirrors the terminal aesthetic used across the
 * dashboard (mono text, `bg-secondary/50`, `border-border`, rounded-[2px]).
 * Replaces native <select> so the popup matches the app instead of the OS.
 */
export function AppSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  align = 'left',
  ariaLabel,
}: AppSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px] mono-xs text-xs outline-none transition-colors hover:border-primary/40 focus:border-primary/50 data-[open=true]:border-primary/50"
        data-open={open}
      >
        <span className={`truncate ${selected ? 'text-foreground' : 'text-muted-foreground/50'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            role="listbox"
            className={`absolute z-50 mt-1 min-w-full max-h-60 overflow-y-auto bg-background border border-border rounded-[2px] shadow-xl shadow-black/40 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {options.map((opt) => {
              const isActive = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left mono-xs text-[11px] transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:bg-secondary'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isActive && <Check className="w-3 h-3 shrink-0" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
