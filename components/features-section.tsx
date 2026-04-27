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
    <section className="py-24 relative">
      <div className="max-w-[1400px] mx-auto px-5">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-14">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 04 — INFRASTRUCTURE</span>
        </div>

        {/* Bento Grid - Refined Layout */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* Large Card - Personal Interactive Page (spans 6 cols, 2 rows) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-12 lg:col-span-6 row-span-2"
          >
            <div className="h-full border border-border/60 rounded-[3px] bg-card/20 p-6 flex flex-col">
              {/* Image Carousel Preview - 3 panels */}
              <div className="flex gap-3 mb-6 h-[180px]">
                {/* Left Panel - Muted */}
                <div className="flex-1 rounded-[2px] bg-primary/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/15" />
                </div>
                
                {/* Center Panel - Active with Image */}
                <div className="flex-[1.8] rounded-[2px] relative overflow-hidden border border-primary/30">
                  <Image
                    src="/images/farm-field.jpg"
                    alt="Agricultural field"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                </div>
                
                {/* Right Panel - Muted */}
                <div className="flex-1 rounded-[2px] bg-primary/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 to-primary/15" />
                </div>
              </div>

              {/* Content */}
              <div className="mt-auto">
                <h3 className="mono text-xl text-foreground mb-3">Personal Interactive Page</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  Words, photos, music and video — your stage in the network. Every Agro Executive carries a living profile.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Agro-Online Shop - Medium Card (spans 3 cols, 2 rows) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-2"
          >
            <div className="h-full border border-border/60 rounded-[3px] bg-card/20 p-5 flex flex-col min-h-[280px]">
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-[3px] bg-primary/15 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/50">04</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-lg text-foreground mb-2">Agro-Online Shop</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  List, sell, source from verified executives.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Investors Hub - Small Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border/60 rounded-[3px] bg-card/20 p-5 min-h-[140px] flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-[3px] bg-primary/15 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/50">03</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1">Investors Hub</h3>
                <p className="text-xs text-muted-foreground">Fractional stakes. Transparent ledgers.</p>
              </div>
            </div>
          </motion.div>

          {/* Personal Wallet - Small Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border/60 rounded-[3px] bg-card/20 p-5 min-h-[140px] flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-[3px] bg-primary/15 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/50">02</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1">Personal Wallet</h3>
                <p className="text-xs text-muted-foreground">Solana-powered. Send, receive, stake.</p>
              </div>
            </div>
          </motion.div>

          {/* Bottom Row - 4 small cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="col-span-6 sm:col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border/60 rounded-[3px] bg-card/20 p-5 min-h-[140px] flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-[3px] bg-accent/15 flex items-center justify-center">
                  <Star className="w-4 h-4 text-accent" />
                </div>
                <span className="mono-xs text-muted-foreground/50">05</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1">Weekly Ratings</h3>
                <p className="text-xs text-muted-foreground">Financial scores. Leaderboards.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="col-span-6 sm:col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border/60 rounded-[3px] bg-card/20 p-5 min-h-[140px] flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-[3px] bg-accent/15 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-accent" />
                </div>
                <span className="mono-xs text-muted-foreground/50">06</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1">Evaluation & Monitoring</h3>
                <p className="text-xs text-muted-foreground">Real-time analytics.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="col-span-6 sm:col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border/60 rounded-[3px] bg-card/20 p-5 min-h-[140px] flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-[3px] bg-accent/15 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 text-accent" />
                </div>
                <span className="mono-xs text-muted-foreground/50">07</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1">Info & Advertising</h3>
                <p className="text-xs text-muted-foreground">Promote to the network.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="col-span-6 sm:col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border/60 rounded-[3px] bg-card/20 p-5 min-h-[140px] flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-[3px] bg-primary/15 flex items-center justify-center">
                  <Newspaper className="w-4 h-4 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/50">08</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1">Agro News</h3>
                <p className="text-xs text-muted-foreground">Economic intelligence.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
