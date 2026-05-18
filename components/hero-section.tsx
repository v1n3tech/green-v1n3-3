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
            <span className="mono-xs text-foreground/90">AGROV1N3 PROGRAM</span>
          </div>
          <div className="px-2 sm:px-3 py-1 sm:py-1.5 border border-primary/50 rounded-[2px]">
            <span className="mono-xs text-primary">BUILT ON SOLANA</span>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 px-2.5 py-1 rounded-[4px] border border-orange/30 bg-orange-soft">
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

          {/* Right: Featured Image — Sleek Instrument Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative"
          >
            {/* Single sleek instrument frame: titlebar + image + footer */}
            <div className="media-frame group">
              {/* Inset titlebar */}
              <div className="media-chrome top">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-orange rec-ping" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-orange" />
                  </span>
                  <span className="text-orange text-[10px]">REC</span>
                </div>
                <span className="h-3 w-px bg-border" />
                <span className="text-foreground/80 text-[10px]">EXEC—0001</span>
                <span className="hidden md:inline h-3 w-px bg-border" />
                <span className="hidden md:inline text-muted-foreground text-[10px]">CROP / 04</span>
                <span className="chrome-spacer" />
                <span className="hidden lg:inline text-muted-foreground text-[10px]">FRAME {captureTime}</span>
                <span className="hidden lg:inline h-3 w-px bg-border" />
                <span className="text-foreground/60 text-[10px]">01 / 14</span>
              </div>

              {/* Image plate */}
              <div className="media-plate aspect-[4/3]">
                <Image
                  src="/images/hero-farmer.jpg"
                  alt="Agro Executive — Amina Yusuf"
                  fill
                  className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
                  priority
                />
                {/* Subtle scanlines */}
                <div className="pointer-events-none absolute inset-0 frame-scanlines opacity-25 mix-blend-overlay" />
                {/* Bottom cinematic falloff */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/60 to-transparent" />

                {/* Inset name overlay (anchored, doesn't violate radius) */}
                <div className="absolute inset-x-0 bottom-0 px-4 pb-4 sm:px-5 sm:pb-5 z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="h-px w-6 bg-orange" />
                    <span className="mono-xs text-orange tracking-[0.18em] text-[10px]">EXEC // 0001</span>
                  </div>
                  <div className="font-mono text-xl sm:text-2xl text-foreground tracking-wide leading-none">
                    Amina Yusuf
                  </div>
                  <div className="mono-xs text-foreground/55 mt-1.5 text-[10px]">
                    CROP FARMING — JOS SOUTH
                  </div>
                </div>
              </div>

              {/* Inset footer telemetry */}
              <div className="media-chrome bottom !py-0 !gap-0 !px-0">
                <div className="grid grid-cols-4 w-full divide-x divide-border">
                  <div className="px-3 py-2.5">
                    <div className="text-muted-foreground text-[9px]">LAT</div>
                    <div className="text-foreground/85 mt-0.5 text-[10px] normal-case tracking-normal">N 9°58&apos;</div>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="text-muted-foreground text-[9px]">LON</div>
                    <div className="text-foreground/85 mt-0.5 text-[10px] normal-case tracking-normal">E 8°53&apos;</div>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="text-muted-foreground text-[9px]">ELEV</div>
                    <div className="text-foreground/85 mt-0.5 text-[10px] normal-case tracking-normal">1,217 M</div>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="text-muted-foreground text-[9px]">STATUS</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1 w-1 rounded-full bg-orange" />
                      <span className="text-orange text-[10px]">ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clean caption below — fully visible, no awkward floating text */}
            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-px w-5 bg-orange shrink-0" />
                <span className="mono-xs text-foreground/70 truncate">PHASE 01 — PLATEAU PILOT</span>
              </div>
              <span className="mono-xs text-muted-foreground hidden sm:inline">ID 0xA7F…91D</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
