'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  User, 
  ShoppingBag, 
  TrendingUp, 
  Wallet, 
  Star,
  BarChart3, 
  ArrowLeftRight, 
  Newspaper 
} from 'lucide-react'

const features = [
  {
    id: '01',
    icon: User,
    title: 'Personal Interactive Page',
    description: 'Words, photos, music and video — your stage in the network. Every Agro Executive carries a living profile.',
    size: 'large',
    hasImage: true,
  },
  {
    id: '02',
    icon: Wallet,
    title: 'Personal Wallet',
    description: 'Solana-powered. Send, receive, stake V1n3.',
    size: 'small',
  },
  {
    id: '03',
    icon: TrendingUp,
    title: 'Investors Hub',
    description: 'Fractional stakes. Transparent ledgers.',
    size: 'small',
  },
  {
    id: '04',
    icon: ShoppingBag,
    title: 'Agro-Online Shop',
    description: 'List, sell, source from verified executives.',
    size: 'medium',
  },
  {
    id: '05',
    icon: Star,
    title: 'Weekly Ratings',
    description: 'Financial and operational scores. Leaderboards.',
    size: 'small',
  },
  {
    id: '06',
    icon: BarChart3,
    title: 'Evaluation & Monitoring',
    description: 'Real-time analytics on your progress.',
    size: 'small',
  },
  {
    id: '07',
    icon: ArrowLeftRight,
    title: 'Information & Advertising',
    description: 'Promote products to the network.',
    size: 'small',
  },
  {
    id: '08',
    icon: Newspaper,
    title: 'Agro News & Updates',
    description: 'Agriculture and economic intelligence.',
    size: 'small',
  },
]

const profileImages = [
  { color: 'bg-primary/20', active: false },
  { color: 'bg-primary', active: true },
  { color: 'bg-primary/20', active: false },
]

export function FeaturesSection() {
  const [activeSlide] = useState(1)

  return (
    <section className="py-20 relative">
      <div className="max-w-[1440px] mx-auto px-5">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 04 — INFRASTRUCTURE</span>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-3">
          {/* Large Card - Personal Interactive Page */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-12 lg:col-span-6 row-span-2"
          >
            <div className="h-full border border-border rounded-[3px] bg-card/30 p-5 flex flex-col">
              {/* Image Carousel Preview */}
              <div className="flex gap-2 mb-4 h-[200px] sm:h-[240px]">
                {profileImages.map((img, i) => (
                  <div
                    key={i}
                    className={`
                      flex-1 rounded-[2px] transition-all duration-300
                      ${i === activeSlide ? 'flex-[2] ' + img.color : img.color + ' opacity-60'}
                    `}
                  >
                    {i === activeSlide && (
                      <div className="w-full h-full relative overflow-hidden rounded-[2px]">
                        <Image
                          src="/images/hero-farmer.jpg"
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Content */}
              <div>
                <h3 className="mono text-lg text-foreground mb-2">Personal Interactive Page</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Words, photos, music and video — your stage in the network. Every Agro Executive carries a living profile.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Medium Card - Agro-Online Shop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-2"
          >
            <div className="h-full border border-border rounded-[3px] bg-card/30 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[2px] bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-accent" />
                </div>
                <span className="index">04</span>
              </div>
              <div className="mt-auto">
                <h3 className="mono text-base text-foreground mb-2">Agro-Online Shop</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  List, sell, source from verified executives.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Small Card - Investors Hub */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border rounded-[3px] bg-card/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="index">03</span>
              </div>
              <h3 className="mono text-sm text-foreground mb-1">Investors Hub</h3>
              <p className="text-xs text-muted-foreground">Fractional stakes. Transparent ledgers.</p>
            </div>
          </motion.div>

          {/* Small Card - Personal Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="col-span-12 sm:col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border rounded-[3px] bg-card/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <span className="index">02</span>
              </div>
              <h3 className="mono text-sm text-foreground mb-1">Personal Wallet</h3>
              <p className="text-xs text-muted-foreground">Solana-powered. Send, receive, stake.</p>
            </div>
          </motion.div>

          {/* Row 2 - 4 small cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border rounded-[3px] bg-card/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <span className="index">05</span>
              </div>
              <h3 className="mono text-sm text-foreground mb-1">Weekly Ratings</h3>
              <p className="text-xs text-muted-foreground">Financial scores. Leaderboards.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border rounded-[3px] bg-card/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <span className="index">06</span>
              </div>
              <h3 className="mono text-sm text-foreground mb-1">Evaluation & Monitoring</h3>
              <p className="text-xs text-muted-foreground">Real-time analytics.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border rounded-[3px] bg-card/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-primary" />
                </div>
                <span className="index">07</span>
              </div>
              <h3 className="mono text-sm text-foreground mb-1">Info & Advertising</h3>
              <p className="text-xs text-muted-foreground">Promote to the network.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="col-span-6 lg:col-span-3"
          >
            <div className="h-full border border-border rounded-[3px] bg-card/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-primary" />
                </div>
                <span className="index">08</span>
              </div>
              <h3 className="mono text-sm text-foreground mb-1">Agro News</h3>
              <p className="text-xs text-muted-foreground">Economic intelligence.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
