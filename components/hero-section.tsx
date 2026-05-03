'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  const [date, setDate] = useState('')
  const [captureTime, setCaptureTime] = useState('00:00')

  useEffect(() => {
    const now = new Date()
    const day = now.getDate().toString().padStart(2, '0')
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const year = now.getFullYear()
    setDate(`${day}.${month}.${year}`)

    const updateCapture = () => {
      const n = new Date()
      setCaptureTime(`${n.getMinutes().toString().padStart(2, '0')}:${n.getSeconds().toString().padStart(2, '0')}`)
    }
    updateCapture()
    const interval = setInterval(updateCapture, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="pt-24 sm:pt-28 md:pt-32 lg:pt-[120px] pb-12 sm:pb-16 md:pb-20 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 grid-pattern" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Status Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8 md:mb-10"
        >
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="status-dot" />
            <span className="mono-xs text-foreground/90">AGROV1N3 PROGRAM</span>
          </div>
          <div className="px-2 sm:px-3 py-1 sm:py-1.5 border border-primary/50 rounded-[2px]">
            <span className="mono-xs text-primary">BUILT ON SOLANA</span>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 px-2.5 py-1 rounded-full border border-orange/25 bg-orange-soft">
            <span className="relative flex h-1.5 w-1.5 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-orange rec-ping" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-orange" />
            </span>
            <span className="mono-xs text-orange tracking-[0.12em]">PHASE 01 : PLATEAU STATE</span>
          </div>
        </motion.div>

        {/* Section Label */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-6 sm:mb-8 md:mb-10"
        >
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-1 h-4 sm:h-5 bg-primary" />
            <span className="mono-xs text-primary">/ 00 — MANIFESTO</span>
          </div>
          <span className="mono-xs text-muted-foreground">{date}</span>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 xl:gap-20 items-start">
          {/* Left: Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4rem] leading-[1.05] tracking-tight font-mono">
              <span className="text-foreground">Cultivating</span>
              <br />
              <span className="text-primary">Nigeria&apos;s</span>
              <span className="text-foreground"> next</span>
              <br />
              <span className="text-foreground">economy</span>
              <span className="text-primary">.</span>
            </h1>

            <p className="mt-6 sm:mt-8 md:mt-10 text-sm sm:text-base md:text-lg text-foreground/50 max-w-lg leading-relaxed">
              Green V1n3 is the operating system for the AgroV1n3 program — a country-scale field 
              network where ten thousand young Nigerians work fourteen agricultural disciplines, on-chain.
            </p>

            <div className="mt-6 sm:mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 bg-primary text-background rounded-[2px] mono-sm hover:bg-primary/90 transition-colors group">
                <span className="text-xs sm:text-sm">BECOME AN AGRO EXECUTIVE</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 border border-border hover:border-border-strong rounded-[2px] mono-sm text-foreground/70 hover:text-foreground transition-all">
                <span className="text-xs sm:text-sm">EXPLORE COMMUNITIES</span>
              </button>
            </div>

            {/* Stats */}
            <div className="mt-10 sm:mt-12 md:mt-14 pt-6 sm:pt-8 border-t border-border flex flex-wrap gap-6 sm:gap-8 md:gap-10">
              <div>
                <div className="mono text-xl sm:text-2xl text-primary">10K+</div>
                <div className="mono-xs text-muted-foreground mt-0.5 sm:mt-1">TARGET EXECUTIVES</div>
              </div>
              <div>
                <div className="mono text-xl sm:text-2xl text-foreground">14</div>
                <div className="mono-xs text-muted-foreground mt-0.5 sm:mt-1">COMMUNITIES</div>
              </div>
              <div>
                <div className="mono text-xl sm:text-2xl text-foreground">17</div>
                <div className="mono-xs text-muted-foreground mt-0.5 sm:mt-1">LOCAL GOVERNMENTS</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Featured Image — Sleek Media Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative"
          >
            {/* Visible vertical spec rail (replaces faint floating text) */}
            <div className="absolute -left-7 lg:-left-9 top-8 hidden xl:flex spec-rail">
              <span className="spec-dot orange" />
              <span className="spec-text">EXEC—01</span>
              <span className="h-3 w-px bg-border" />
              <span className="spec-text">PLATEAU</span>
              <span className="spec-dot" />
            </div>

            {/* Top Meta Strip */}
            <div className="flex items-center justify-between pb-3 mb-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-orange-soft border border-orange/30">
                  <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-orange rec-ping" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-orange" />
                  </span>
                  <span className="mono-xs text-orange tracking-[0.14em] text-[9px] sm:text-[10px]">REC</span>
                </div>
                <span className="mono-xs text-muted-foreground hidden sm:inline">FRAME / {captureTime}</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="mono-xs text-muted-foreground hidden sm:inline">CH—01</span>
                <span className="mono-xs text-foreground/70">AGV—0001.A</span>
              </div>
            </div>

            {/* Sleek Media Frame */}
            <div className="media-frame group p-1.5 sm:p-2">
              <div className="media-plate aspect-[4/3]">
                <Image
                  src="/images/hero-farmer.jpg"
                  alt="Agro Executive — Amina Yusuf"
                  fill
                  className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
                  priority
                />

                {/* Subtle scanlines */}
                <div className="pointer-events-none absolute inset-0 frame-scanlines opacity-30 mix-blend-overlay" />

                {/* Cinematic falloff */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-background/40" />

                {/* Top-right: frame counter chip */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-background/60 backdrop-blur-md border border-border rounded-full">
                    <span className="mono-xs text-foreground/80 text-[9px] sm:text-[10px]">01 / 14</span>
                    <span className="h-2.5 w-px bg-border" />
                    <span className="flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-orange" />
                      <span className="mono-xs text-orange text-[9px] sm:text-[10px]">LIVE</span>
                    </span>
                  </div>
                </div>

                {/* Top-left: discipline tag */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-background/60 backdrop-blur-md border border-border rounded-full">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    <span className="mono-xs text-foreground/80 text-[9px] sm:text-[10px]">CROP / 04</span>
                  </div>
                </div>

                {/* Bottom credential block */}
                <div className="absolute inset-x-0 bottom-0 px-4 pb-4 sm:px-6 sm:pb-5 pt-12 z-10">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                        <span className="h-px w-5 sm:w-7 bg-orange" />
                        <span className="mono-xs text-orange text-[9px] sm:text-[10px] tracking-[0.18em]">EXEC // 0001</span>
                      </div>
                      <div className="font-mono text-lg sm:text-2xl text-foreground tracking-wide leading-none">
                        Amina Yusuf
                      </div>
                      <div className="mono-xs text-foreground/55 mt-2 text-[9px] sm:text-[10px]">
                        CROP FARMING — JOS SOUTH
                      </div>
                    </div>

                    {/* Right ID block (hidden on small) */}
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                      <span className="mono-xs text-muted-foreground text-[9px]">ID—HASH</span>
                      <span className="mono-xs text-foreground/70 text-[10px]">0xA7F…91D</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Telemetry Strip */}
            <div className="mt-3 grid grid-cols-4 gap-px bg-border/60 border border-border rounded-lg overflow-hidden">
              <div className="bg-card/40 px-3 py-2.5">
                <div className="mono-xs text-muted-foreground text-[8px] sm:text-[9px]">LAT</div>
                <div className="mono-xs text-foreground/85 mt-1 text-[10px] sm:text-[11px]">N 9°58&apos;</div>
              </div>
              <div className="bg-card/40 px-3 py-2.5">
                <div className="mono-xs text-muted-foreground text-[8px] sm:text-[9px]">LON</div>
                <div className="mono-xs text-foreground/85 mt-1 text-[10px] sm:text-[11px]">E 8°53&apos;</div>
              </div>
              <div className="bg-card/40 px-3 py-2.5">
                <div className="mono-xs text-muted-foreground text-[8px] sm:text-[9px]">ELEV</div>
                <div className="mono-xs text-foreground/85 mt-1 text-[10px] sm:text-[11px]">1,217 M</div>
              </div>
              <div className="bg-card/40 px-3 py-2.5">
                <div className="mono-xs text-muted-foreground text-[8px] sm:text-[9px]">STATUS</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1 w-1 rounded-full bg-orange" />
                  <span className="mono-xs text-orange text-[10px] sm:text-[11px]">ACTIVE</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
