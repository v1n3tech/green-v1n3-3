'use client'

import { motion } from 'framer-motion'
import { 
  User, 
  ShoppingBag, 
  PiggyBank, 
  Wallet, 
  Megaphone, 
  BarChart3, 
  Trophy, 
  Newspaper 
} from 'lucide-react'

const features = [
  {
    icon: User,
    title: 'Interactive Profile',
    description: 'Personal page with posts, photos, music and video capabilities to showcase your agricultural journey.',
  },
  {
    icon: ShoppingBag,
    title: 'Agro Online Shop',
    description: 'Buy and sell agricultural products directly within the platform with V1n3 or fiat currency.',
  },
  {
    icon: PiggyBank,
    title: 'Investment Platform',
    description: 'Connect with investors and access funding opportunities for your agricultural ventures.',
  },
  {
    icon: Wallet,
    title: 'Personal Wallet',
    description: 'Secure Solana-powered wallet to store, send, and receive V1n3 tokens and other assets.',
  },
  {
    icon: Megaphone,
    title: 'Advertising Hub',
    description: 'Promote your products and services to thousands of engaged agricultural professionals.',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Real-time evaluation and monitoring of your agricultural activities and progress.',
  },
  {
    icon: Trophy,
    title: 'Weekly Ratings',
    description: 'Personal financial and operational ratings with gamified leaderboards and rewards.',
  },
  {
    icon: Newspaper,
    title: 'Agro News',
    description: 'Stay updated with agriculture and economic news, market trends, and opportunities.',
  },
]

export function FeaturesSection() {
  return (
    <section className="relative py-24 px-4 md:px-8 lg:px-16">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-4 bg-primary" />
            <span className="text-xs font-mono tracking-wider text-primary">/ 06 — FEATURES</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <h2 className="text-4xl sm:text-5xl font-mono leading-tight text-balance">
              Everything you need<span className="text-accent">.</span>
              <br />
              <span className="text-primary">One platform</span><span className="text-muted-foreground">.</span>
            </h2>
            <p className="text-muted-foreground max-w-md text-base leading-relaxed">
              The Green V1n3 platform brings together all the tools you need to 
              succeed in the agricultural economy.
            </p>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group"
            >
              <div className="h-full p-5 rounded-sm border border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card transition-all">
                {/* Icon */}
                <div className="flex items-center justify-center size-10 rounded-sm bg-primary/10 border border-primary/30 mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="size-5 text-primary" />
                </div>

                {/* Content */}
                <h3 className="font-mono text-sm mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
