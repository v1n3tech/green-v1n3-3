"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Gift,
  Coins,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Receipt,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import type { PointsSummary, FeesSummary } from "@/lib/rewards/data"

function fmt(n: number, max = 2): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: max })
}

const REASON_LABELS: Record<string, string> = {
  marketplace_purchase: "Marketplace purchase",
  points_conversion: "Redeemed for V1N3",
  conversion_refund: "Refund",
}

export function RewardsDashboard({
  summary,
  fees,
}: {
  summary: PointsSummary
  fees: FeesSummary | null
}) {
  const router = useRouter()
  const { config } = summary

  const [amount, setAmount] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; url?: string } | null>(null)

  const points = Math.floor(Number(amount)) || 0
  const estV1n3 = useMemo(() => points / config.pointsPerV1n3, [points, config.pointsPerV1n3])
  const canConvert =
    points >= config.minConversionPoints && points <= summary.balance && !loading

  async function handleConvert() {
    setMessage(null)
    if (!canConvert) return
    setLoading(true)
    try {
      const res = await fetch("/api/rewards/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.error ?? "Conversion failed" })
      } else {
        setMessage({
          type: "success",
          text: `Converted ${fmt(data.pointsSpent)} points into ${fmt(data.v1n3Amount, 6)} V1N3.`,
          url: data.explorerUrl,
        })
        setAmount("")
        router.refresh()
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const progressToNext =
    config.pointsPerV1n3 > 0 ? (summary.balance % config.pointsPerV1n3) / config.pointsPerV1n3 : 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="mono-xs text-[9px] text-muted-foreground/60 tracking-[0.2em] mb-1">/ REWARDS</p>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Loyalty Rewards
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-pretty">
            Earn {config.pointsPerTransaction} points on every marketplace purchase. Redeem{" "}
            {fmt(config.pointsPerV1n3)} points for 1 V1N3.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Sparkles className="w-4 h-4 text-primary" />}
          label="POINTS BALANCE"
          value={fmt(summary.balance)}
          accent
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
          label="LIFETIME EARNED"
          value={fmt(summary.lifetime)}
        />
        <StatCard
          icon={<Coins className="w-4 h-4 text-muted-foreground" />}
          label="REDEEMABLE V1N3"
          value={fmt(summary.balance / config.pointsPerV1n3, 4)}
        />
        <StatCard
          icon={<Gift className="w-4 h-4 text-muted-foreground" />}
          label="EARN RATE"
          value={`${config.pointsPerTransaction} / order`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Convert card */}
        <div className="border border-border rounded-[2px] bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="mono-sm text-sm font-medium flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              Convert points to V1N3
            </h2>
            <span className="mono-xs text-[10px] text-muted-foreground">
              {fmt(config.pointsPerV1n3)} pts = 1 V1N3
            </span>
          </div>

          {/* progress to next V1N3 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="mono-xs text-[10px] text-muted-foreground">Progress to next V1N3</span>
              <span className="mono-xs text-[10px] text-foreground/80">
                {fmt(summary.balance % config.pointsPerV1n3)} / {fmt(config.pointsPerV1n3)}
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, progressToNext * 100)}%` }}
              />
            </div>
          </div>

          <label className="mono-xs text-[10px] text-muted-foreground/70 tracking-wider">
            POINTS TO REDEEM
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(config.minConversionPoints)}
              className="flex-1 bg-secondary/50 border border-border rounded-[2px] px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
            />
            <button
              onClick={() =>
                setAmount(
                  String(
                    Math.floor(summary.balance / config.pointsPerV1n3) * config.pointsPerV1n3,
                  ),
                )
              }
              className="mono-xs text-[10px] px-3 py-2.5 border border-border rounded-[2px] hover:border-primary/50 hover:text-primary transition-colors"
            >
              MAX
            </button>
          </div>

          <div className="flex items-center justify-between mt-3 px-3 py-2.5 bg-secondary/30 border border-border rounded-[2px]">
            <span className="mono-xs text-[10px] text-muted-foreground">You receive</span>
            <span className="mono-sm text-sm text-primary flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              {fmt(estV1n3, 6)} V1N3
            </span>
          </div>

          {points > 0 && points < config.minConversionPoints && (
            <p className="mono-xs text-[10px] text-muted-foreground mt-2">
              Minimum {fmt(config.minConversionPoints)} points required.
            </p>
          )}
          {points > summary.balance && (
            <p className="mono-xs text-[10px] text-destructive mt-2">Exceeds your points balance.</p>
          )}

          <button
            onClick={handleConvert}
            disabled={!canConvert}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-[2px] bg-primary text-primary-foreground mono-sm text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Converting...
              </>
            ) : (
              <>
                <Coins className="w-4 h-4" /> Redeem points
              </>
            )}
          </button>

          {message && (
            <div
              className={`mt-3 flex items-start gap-2 px-3 py-2.5 rounded-[2px] border text-xs ${
                message.type === "success"
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p>{message.text}</p>
                {message.url && (
                  <a
                    href={message.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono-xs text-[10px] text-primary inline-flex items-center gap-1 mt-1 hover:underline"
                  >
                    View transaction <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {!summary.walletAddress && (
            <p className="mono-xs text-[10px] text-muted-foreground mt-3 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Set up your wallet to redeem points.
            </p>
          )}
        </div>

        {/* Activity */}
        <div className="border border-border rounded-[2px] bg-card p-5">
          <h2 className="mono-sm text-sm font-medium flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-primary" />
            Points activity
          </h2>
          {summary.ledger.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">No activity yet.</p>
              <p className="mono-xs text-[10px] text-muted-foreground/60 mt-1">
                Make a marketplace purchase to start earning.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
              {summary.ledger.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between px-3 py-2.5 bg-secondary/30 border border-border rounded-[2px]"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-foreground/90 truncate">
                      {REASON_LABELS[row.reason] ?? row.reason}
                    </p>
                    <p className="mono-xs text-[9px] text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`mono-sm text-xs flex-shrink-0 ${
                      row.delta >= 0 ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {row.delta >= 0 ? "+" : ""}
                    {fmt(row.delta)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin treasury / fees panel */}
      {fees && <AdminFeesPanel fees={fees} />}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-[2px] p-4 ${
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="mono-xs text-[9px] text-muted-foreground/70 tracking-[0.15em]">{label}</span>
      </div>
      <p className={`text-xl font-semibold tracking-tight ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </motion.div>
  )
}

function AdminFeesPanel({ fees }: { fees: FeesSummary }) {
  return (
    <div className="border border-primary/30 rounded-[2px] bg-primary/5 p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="mono-sm text-sm font-medium flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          Treasury — Platform fees collected
        </h2>
        <span className="mono-xs text-[9px] px-2 py-1 border border-primary/30 rounded-[2px] text-primary tracking-wider">
          ADMIN / DEV WALLET
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={<Coins className="w-4 h-4 text-primary" />}
          label="TOTAL FEES (V1N3)"
          value={fmt(fees.totalFeeV1n3, 4)}
          accent
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
          label="TOTAL FEES (NGN)"
          value={`₦${fmt(fees.totalFeeNgn, 0)}`}
        />
        <StatCard
          icon={<Receipt className="w-4 h-4 text-muted-foreground" />}
          label="LAST 7D (V1N3)"
          value={fmt(fees.fee7dV1n3, 4)}
        />
        <StatCard
          icon={<Receipt className="w-4 h-4 text-muted-foreground" />}
          label="FEE ORDERS"
          value={fmt(fees.orderCount)}
        />
      </div>

      <p className="mono-xs text-[10px] text-muted-foreground/70 tracking-wider mb-2">/ RECENT FEES</p>
      {fees.recent.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No fees collected yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
          {fees.recent.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between px-3 py-2.5 bg-card border border-border rounded-[2px]"
            >
              <div className="min-w-0">
                <p className="text-xs text-foreground/90 truncate">{row.product_title}</p>
                <p className="mono-xs text-[9px] text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="mono-sm text-xs text-primary">+{fmt(row.platform_fee_v1n3, 4)} V1N3</p>
                <p className="mono-xs text-[9px] text-muted-foreground">₦{fmt(row.platform_fee_ngn, 0)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
