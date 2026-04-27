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
    <section className="pt-[120px] pb-20 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 grid-pattern" />
      
      <div className="max-w-[1440px] mx-auto px-5 relative">
        {/* Status Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-10"
        >
          <div className="flex items-center gap-2.5">
            <span className="status-dot" />
            <span className="mono-xs text-foreground/90">AGROV1N3 PROGRAM</span>
          </div>
          <div className="px-3 py-1.5 border border-primary/50 rounded-[2px]">
            <span className="mono-xs text-primary">BUILT ON SOLANA</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="mono-xs text-foreground/90">PHASE 01 : PLATEAU STATE</span>
          </div>
        </motion.div>

        {/* Section Label */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-primary" />
            <span className="mono-xs text-primary">/ 00 — MANIFESTO</span>
          </div>
          <span className="mono-xs text-muted-foreground">{date}</span>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-[clamp(2.8rem,7.5vw,5.5rem)] leading-[0.92] tracking-tight font-sans">
              <span className="text-foreground">Cultivating</span>
              <br />
              <span className="text-primary">Nigeria&apos;s</span>
              <span className="text-foreground"> next</span>
              <br />
              <span className="text-foreground">economy</span>
              <span className="text-primary">.</span>
            </h1>

            <p className="mt-10 text-base sm:text-lg text-foreground/50 max-w-lg leading-relaxed">
              Green V1n3 is the operating system for the AgroV1n3 program — a country-scale field 
              network where ten thousand young Nigerians work fourteen agricultural disciplines, on-chain.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button className="flex items-center gap-3 px-6 py-3.5 bg-primary text-background rounded-[2px] mono-sm hover:bg-primary/90 transition-colors group">
                BECOME AN AGRO EXECUTIVE
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button className="flex items-center gap-3 px-6 py-3.5 border border-border hover:border-border-strong rounded-[2px] mono-sm text-foreground/70 hover:text-foreground transition-all">
                EXPLORE COMMUNITIES
              </button>
            </div>

            {/* Stats */}
            <div className="mt-14 pt-8 border-t border-border flex flex-wrap gap-10">
              <div>
                <div className="mono text-2xl text-primary">10K+</div>
                <div className="mono-xs text-muted-foreground mt-1">TARGET EXECUTIVES</div>
              </div>
              <div>
                <div className="mono text-2xl text-foreground">14</div>
                <div className="mono-xs text-muted-foreground mt-1">COMMUNITIES</div>
              </div>
              <div>
                <div className="mono text-2xl text-foreground">17</div>
                <div className="mono-xs text-muted-foreground mt-1">LOCAL GOVERNMENTS</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Featured Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative"
          >
            {/* Vertical Label */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 hidden xl:block">
              <span 
                className="mono-xs text-muted-foreground/50 tracking-widest"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                EXEC : 01 / PLATEAU PILOT
              </span>
            </div>

            {/* Image Container with Frame Brackets */}
            <div className="relative">
              {/* Corner Brackets */}
              <div className="absolute top-2 left-2 w-6 h-6 border-l-[1.5px] border-t-[1.5px] border-primary z-10" />
              <div className="absolute top-2 right-2 w-6 h-6 border-r-[1.5px] border-t-[1.5px] border-primary z-10" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-l-[1.5px] border-b-[1.5px] border-primary z-10" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r-[1.5px] border-b-[1.5px] border-primary z-10" />

              <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] border border-border">
                <Image
                  src="/images/hero-farmer.jpg"
                  alt="Agro Executive - Bukola O."
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                
                {/* Top Labels */}
                <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
                  <div className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-sm rounded-[2px] border border-border">
                    <span className="status-dot status-dot-pulse" />
                    <span className="mono-xs text-foreground">LIVE CAPTURE / {captureTime}</span>
                  </div>
                  <div className="px-3 py-2 bg-card/95 backdrop-blur-sm rounded-[2px] border border-border">
                    <span className="mono-xs text-foreground/80">PHOTO : BUKOLA O.</span>
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="mono-xs text-primary mb-1">AGRO EXECUTIVE #0001</div>
                  <div className="text-xl font-sans text-foreground">Amina Yusuf</div>
                  <div className="mono-xs text-foreground/50 mt-1">CROP FARMING COMMUNITY • JOS SOUTH</div>
                </div>
              </div>
            </div>

            {/* Recording Coordinates */}
            <div className="absolute -bottom-6 right-0">
              <span className="mono-xs text-muted-foreground">RECORDING  N 9°58&apos; / E 8°53&apos;</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
