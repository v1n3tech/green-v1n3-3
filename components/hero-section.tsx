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
          <div className="hidden sm:flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="mono-xs text-foreground/90">PHASE 01 : PLATEAU STATE</span>
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

          {/* Right: Featured Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative"
          >
            {/* Vertical Label */}
            <div className="absolute -left-8 lg:-left-10 top-1/2 -translate-y-1/2 hidden xl:block">
              <span 
                className="mono-xs text-muted-foreground/50 tracking-widest"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                EXEC : 01 / PLATEAU PILOT
              </span>
            </div>

            {/* Image Container with Sleek Frame */}
            <div className="relative group">
              {/* Main Frame Border - Clean Green */}
              <div className="absolute -inset-[2px] border border-primary/80 rounded-[2px] z-0" />
              
              {/* Corner Brackets - Refined */}
              <div className="absolute -top-1 -left-1 sm:-top-1.5 sm:-left-1.5 w-3 h-3 sm:w-4 sm:h-4 z-20">
                <div className="absolute top-0 left-0 w-full h-[1.5px] sm:h-[2px] bg-primary" />
                <div className="absolute top-0 left-0 w-[1.5px] sm:w-[2px] h-full bg-primary" />
              </div>
              <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-3 h-3 sm:w-4 sm:h-4 z-20">
                <div className="absolute top-0 right-0 w-full h-[1.5px] sm:h-[2px] bg-primary" />
                <div className="absolute top-0 right-0 w-[1.5px] sm:w-[2px] h-full bg-primary" />
              </div>
              <div className="absolute -bottom-1 -left-1 sm:-bottom-1.5 sm:-left-1.5 w-3 h-3 sm:w-4 sm:h-4 z-20">
                <div className="absolute bottom-0 left-0 w-full h-[1.5px] sm:h-[2px] bg-primary" />
                <div className="absolute bottom-0 left-0 w-[1.5px] sm:w-[2px] h-full bg-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 w-3 h-3 sm:w-4 sm:h-4 z-20">
                <div className="absolute bottom-0 right-0 w-full h-[1.5px] sm:h-[2px] bg-primary" />
                <div className="absolute bottom-0 right-0 w-[1.5px] sm:w-[2px] h-full bg-primary" />
              </div>

              {/* Glow Effect on Hover */}
              <div className="absolute -inset-1 bg-primary/5 rounded-[3px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />

              <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-card">
                <Image
                  src="/images/hero-farmer.jpg"
                  alt="Agro Executive - Bukola O."
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  priority
                />
                
                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20" />
                
                {/* Top Labels */}
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-background/90 backdrop-blur-md rounded-[2px] border border-border/50">
                    <span className="status-dot status-dot-pulse" />
                    <span className="mono-xs text-foreground text-[9px] sm:text-[10px]">LIVE / {captureTime}</span>
                  </div>
                  <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-card/90 backdrop-blur-md rounded-[2px] border border-border/50 hidden sm:block">
                    <span className="mono-xs text-foreground/80">PHOTO : BUKOLA O.</span>
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
                  <div className="mono-xs text-primary mb-1 sm:mb-1.5 text-[9px] sm:text-[10px]">AGRO EXECUTIVE #0001</div>
                  <div className="text-sm sm:text-lg font-mono text-foreground tracking-wide">Amina Yusuf</div>
                  <div className="mono-xs text-foreground/40 mt-0.5 sm:mt-1 text-[9px] sm:text-[10px]">CROP FARMING • JOS SOUTH</div>
                </div>
              </div>
            </div>

            {/* Recording Coordinates */}
            <div className="absolute -bottom-5 sm:-bottom-6 right-0 hidden sm:block">
              <span className="mono-xs text-muted-foreground">RECORDING  N 9°58&apos; / E 8°53&apos;</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
