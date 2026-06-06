"use client"

import { useState, useTransition } from "react"
import { motion } from "framer-motion"
import { Sprout, Loader2, AlertTriangle, Droplets } from "lucide-react"
import { estimateYieldAction } from "@/lib/ai/insights-actions"
import type { YieldEstimate } from "@/lib/ai/insights"

export function YieldEstimator({ crops }: { crops: string[] }) {
  const [crop, setCrop] = useState(crops[0] ?? "")
  const [area, setArea] = useState("1")
  const [result, setResult] = useState<YieldEstimate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run() {
    setError(null)
    startTransition(async () => {
      const res = await estimateYieldAction(crop, Number(area))
      if (res.ok) {
        setResult(res.data)
      } else {
        setResult(null)
        setError(res.error)
      }
    })
  }

  const fitColor =
    result?.rainfallFit === "adequate"
      ? "text-primary"
      : result?.rainfallFit === "low"
        ? "text-accent"
        : "text-foreground/70"

  return (
    <div className="bg-background border border-border rounded-[2px] overflow-hidden">
      <div className="border-b border-border px-4 h-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprout className="w-3 h-3 text-primary" />
          <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.18em]">/ YIELD ESTIMATOR</span>
        </div>
        <span className="mono-xs text-accent text-[8px] tracking-[0.2em] border border-accent/30 px-1.5 py-0.5 rounded-[2px]">
          BETA
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="mono-xs text-[9px] text-muted-foreground/70 tracking-[0.18em] block mb-1.5">
              / CROP
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded-[2px] px-3 py-2 text-[12px] text-foreground outline-none focus:border-primary/50 capitalize"
            >
              {crops.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-28">
            <label className="mono-xs text-[9px] text-muted-foreground/70 tracking-[0.18em] block mb-1.5">
              / AREA (HA)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded-[2px] px-3 py-2 text-[12px] text-foreground outline-none focus:border-primary/50"
            />
          </div>
          <button
            onClick={run}
            disabled={pending}
            className="h-[38px] px-4 bg-primary text-primary-foreground rounded-[2px] mono-xs text-[10px] tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "ESTIMATE"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-accent">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="mono-xs text-[10px] tracking-wider">{error}</span>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pt-3 border-t border-border"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border rounded-[2px] p-3">
                <p className="mono-xs text-[9px] text-muted-foreground/70 tracking-[0.18em] mb-1.5">
                  / PER HECTARE
                </p>
                <p className="font-mono text-xl text-foreground tracking-tight">
                  {result.perHectareRange[0]}–{result.perHectareRange[1]}
                  <span className="mono-xs text-primary/80 text-[10px] ml-1">t/ha</span>
                </p>
              </div>
              <div className="border border-primary/30 bg-primary/5 rounded-[2px] p-3">
                <p className="mono-xs text-[9px] text-muted-foreground/70 tracking-[0.18em] mb-1.5">
                  / TOTAL ({result.areaHectares} HA)
                </p>
                <p className="font-mono text-xl text-primary tracking-tight">
                  {result.totalRange[0]}–{result.totalRange[1]}
                  <span className="mono-xs text-primary/80 text-[10px] ml-1">t</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Droplets className={`w-3 h-3 ${fitColor}`} />
              <span className="mono-xs text-[9px] tracking-wider text-muted-foreground/80">
                90-DAY RAINFALL{" "}
                {result.seasonRainfallMm !== null ? `${result.seasonRainfallMm}MM` : "N/A"} —{" "}
                <span className={fitColor}>{result.rainfallFit.toUpperCase()} FIT</span>
              </span>
            </div>

            {result.summary && (
              <p className="text-[12px] leading-relaxed text-foreground/80">{result.summary}</p>
            )}
          </motion.div>
        )}

        <p className="mono-xs text-[8px] text-muted-foreground/50 tracking-wider leading-relaxed">
          BETA — ROUGH RAIN-FED ESTIMATE FROM REGIONAL BASELINES + REAL RAINFALL. ACTUAL YIELD DEPENDS ON
          SEEDS, INPUTS AND MANAGEMENT.
        </p>
      </div>
    </div>
  )
}
