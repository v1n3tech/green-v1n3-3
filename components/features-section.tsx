'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  ShoppingBag, 
  Wallet, 
  Star,
  BarChart3, 
  ArrowLeftRight, 
  Newspaper,
  TrendingUp
} from 'lucide-react'

export function FeaturesSection() {
  return (
    <section className="py-12 sm:py-16 md:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center gap-2 sm:gap-2.5 mb-8 sm:mb-10 md:mb-14">
          <div className="w-1 h-4 sm:h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 04 — INFRASTRUCTURE</span>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-3 sm:gap-4 auto-rows-auto">
          
          {/* Personal Interactive Page - Large Feature Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-4 sm:col-span-8 lg:col-span-7"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-4 sm:p-5 h-full">
              {/* Profile Preview - 3 Panel Gallery with Real Images */}
              <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5 h-[120px] sm:h-[140px] md:h-[160px]">
                {/* Left - Muted Farm Panel */}
                <div className="flex-[0.8] rounded-[4px] relative overflow-hidden ring-1 ring-border opacity-60">
                  <Image
                    src="/images/hero-farmer.jpg"
                    alt="Farm gallery"
                    fill
                    className="object-cover scale-110"
                  />
                  <div className="absolute inset-0 bg-background/40" />
                </div>

                {/* Center - Active Profile Image */}
                <div className="flex-[1.4] rounded-[4px] relative overflow-hidden ring-1 ring-primary/50 shadow-[0_0_24px_-8px_rgba(0,200,83,0.35)]">
                  <Image
                    src="/images/farm-field.jpg"
                    alt="Agro Executive Profile Preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                  {/* Active indicator */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-background/70 backdrop-blur-md border border-orange/30">
                    <span className="h-1 w-1 rounded-full bg-orange" />
                    <span className="mono-xs text-orange text-[8px] tracking-wider">ACTIVE</span>
                  </div>
                </div>

                {/* Right - Muted Tech Panel */}
                <div className="flex-[0.8] rounded-[4px] relative overflow-hidden ring-1 ring-border opacity-60">
                  <Image
                    src="/images/agro-tech.jpg"
                    alt="Agro tech"
                    fill
                    className="object-cover scale-110"
                  />
                  <div className="absolute inset-0 bg-background/40" />
                </div>
              </div>

              {/* Content */}
              <h3 className="mono text-sm sm:text-base md:text-lg text-foreground mb-1.5 sm:mb-2 tracking-wide">PERSONAL INTERACTIVE PAGE</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Words, photos, music and video — your stage in the network. Every Agro Executive carries a living profile.
              </p>
            </div>
          </motion.div>

          {/* Agro-Online Shop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="col-span-4 sm:col-span-4 lg:col-span-5 row-span-1 lg:row-span-2"
          >
            <div className="h-full border border-border/50 rounded-[3px] bg-card/20 p-4 sm:p-5 flex flex-col min-h-[140px] sm:min-h-[160px]">
              <div className="flex items-start justify-between mb-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[3px] bg-primary/15 flex items-center justify-center border border-primary/20">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/40">04</span>
              </div>
              <div className="mt-6 sm:mt-8">
                <h3 className="mono text-xs sm:text-sm md:text-base text-foreground mb-1.5 sm:mb-2 tracking-wide">AGRO-ONLINE SHOP</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  List, sell, source from verified executives.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Personal Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="col-span-2 sm:col-span-4 lg:col-span-4"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-3 sm:p-4 md:p-5 min-h-[120px] sm:min-h-[140px] md:min-h-[160px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-[3px] bg-primary/15 flex items-center justify-center border border-primary/20">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/40 text-[9px] sm:text-[10px]">02</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-[11px] sm:text-xs md:text-sm text-foreground mb-0.5 sm:mb-1 tracking-wide">PERSONAL WALLET</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Solana-powered. Send, receive, stake.</p>
              </div>
            </div>
          </motion.div>

          {/* Investors Hub */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="col-span-2 sm:col-span-4 lg:col-span-3"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-3 sm:p-4 md:p-5 min-h-[120px] sm:min-h-[140px] md:min-h-[160px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-[3px] bg-orange-soft flex items-center justify-center border border-orange/25">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange" />
                </div>
                <span className="mono-xs text-muted-foreground/40 text-[9px] sm:text-[10px]">03</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-[11px] sm:text-xs md:text-sm text-foreground mb-0.5 sm:mb-1 tracking-wide">INVESTORS HUB</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Fractional stakes. Transparent ledgers.</p>
              </div>
            </div>
          </motion.div>

          {/* Weekly Ratings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="col-span-2 sm:col-span-2 lg:col-span-3"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-3 sm:p-4 md:p-5 min-h-[110px] sm:min-h-[130px] md:min-h-[150px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-[3px] bg-orange-soft flex items-center justify-center border border-orange/25">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange" />
                </div>
                <span className="mono-xs text-muted-foreground/40 text-[9px] sm:text-[10px]">05</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-[11px] sm:text-xs md:text-sm text-foreground mb-0.5 sm:mb-1 tracking-wide">WEEKLY RATINGS</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Financial scores. Leaderboards.</p>
              </div>
            </div>
          </motion.div>

          {/* Evaluation & Monitoring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.14 }}
            className="col-span-2 sm:col-span-2 lg:col-span-3"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-3 sm:p-4 md:p-5 min-h-[110px] sm:min-h-[130px] md:min-h-[150px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-[3px] bg-primary/15 flex items-center justify-center border border-primary/20">
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/40 text-[9px] sm:text-[10px]">06</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-[11px] sm:text-xs md:text-sm text-foreground mb-0.5 sm:mb-1 tracking-wide">EVAL & MONITOR</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Real-time analytics.</p>
              </div>
            </div>
          </motion.div>

          {/* Info & Advertising */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="col-span-2 sm:col-span-2 lg:col-span-3"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-3 sm:p-4 md:p-5 min-h-[110px] sm:min-h-[130px] md:min-h-[150px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-[3px] bg-accent/15 flex items-center justify-center border border-accent/20">
                  <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                </div>
                <span className="mono-xs text-muted-foreground/40 text-[9px] sm:text-[10px]">07</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-[11px] sm:text-xs md:text-sm text-foreground mb-0.5 sm:mb-1 tracking-wide">INFO & ADS</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Promote to the network.</p>
              </div>
            </div>
          </motion.div>

          {/* Agro News */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="col-span-2 sm:col-span-2 lg:col-span-3"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-3 sm:p-4 md:p-5 min-h-[110px] sm:min-h-[130px] md:min-h-[150px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-[3px] bg-primary/15 flex items-center justify-center border border-primary/20">
                  <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/40 text-[9px] sm:text-[10px]">08</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-[11px] sm:text-xs md:text-sm text-foreground mb-0.5 sm:mb-1 tracking-wide">AGRO NEWS</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Economic intelligence.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
