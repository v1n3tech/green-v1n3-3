"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink, Wallet as WalletIcon } from "lucide-react"

interface ProfileWalletCardProps {
  walletAddress: string | null
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`
}

/**
 * Profile-page Solana wallet card.
 *
 * Renders the same terminal-panel chrome as the other profile sections
 * (border-only header strip, no milky fill). Clicking the address copies
 * the full base58 string to clipboard. Solscan link is wired only when an
 * address is present.
 */
export function ProfileWalletCard({ walletAddress }: ProfileWalletCardProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!walletAddress) return
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.log("[v0] profile wallet copy failed:", err)
    }
  }

  return (
    <div className="border border-border rounded-[2px] overflow-hidden">
      {/* Header strip */}
      <div className="border-b border-border px-4 h-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="status-dot status-dot-pulse" />
          <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.2em]">
            / WALLET
          </span>
        </div>
        <span className="mono-xs text-primary/80 text-[9px] tracking-wider">
          SOLANA
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Identity */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 flex items-center justify-center bg-primary/10 border border-primary/40 rounded-[2px] shrink-0">
            <WalletIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.2em] mb-1">
              / SOCIAL WALLET
            </p>
            <p className="mono-sm text-foreground text-[11px] tracking-wider">
              V1N3 SOCIAL VAULT
            </p>
          </div>
        </div>

        {/* Address */}
        <div>
          <p className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.2em] mb-1.5">
            / ADDRESS
          </p>
          <button
            onClick={copy}
            disabled={!walletAddress}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 border border-border hover:border-primary/40 hover:bg-primary/5 rounded-[2px] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border"
          >
            <span className="font-mono text-[10.5px] text-foreground/85 truncate tracking-wider">
              {walletAddress ? truncate(walletAddress) : "—"}
            </span>
            {copied ? (
              <Check className="w-3 h-3 text-primary shrink-0" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            )}
          </button>
        </div>

        {/* Solscan */}
        {walletAddress && (
          <a
            href={`https://solscan.io/account/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 border border-border hover:border-primary/50 hover:bg-primary/5 rounded-[2px] transition-colors group"
          >
            <span className="mono-sm text-foreground/80 group-hover:text-foreground text-[10.5px] tracking-wider transition-colors">
              VIEW ON SOLSCAN
            </span>
            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        )}
      </div>
    </div>
  )
}
