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

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-12 gap-4 auto-rows-auto">
          
          {/* Personal Interactive Page - Large Feature Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-12 lg:col-span-7"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-5 h-full">
              {/* Profile Preview - 3 Panel Gallery with Real Images */}
              <div className="flex gap-2 mb-5 h-[160px]">
                {/* Left - Muted Farm Panel */}
                <div className="flex-[0.8] rounded-[2px] relative overflow-hidden border border-border/30 opacity-60">
                  <Image
                    src="/images/hero-farmer.jpg"
                    alt="Farm gallery"
                    fill
                    className="object-cover scale-110"
                  />
                  <div className="absolute inset-0 bg-background/40" />
                </div>
                
                {/* Center - Active Profile Image */}
                <div className="flex-[1.4] rounded-[2px] relative overflow-hidden border-2 border-primary/60">
                  <Image
                    src="/images/farm-field.jpg"
                    alt="Agro Executive Profile Preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>
                
                {/* Right - Muted Tech Panel */}
                <div className="flex-[0.8] rounded-[2px] relative overflow-hidden border border-border/30 opacity-60">
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
              <h3 className="mono text-lg text-foreground mb-2 tracking-wide">PERSONAL INTERACTIVE PAGE</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
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
            className="col-span-12 sm:col-span-6 lg:col-span-5 row-span-2"
          >
            <div className="h-full border border-border/50 rounded-[3px] bg-card/20 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-auto">
                <div className="w-12 h-12 rounded-[3px] bg-primary/15 flex items-center justify-center border border-primary/20">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/40">04</span>
              </div>
              <div className="mt-8">
                <h3 className="mono text-base text-foreground mb-2 tracking-wide">AGRO-ONLINE SHOP</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
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
            className="col-span-6 lg:col-span-4"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-5 min-h-[160px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-[3px] bg-primary/15 flex items-center justify-center border border-primary/20">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/40">02</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1 tracking-wide">PERSONAL WALLET</h3>
                <p className="text-xs text-muted-foreground">Solana-powered. Send, receive, stake.</p>
              </div>
            </div>
          </motion.div>

          {/* Investors Hub */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="col-span-6 lg:col-span-3"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-5 min-h-[160px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-[3px] bg-accent/15 flex items-center justify-center border border-accent/20">
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <span className="mono-xs text-muted-foreground/40">03</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1 tracking-wide">INVESTORS HUB</h3>
                <p className="text-xs text-muted-foreground">Fractional stakes. Transparent ledgers.</p>
              </div>
            </div>
          </motion.div>

          {/* Weekly Ratings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="col-span-6 sm:col-span-4 lg:col-span-3"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-5 min-h-[150px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-[3px] bg-accent/15 flex items-center justify-center border border-accent/20">
                  <Star className="w-4 h-4 text-accent" />
                </div>
                <span className="mono-xs text-muted-foreground/40">05</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1 tracking-wide">WEEKLY RATINGS</h3>
                <p className="text-xs text-muted-foreground">Financial scores. Leaderboards.</p>
              </div>
            </div>
          </motion.div>

          {/* Evaluation & Monitoring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.14 }}
            className="col-span-6 sm:col-span-4 lg:col-span-3"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-5 min-h-[150px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-[3px] bg-primary/15 flex items-center justify-center border border-primary/20">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/40">06</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1 tracking-wide">EVALUATION & MONITORING</h3>
                <p className="text-xs text-muted-foreground">Real-time analytics.</p>
              </div>
            </div>
          </motion.div>

          {/* Info & Advertising */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="col-span-6 sm:col-span-4 lg:col-span-3"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-5 min-h-[150px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-[3px] bg-accent/15 flex items-center justify-center border border-accent/20">
                  <ArrowLeftRight className="w-4 h-4 text-accent" />
                </div>
                <span className="mono-xs text-muted-foreground/40">07</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1 tracking-wide">INFO & ADVERTISING</h3>
                <p className="text-xs text-muted-foreground">Promote to the network.</p>
              </div>
            </div>
          </motion.div>

          {/* Agro News */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="col-span-6 sm:col-span-6 lg:col-span-3"
          >
            <div className="border border-border/50 rounded-[3px] bg-card/20 p-5 min-h-[150px] flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-[3px] bg-primary/15 flex items-center justify-center border border-primary/20">
                  <Newspaper className="w-4 h-4 text-primary" />
                </div>
                <span className="mono-xs text-muted-foreground/40">08</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-sm text-foreground mb-1 tracking-wide">AGRO NEWS</h3>
                <p className="text-xs text-muted-foreground">Economic intelligence.</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
