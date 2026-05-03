"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  Copy,
  Check,
  User,
  Settings,
  Wallet as WalletIcon,
  LogOut,
  ExternalLink,
  Hash,
  LayoutGrid,
  ShieldAlert,
} from "lucide-react"

export interface UserMenuProfile {
  email?: string | null
  displayName?: string | null
  walletAddress?: string | null
  agroId?: string | null
  role?: string | null
  avatarUrl?: string | null
}

interface UserMenuProps {
  profile: UserMenuProfile
  onSignOut: () => void
}

const ROLE_LABELS: Record<string, string> = {
  agro_executive: "EXECUTIVE",
  gcm: "GCM",
  lgpa: "LGPA",
  scc_member: "SCC",
  admin: "ADMIN",
  user: "MEMBER",
}

function truncate(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

function initialsFor(name: string): string {
  // For callsigns like VERDANT_REAPER_07 → VR
  const parts = name.split(/[_\s\-.]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function UserMenu({ profile, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<"wallet" | "agro" | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handle =
    profile.displayName ??
    (profile.walletAddress
      ? truncate(profile.walletAddress)
      : (profile.email?.split("@")[0]?.toUpperCase() ?? "ANONYMOUS"))

  const roleLabel = profile.role
    ? (ROLE_LABELS[profile.role] ?? profile.role.toUpperCase())
    : null

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return

    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  const copy = async (value: string, kind: "wallet" | "agro") => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1500)
    } catch (err) {
      console.log("[v0] clipboard copy failed:", err)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`group flex items-center gap-2 px-2 sm:px-3 py-1.5 border rounded-[2px] transition-all ${
          open
            ? "border-primary bg-primary/10"
            : "border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10"
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {/* Avatar tile with image or initials */}
        {profile.avatarUrl ? (
          <img 
            src={profile.avatarUrl} 
            alt={handle}
            className="hidden sm:block w-5 h-5 rounded-[2px] border border-primary/40 object-cover"
          />
        ) : (
          <span className="hidden sm:flex items-center justify-center w-5 h-5 bg-primary/15 border border-primary/40 rounded-[2px] mono-xs text-primary text-[9px] font-bold">
            {initialsFor(handle)}
          </span>
        )}
        <span className="status-dot status-dot-pulse sm:hidden" />
        <span className="mono-xs text-primary text-[10px] tracking-wider max-w-[110px] sm:max-w-[160px] truncate">
          {handle}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-primary/70 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+8px)] w-[300px] z-50 max-h-[calc(100vh-96px)] overflow-y-auto rounded-[2px]"
            role="menu"
          >
            {/* Sleek system panel — flush with app background, no milky lift */}
            <div className="relative bg-background border border-border rounded-[2px] shadow-xl shadow-black/60">
              {/* Identity header */}
              <div className="px-4 pt-4 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 blur-md rounded-[2px]" />
                    {profile.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        alt={handle}
                        className="relative w-10 h-10 rounded-[2px] border border-primary/50 object-cover"
                      />
                    ) : (
                      <div className="relative w-10 h-10 flex items-center justify-center bg-primary/10 border border-primary/50 rounded-[2px] mono text-primary text-sm font-bold">
                        {initialsFor(handle)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="mono-sm text-foreground text-[11px] truncate">
                      {handle}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      <span className="mono-xs text-muted-foreground text-[8.5px]">
                        {roleLabel ?? "MEMBER"}
                      </span>
                      {profile.email && (
                        <>
                          <span className="text-border-strong">/</span>
                          <span className="mono-xs text-muted-foreground/80 text-[8.5px] truncate">
                            {profile.email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Identifiers */}
              <div className="px-4 py-3 space-y-2 border-b border-border">
                {profile.walletAddress && (
                  <button
                    onClick={() => copy(profile.walletAddress!, "wallet")}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 bg-input/50 border border-border hover:border-primary/40 hover:bg-primary/5 rounded-[2px] transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <WalletIcon className="w-3 h-3 text-primary/70 shrink-0" />
                      <div className="flex flex-col items-start min-w-0">
                        <span className="mono-xs text-muted-foreground/70 text-[8.5px]">
                          / WALLET
                        </span>
                        <span className="font-mono text-[10px] text-foreground truncate">
                          {truncate(profile.walletAddress)}
                        </span>
                      </div>
                    </div>
                    {copied === "wallet" ? (
                      <Check className="w-3 h-3 text-primary shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                    )}
                  </button>
                )}

                {profile.agroId && (
                  <button
                    onClick={() => copy(profile.agroId!, "agro")}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 bg-input/50 border border-border hover:border-primary/40 hover:bg-primary/5 rounded-[2px] transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Hash className="w-3 h-3 text-primary/70 shrink-0" />
                      <div className="flex flex-col items-start min-w-0">
                        <span className="mono-xs text-muted-foreground/70 text-[8.5px]">
                          / AGRO ID
                        </span>
                        <span className="font-mono text-[10px] text-foreground truncate">
                          {profile.agroId}
                        </span>
                      </div>
                    </div>
                    {copied === "agro" ? (
                      <Check className="w-3 h-3 text-primary shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                    )}
                  </button>
                )}
              </div>

              {/* Nav items */}
              <div className="py-2">
                <MenuLink
                  href="/dashboard"
                  index="01"
                  icon={<LayoutGrid className="w-3.5 h-3.5" />}
                  label="DASHBOARD"
                  onClick={() => setOpen(false)}
                />
                <MenuLink
                  href="/profile"
                  index="02"
                  icon={<User className="w-3.5 h-3.5" />}
                  label="PROFILE"
                  onClick={() => setOpen(false)}
                />
                <MenuLink
                  href="/wallet"
                  index="03"
                  icon={<WalletIcon className="w-3.5 h-3.5" />}
                  label="WALLET"
                  onClick={() => setOpen(false)}
                />
                <MenuLink
                  href="/settings"
                  index="04"
                  icon={<Settings className="w-3.5 h-3.5" />}
                  label="SETTINGS"
                  onClick={() => setOpen(false)}
                />
                {profile.role === 'admin' && (
                  <MenuLink
                    href="/admin"
                    index="05"
                    icon={<ShieldAlert className="w-3.5 h-3.5" />}
                    label="ADMIN"
                    onClick={() => setOpen(false)}
                    accent
                  />
                )}
                {profile.walletAddress && (
                  <a
                    href={`https://solscan.io/account/${profile.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-primary/5 group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="mono-xs text-muted-foreground/50 text-[9px] w-5">
                        {profile.role === 'admin' ? '06' : '05'}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="mono-sm text-foreground/80 group-hover:text-foreground text-[10.5px] tracking-wider transition-colors">
                        VIEW ON SOLSCAN
                      </span>
                    </div>
                  </a>
                )}
              </div>

              {/* Sign out */}
              <div className="border-t border-border">
                <button
                  onClick={() => {
                    setOpen(false)
                    onSignOut()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 group transition-colors"
                  role="menuitem"
                >
                  <span className="mono-xs text-muted-foreground/50 text-[9px] w-5">
                    {profile.role === 'admin' ? '07' : (profile.walletAddress ? '06' : '05')}
                  </span>
                  <LogOut className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
                  <span className="mono-sm text-foreground/70 group-hover:text-destructive text-[10.5px] tracking-wider transition-colors">
                    SIGN OUT
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuLink({
  href,
  index,
  icon,
  label,
  onClick,
  accent,
}: {
  href: string
  index: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 group transition-colors ${
        accent ? 'hover:bg-orange/10' : 'hover:bg-primary/5'
      }`}
      role="menuitem"
    >
      <span className="mono-xs text-muted-foreground/50 text-[9px] w-5">
        {index}
      </span>
      <span className={`transition-colors ${
        accent 
          ? 'text-orange group-hover:text-orange' 
          : 'text-muted-foreground group-hover:text-primary'
      }`}>
        {icon}
      </span>
      <span className={`mono-sm text-[10.5px] tracking-wider transition-colors ${
        accent 
          ? 'text-orange group-hover:text-orange' 
          : 'text-foreground/80 group-hover:text-foreground'
      }`}>
        {label}
      </span>
    </Link>
  )
}
