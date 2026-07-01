"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Send,
  Snowflake,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Terminal,
  AlertTriangle,
} from "lucide-react"
import type { TokenTx } from "@/lib/admin/token-status"

function fmt(n: number, max = 4) {
  return n.toLocaleString(undefined, { maximumFractionDigits: max })
}

function short(addr: string) {
  return addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : "—"
}

function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      aria-label={label ?? "Copy"}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      {label && <span className="mono-xs text-[9px] uppercase tracking-[0.1em]">{copied ? "Copied" : label}</span>}
    </button>
  )
}

export function TokenOperations({
  symbol,
  network,
  distributorAddress,
  distributorBalance,
  distributorConfigured,
  treasuryAddress,
  mintAddress,
  explorerBase,
  clusterParam,
  distributorTxs,
}: {
  symbol: string
  network: string
  distributorAddress: string
  distributorBalance: number
  distributorConfigured: boolean
  treasuryAddress: string
  mintAddress: string
  explorerBase: string
  clusterParam: string
  distributorTxs: TokenTx[]
}) {
  const router = useRouter()

  // Distributor send state
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ signature: string; explorerUrl: string; amount: number } | null>(null)

  // Treasury command generator state
  const [tRecipient, setTRecipient] = useState("")
  const [tAmount, setTAmount] = useState("")

  const treasuryCommand =
    `spl-token transfer ${mintAddress} ${tAmount || "<AMOUNT>"} ` +
    `${tRecipient || "<RECIPIENT_ADDRESS>"} --fund-recipient --allow-unfunded-recipient`

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const amt = Number(amount)
    if (!recipient.trim()) return setError("Enter a recipient address.")
    if (!Number.isFinite(amt) || amt <= 0) return setError("Enter a valid amount.")
    if (amt > distributorBalance) return setError(`Amount exceeds distributor balance (${fmt(distributorBalance)} ${symbol}).`)

    setSending(true)
    try {
      const res = await fetch("/api/admin/token/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: recipient.trim(), amount: amt, note: note.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Transfer failed.")
      } else {
        setSuccess({ signature: data.signature, explorerUrl: data.explorerUrl, amount: data.amount })
        setRecipient("")
        setAmount("")
        setNote("")
        router.refresh()
      }
    } catch {
      setError("Network error — please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Distributor send (hot) */}
      <div className="rounded-[3px] border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="text-[12px] font-medium text-foreground">Send from Distributor</p>
            <p className="mono-xs text-[9px] text-muted-foreground">
              Signed server-side · hot wallet · {fmt(distributorBalance)} {symbol} available
            </p>
          </div>
        </div>

        {!distributorConfigured && (
          <div className="mb-4 flex items-start gap-2 rounded-[2px] border border-accent/40 bg-accent/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Distributor signing key not configured. Set{" "}
              <span className="mono-sm text-foreground">V1N3_DISTRIBUTOR_SECRET_KEY</span> to enable sending.
            </p>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="mono-xs mb-1 block text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              Recipient address
            </label>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Solana wallet address"
              disabled={sending || !distributorConfigured}
              className="mono-sm w-full rounded-[2px] border border-border bg-secondary/20 px-3 py-2 text-[11px] text-foreground outline-none focus:border-primary/50 disabled:opacity-50"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mono-xs mb-1 block text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                Amount ({symbol})
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                disabled={sending || !distributorConfigured}
                className="mono-sm w-full rounded-[2px] border border-border bg-secondary/20 px-3 py-2 text-[11px] text-foreground outline-none focus:border-primary/50 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mono-xs mb-1 block text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                Note (optional)
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Cohort reward"
                disabled={sending || !distributorConfigured}
                className="w-full rounded-[2px] border border-border bg-secondary/20 px-3 py-2 text-[11px] text-foreground outline-none focus:border-primary/50 disabled:opacity-50"
              />
            </div>
          </div>

          {error && <p className="text-[11px] text-accent">{error}</p>}
          {success && (
            <div className="flex items-center justify-between gap-2 rounded-[2px] border border-primary/30 bg-primary/5 px-3 py-2">
              <span className="text-[11px] text-foreground">
                Sent {fmt(success.amount)} {symbol}
              </span>
              <a
                href={success.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-primary hover:underline"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !distributorConfigured}
            className="flex items-center justify-center gap-2 rounded-[2px] bg-primary px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {sending ? "Sending" : `Send ${symbol}`}
          </button>
        </form>
      </div>

      {/* Treasury command generator (cold) */}
      <div className="rounded-[3px] border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Snowflake className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="text-[12px] font-medium text-foreground">Move from Treasury (cold)</p>
            <p className="mono-xs text-[9px] text-muted-foreground">
              The master key stays offline. Generate a command to run on your secure machine.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mono-xs mb-1 block text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              Recipient (e.g. distributor)
            </label>
            <input
              value={tRecipient}
              onChange={(e) => setTRecipient(e.target.value)}
              placeholder={distributorAddress}
              className="mono-sm w-full rounded-[2px] border border-border bg-secondary/20 px-3 py-2 text-[11px] text-foreground outline-none focus:border-primary/50"
            />
            <button
              type="button"
              onClick={() => setTRecipient(distributorAddress)}
              className="mono-xs mt-1 text-[9px] uppercase tracking-[0.1em] text-primary hover:underline"
            >
              Use distributor
            </button>
          </div>
          <div>
            <label className="mono-xs mb-1 block text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              Amount ({symbol})
            </label>
            <input
              value={tAmount}
              onChange={(e) => setTAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="mono-sm w-full rounded-[2px] border border-border bg-secondary/20 px-3 py-2 text-[11px] text-foreground outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="mono-xs flex items-center gap-1 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              <Terminal className="h-3 w-3" /> Run on your secure machine
            </span>
            <CopyBtn value={treasuryCommand} label="Copy" />
          </div>
          <pre className="mono-sm overflow-x-auto rounded-[2px] border border-border bg-secondary/30 p-3 text-[10px] leading-relaxed text-foreground">
            {treasuryCommand}
          </pre>
        </div>
      </div>

      {/* Recent distributor activity */}
      <div className="rounded-[3px] border border-border bg-card p-5">
        <p className="mono-xs mb-3 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
          Recent distributor activity
        </p>
        {distributorTxs.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No recent on-chain activity found.</p>
        ) : (
          <ul className="divide-y divide-border">
            {distributorTxs.map((tx) => (
              <li key={tx.signature} className="flex items-center gap-3 py-2.5">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] ${
                    tx.type === "receive" ? "bg-primary/10" : "bg-secondary/40"
                  }`}
                >
                  {tx.type === "receive" ? (
                    <ArrowDownLeft className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-foreground">
                    {tx.type === "receive" ? "Received" : "Sent"} {fmt(tx.amount)} {symbol}
                  </p>
                  <p className="mono-xs text-[9px] text-muted-foreground">
                    {tx.type === "receive" ? "from" : "to"} {short(tx.counterparty)} ·{" "}
                    {tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString() : "—"}
                  </p>
                </div>
                <a
                  href={`${explorerBase}/tx/${tx.signature}${clusterParam}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="View transaction"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
