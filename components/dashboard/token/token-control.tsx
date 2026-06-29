"use client"

import { useState } from "react"
import {
  Coins,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Wallet,
  Lock,
  AlertTriangle,
  CircleCheck,
  CircleSlash,
} from "lucide-react"
import type { TokenStatus } from "@/lib/admin/token-status"

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`
}

function fmt(n: number, max = 4) {
  return n.toLocaleString(undefined, { maximumFractionDigits: max })
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function Field({ label, value, mono = true, copy }: { label: string; value: string; mono?: boolean; copy?: string }) {
  return (
    <div>
      <p className="mono-xs mb-1 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between gap-2 rounded-[2px] border border-border bg-secondary/20 px-3 py-2">
        <span className={`${mono ? "mono-sm" : ""} truncate text-[11px] text-foreground`}>{value}</span>
        {copy && <CopyBtn value={copy} />}
      </div>
    </div>
  )
}

export function TokenControl({ status }: { status: TokenStatus }) {
  const explorerBase = "https://explorer.solana.com"
  const clusterParam = status.network === "mainnet-beta" ? "" : `?cluster=${status.network}`
  const isMainnet = status.network === "mainnet-beta"

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-[3px] border border-primary/30 bg-card p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-[3px] bg-primary/10">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {status.name} <span className="text-muted-foreground">({status.symbol})</span>
            </h2>
            <span
              className={`mono-xs rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${
                isMainnet ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
              }`}
            >
              {isMainnet ? "Mainnet Live" : status.network}
            </span>
          </div>
          <p className="mono-xs mt-0.5 text-[10px] text-muted-foreground">
            Fixed supply Token-2022 asset on Solana {status.network}
          </p>
        </div>
        <a
          href={`${explorerBase}/address/${status.mintAddress}${clusterParam}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-[2px] border border-border px-3 py-2 text-[10px] tracking-[0.1em] text-foreground transition-colors hover:border-primary/40"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          EXPLORER
        </a>
      </div>

      {/* Health banner */}
      {!status.healthy && (
        <div className="flex items-start gap-2 rounded-[2px] border border-accent/40 bg-accent/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Could not read live on-chain data. Your RPC endpoint may be rate-limited or unset. Add a dedicated RPC
            endpoint (Helius/QuickNode) as <span className="mono-sm text-foreground">NEXT_PUBLIC_SOLANA_RPC_ENDPOINT</span>{" "}
            for reliable reads.
          </p>
        </div>
      )}

      {/* Supply + authority */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[3px] border border-border bg-card p-5">
          <p className="mono-xs mb-3 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Supply</p>
          <p className="text-2xl font-semibold text-foreground">
            {fmt(status.onChainSupply ?? status.configuredSupply, 0)}
          </p>
          <p className="mono-xs mt-1 text-[10px] text-muted-foreground">{status.symbol} total · {status.decimals} decimals</p>
          {status.onChainSupply !== null && status.onChainSupply !== status.configuredSupply && (
            <p className="mono-xs mt-2 text-[10px] text-accent">
              Note: app config says {fmt(status.configuredSupply, 0)} — chain says {fmt(status.onChainSupply, 0)}.
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-[3px] border border-border bg-card p-5">
          <p className="mono-xs text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Authorities</p>
          <StatusRow
            ok={status.mintAuthorityRevoked === true}
            okLabel="Mint authority revoked — supply hard-capped"
            badLabel={
              status.mintAuthorityRevoked === null
                ? "Mint authority status unknown"
                : "Mint authority still ACTIVE — more can be minted"
            }
            unknown={status.mintAuthorityRevoked === null}
          />
          <StatusRow
            ok={status.freezeAuthoritySet === false}
            okLabel="Freeze authority disabled — holders can't be frozen"
            badLabel={
              status.freezeAuthoritySet === null
                ? "Freeze authority status unknown"
                : "Freeze authority is set"
            }
            unknown={status.freezeAuthoritySet === null}
          />
        </div>
      </div>

      {/* Mint address */}
      <div className="rounded-[3px] border border-border bg-card p-5">
        <Field label="Mint Address" value={status.mintAddress} copy={status.mintAddress} />
      </div>

      {/* Wallets */}
      <div className="grid gap-4 sm:grid-cols-2">
        <WalletCard
          title="Treasury (cold)"
          subtitle="Master supply — key kept offline"
          icon={<Lock className="h-4 w-4 text-primary" />}
          wallet={status.treasury}
          symbol={status.symbol}
          explorerHref={`${explorerBase}/address/${status.treasury.address}${clusterParam}`}
        />
        <WalletCard
          title="Distributor (hot)"
          subtitle="Signs reward & marketplace payouts"
          icon={<Wallet className="h-4 w-4 text-primary" />}
          wallet={status.distributor}
          symbol={status.symbol}
          explorerHref={`${explorerBase}/address/${status.distributor.address}${clusterParam}`}
          warnLowSol={status.distributor.sol < 0.02}
          configured={status.distributorConfigured}
        />
      </div>

      {/* Operational notes */}
      <div className="space-y-2 rounded-[2px] border border-border bg-secondary/10 p-4">
        <p className="mono-xs text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Operational checklist</p>
        <CheckLine
          ok={status.distributorConfigured}
          label="Distributor signing key configured (V1N3_DISTRIBUTOR_SECRET_KEY)"
        />
        <CheckLine ok={status.rpcCustom} label="Dedicated RPC endpoint configured (recommended for production)" />
        <CheckLine
          ok={status.distributor.sol >= 0.02}
          label="Distributor funded with SOL for transaction fees (≥ 0.02 SOL)"
        />
        <CheckLine ok={status.distributor.v1n3 > 0} label="Distributor holds a V1N3 float to pay out" />
      </div>
    </div>
  )
}

function StatusRow({
  ok,
  okLabel,
  badLabel,
  unknown,
}: {
  ok: boolean
  okLabel: string
  badLabel: string
  unknown?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      {unknown ? (
        <CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      ) : ok ? (
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      ) : (
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      )}
      <p className="text-[11px] leading-snug text-foreground">{ok && !unknown ? okLabel : badLabel}</p>
    </div>
  )
}

function CheckLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CircleCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
      ) : (
        <CircleSlash className="h-3.5 w-3.5 shrink-0 text-accent" />
      )}
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}

