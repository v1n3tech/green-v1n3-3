'use client'

import { motion } from 'framer-motion'
import { Coins, TrendingUp, Users, Lock, Zap, Gift } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

const tokenomics = [
  { label: 'Community Rewards', percentage: 40, color: 'bg-primary' },
  { label: 'Development Fund', percentage: 25, color: 'bg-accent' },
  { label: 'Team & Advisors', percentage: 15, color: 'bg-emerald-500' },
  { label: 'Liquidity Pool', percentage: 12, color: 'bg-cyan-500' },
  { label: 'Marketing', percentage: 8, color: 'bg-purple-500' },
]

const utilities = [
  { icon: Gift, title: 'Earn Rewards', description: 'Complete tasks and activities to earn V1n3 tokens' },
  { icon: Zap, title: 'Access Features', description: 'Unlock premium tools and exclusive community features' },
  { icon: Users, title: 'Governance', description: 'Vote on proposals and shape the future of AgroV1n3' },
  { icon: TrendingUp, title: 'Staking', description: 'Stake tokens for additional yields and benefits' },
]

export function TokenSection() {
  return (
    <section id="token" className="relative py-24 px-4 md:px-8 lg:px-16">
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
            <span className="text-xs font-mono tracking-wider text-primary">/ 04 — TOKEN</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-mono leading-tight text-balance">
            The <span className="text-primary">V1n3</span> Token<span className="text-accent">.</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left - Token Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {/* Token Card */}
            <div className="p-6 rounded-sm border border-border/50 bg-card/50 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative size-16 rounded-sm overflow-hidden border border-primary/30 bg-primary/10 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="V1n3 Token"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-1">SOLANA SPL TOKEN</div>
                  <div className="text-2xl font-mono">V1N3</div>
                  <div className="text-xs text-muted-foreground">Green V1n3 Utility Token</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/50 rounded-sm">
                  <div className="text-xs font-mono text-muted-foreground mb-1">TOTAL SUPPLY</div>
                  <div className="text-lg font-mono">100,000,000</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-sm">
                  <div className="text-xs font-mono text-muted-foreground mb-1">CIRCULATING</div>
                  <div className="text-lg font-mono text-primary">PRE-LAUNCH</div>
                </div>
              </div>
            </div>

            {/* Tokenomics */}
            <div className="p-6 rounded-sm border border-border/50 bg-card/50">
              <h3 className="font-mono text-sm mb-4 flex items-center gap-2">
                <Coins className="size-4 text-primary" />
                TOKENOMICS
              </h3>
              <div className="space-y-3">
                {tokenomics.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-mono">{item.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right - Utilities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-6">
              <h3 className="font-mono text-lg mb-2">Token Utility</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                V1n3 powers the entire AgroV1n3 ecosystem, enabling seamless transactions, 
                governance participation, and rewards distribution across all 14 communities.
              </p>
            </div>

            <div className="grid gap-3">
              {utilities.map((utility, i) => (
                <motion.div
                  key={utility.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-sm border border-border/50 bg-card/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center size-10 rounded-sm bg-primary/10 border border-primary/30 shrink-0">
                      <utility.icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-mono text-sm mb-1">{utility.title}</h4>
                      <p className="text-xs text-muted-foreground">{utility.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pre-launch CTA */}
            <div className="mt-6 p-4 rounded-sm border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3 mb-3">
                <Lock className="size-4 text-primary" />
                <span className="font-mono text-sm">PRE-LAUNCH ALLOCATION</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Early adopters who register during the pre-launch phase receive bonus V1n3 allocation.
              </p>
              <Button size="sm" className="w-full bg-primary text-primary-foreground font-mono text-xs">
                JOIN WHITELIST
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
