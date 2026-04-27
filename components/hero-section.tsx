'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function HeroSection() {
  return (
    <section className="relative min-h-screen pt-32 pb-16 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute inset-0 noise pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative z-10 px-4 md:px-8 lg:px-16">
        {/* Status Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 mb-8"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/80 rounded-sm border border-border/50">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="text-xs font-mono tracking-wider text-muted-foreground">AGROV1N3 PROGRAM</span>
          </div>
          <div className="px-3 py-1.5 bg-transparent border border-primary/50 rounded-sm">
            <span className="text-xs font-mono tracking-wider text-primary">BUILT ON SOLANA</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/80 rounded-sm border border-border/50">
            <span className="size-1.5 rounded-full bg-accent" />
            <span className="text-xs font-mono tracking-wider text-muted-foreground">PHASE 01 : PLATEAU STATE</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Content */}
          <div>
            {/* Section Label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-1 h-4 bg-primary" />
              <span className="text-xs font-mono tracking-wider text-primary">/ 00 — MANIFESTO</span>
              <span className="text-xs font-mono tracking-wider text-muted-foreground ml-auto">04.27.2026</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-mono leading-[0.95] mb-6 text-balance"
            >
              Cultivating
              <br />
              <span className="text-primary">Nigeria&apos;s</span> next
              <br />
              economy<span className="text-accent">.</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mb-8"
            >
              Green V1n3 is the operating system for the AgroV1n3 program — a country-scale field 
              network where ten thousand young Nigerians work fourteen agricultural disciplines, on-chain, 
              earning V1n3 tokens as they build the future of food.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm px-6">
                JOIN AS EXECUTIVE
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 border-border/50 font-mono text-sm px-6">
                <Play className="size-4" />
                WATCH MANIFESTO
              </Button>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-border/30"
            >
              <div>
                <div className="text-3xl font-mono text-primary">10K+</div>
                <div className="text-xs font-mono text-muted-foreground tracking-wider">TARGET EXECUTIVES</div>
              </div>
              <div>
                <div className="text-3xl font-mono text-foreground">14</div>
                <div className="text-xs font-mono text-muted-foreground tracking-wider">AGRO COMMUNITIES</div>
              </div>
              <div>
                <div className="text-3xl font-mono text-foreground">17</div>
                <div className="text-xs font-mono text-muted-foreground tracking-wider">LOCAL GOVERNMENTS</div>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Featured Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            {/* Vertical Text */}
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2">
              <div className="w-px h-16 bg-border/50" />
              <span className="text-xs font-mono tracking-widest text-muted-foreground/50 writing-mode-vertical rotate-180" style={{ writingMode: 'vertical-rl' }}>
                EXEC : 01 / PLATEAU PILOT
              </span>
              <div className="w-px h-16 bg-border/50" />
            </div>

            {/* Image Card */}
            <div className="relative rounded-sm overflow-hidden border border-border/50 bg-card">
              {/* Live Badge */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-sm border border-border/50">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono tracking-wider">LIVE CAPTURE / 04:27</span>
              </div>

              {/* Photo Credit */}
              <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-sm border border-border/50">
                <span className="text-xs font-mono tracking-wider text-muted-foreground">PHOTO : BUKOLA O.</span>
              </div>

              {/* Image */}
              <div className="aspect-[4/5] sm:aspect-[3/4] relative">
                <Image
                  src="/images/hero-farmer.jpg"
                  alt="Nigerian farmer in agricultural field"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs font-mono text-primary mb-1">AGRO EXECUTIVE #0001</div>
                    <div className="text-lg font-mono">Amina Yusuf</div>
                    <div className="text-xs text-muted-foreground">Crop Farming Community</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <MapPin className="size-3" />
                    <span>Jos, Plateau</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Tag */}
            <div className="absolute -bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-sm border border-border/50">
              <span className="text-xs font-mono tracking-wider text-muted-foreground">RECORDING</span>
              <span className="text-xs font-mono tracking-wider">N 9°56&apos; / E 8°53&apos;</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