function WalletCard({
  title,
  subtitle,
  icon,
  wallet,
  symbol,
  explorerHref,
  warnLowSol,
  configured,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  wallet: { address: string; v1n3: number; sol: number }
  symbol: string
  explorerHref: string
  warnLowSol?: boolean
  configured?: boolean
}) {
  return (
    <div className="space-y-3 rounded-[3px] border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex-1">
          <p className="text-[12px] font-medium text-foreground">{title}</p>
          <p className="mono-xs text-[9px] text-muted-foreground">{subtitle}</p>
        </div>
        {configured === false && (
          <span className="mono-xs rounded-full bg-accent/15 px-2 py-0.5 text-[8px] uppercase tracking-[0.1em] text-accent">
            Not set
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 rounded-[2px] border border-border bg-secondary/20 px-3 py-2">
        <span className="mono-sm truncate text-[11px] text-foreground">{short(wallet.address)}</span>
        <div className="flex items-center gap-2">
          <CopyBtn value={wallet.address} />
          <a href={explorerHref} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[2px] border border-border bg-secondary/10 px-3 py-2">
          <p className="mono-xs text-[8px] uppercase tracking-[0.12em] text-muted-foreground">{symbol}</p>
          <p className="text-sm font-semibold text-foreground">{fmt(wallet.v1n3)}</p>
        </div>
        <div className="rounded-[2px] border border-border bg-secondary/10 px-3 py-2">
          <p className="mono-xs text-[8px] uppercase tracking-[0.12em] text-muted-foreground">SOL</p>
          <p className={`text-sm font-semibold ${warnLowSol ? "text-accent" : "text-foreground"}`}>
            {fmt(wallet.sol, 4)}
          </p>
        </div>
      </div>
      {warnLowSol && (
        <p className="mono-xs text-[9px] leading-relaxed text-accent">
          Low SOL — fund this wallet so it can pay transaction fees on payouts.
        </p>
      )}
    </div>
  )
}
