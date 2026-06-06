"use client"

import useSWR from "swr"
import { motion } from "framer-motion"
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  Droplets,
  Wind,
  Sparkles,
  AlertTriangle,
} from "lucide-react"
import type { WeatherForecast } from "@/lib/ai/weather"

type WeatherResponse = {
  forecast: WeatherForecast
  advisory: string | null
  disclaimer: string
}

const fetcher = async (url: string): Promise<WeatherResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("weather unavailable")
  return res.json()
}

function conditionIcon(conditions: string, className: string) {
  const c = conditions.toLowerCase()
  if (c.includes("thunder") || c.includes("rain") || c.includes("drizzle") || c.includes("shower"))
    return <CloudRain className={className} />
  if (c.includes("overcast") || c.includes("fog")) return <Cloud className={className} />
  if (c.includes("cloud")) return <CloudSun className={className} />
  return <Sun className={className} />
}

export function WeatherCard() {
  const { data, error, isLoading } = useSWR<WeatherResponse>("/api/ai/weather", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 1000 * 60 * 15,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-background border border-border rounded-[2px] overflow-hidden"
    >
      <div className="border-b border-border px-4 h-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudSun className="w-3 h-3 text-primary" />
          <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.18em]">/ FIELD WEATHER</span>
        </div>
        <span className="mono-xs text-muted-foreground/60 text-[9px] tracking-wider">
          {data?.forecast.location?.toUpperCase() ?? "PLATEAU"}
        </span>
      </div>

      <div className="p-4">
        {isLoading && (
          <div className="space-y-3">
            <div className="h-12 w-32 bg-border/50 rounded-[2px] animate-pulse" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-border/40 rounded-[2px] animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground/70 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-accent" />
            <span className="mono-xs text-[10px] tracking-wider">WEATHER FEED OFFLINE — RETRY SHORTLY</span>
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-4">
            {/* Current */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {data.forecast.current &&
                  conditionIcon(data.forecast.current.conditions, "w-9 h-9 text-primary")}
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl text-foreground tracking-tight">
                      {data.forecast.current ? Math.round(data.forecast.current.temperature) : "—"}
                    </span>
                    <span className="mono-xs text-primary/80 text-[11px]">°C</span>
                  </div>
                  <p className="mono-xs text-[9px] text-muted-foreground/70 tracking-wider mt-0.5">
                    {data.forecast.current?.conditions.toUpperCase() ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 text-right">
                <span className="mono-xs text-[9px] text-muted-foreground/70 tracking-wider flex items-center gap-1 justify-end">
                  <Droplets className="w-2.5 h-2.5 text-primary/70" />
                  {data.forecast.current?.humidity ?? 0}% HUMIDITY
                </span>
                <span className="mono-xs text-[9px] text-muted-foreground/70 tracking-wider flex items-center gap-1 justify-end">
                  <Wind className="w-2.5 h-2.5 text-primary/70" />
                  {Math.round(data.forecast.current?.windSpeed ?? 0)} KM/H
                </span>
                <span className="mono-xs text-[9px] text-muted-foreground/70 tracking-wider flex items-center gap-1 justify-end">
                  <CloudRain className="w-2.5 h-2.5 text-primary/70" />
                  {data.forecast.recentRainfallMm}MM / 7D
                </span>
              </div>
            </div>

            {/* 5-day strip */}
            <div className="grid grid-cols-5 gap-2 pt-3 border-t border-border">
              {data.forecast.daily.slice(0, 5).map((d) => {
                const day = new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1.5">
                    <span className="mono-xs text-[8px] text-muted-foreground/60 tracking-wider">{day}</span>
                    {conditionIcon(d.conditions, "w-4 h-4 text-primary/80")}
                    <span className="font-mono text-[10px] text-foreground">{Math.round(d.tempMax)}°</span>
                    <span className="mono-xs text-[8px] text-primary/70">{d.precipitationProbability}%</span>
                  </div>
                )
              })}
            </div>

            {/* AI advisory */}
            {data.advisory && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-2.5 h-2.5 text-primary" />
                  <span className="mono-xs text-[9px] text-primary tracking-[0.18em]">/ AI FIELD ADVISORY</span>
                </div>
                <p className="text-[12px] leading-relaxed text-foreground/80">{data.advisory}</p>
                <p className="mono-xs text-[8px] text-muted-foreground/50 tracking-wider mt-2">
                  {data.disclaimer.toUpperCase()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
