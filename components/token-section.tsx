'use client'

import { motion } from 'framer-motion'
import { Coins, TrendingUp, Users, Lock, Zap, Gift } from 'lucide-react'
import Image from 'next/image'

const tokenomics = [
  { label: 'Community Rewards', percentage: 40, color: 'bg-primary' },
  { label: 'Development Fund', percentage: 25, color: 'bg-accent' },
  { label: 'Team & Advisors', percentage: 15, color: 'bg-primary/60' },
  { label: 'Liquidity Pool', percentage: 12, color: 'bg-primary/40' },
  { label: 'Marketing', percentage: 8, color: 'bg-primary/20' },
]

const utilities = [
  { icon: Gift, title: 'Earn Rewards', description: 'Complete tasks and activities to earn V1n3 tokens' },
  { icon: Zap, title: 'Access Features', description: 'Unlock premium tools and exclusive community features' },
  { icon: Users, title: 'Governance', description: 'Vote on proposals and shape the future of AgroV1n3' },
  { icon: TrendingUp, title: 'Staking', description: 'Stake tokens for additional yields and benefits' },
]

export function TokenSection() {
  return (
    <section id="chain" className="py-20 relative border-t border-border">
      <div className="max-w-[1440px] mx-auto px-5">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 05 — V1N3 TOKEN</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left - Token Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Token Card */}
            <div className="p-5 border border-border rounded-[3px] bg-card/30 mb-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-14 h-14 rounded-[2px] border border-primary/30 bg-primary/10 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="V1n3 Token"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="mono-xs text-muted-foreground mb-0.5">SOLANA SPL TOKEN</div>
                  <div className="mono text-2xl text-foreground">V1N3</div>
                  <div className="mono-xs text-muted-foreground">Green V1n3 Utility Token</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-background/50 border border-border rounded-[2px]">
                  <div className="mono-xs text-muted-foreground mb-1">TOTAL SUPPLY</div>
                  <div className="mono text-base text-foreground">100,000,000</div>
                </div>
                <div className="p-3 bg-background/50 border border-border rounded-[2px]">
                  <div className="mono-xs text-muted-foreground mb-1">STATUS</div>
                  <div className="mono text-base text-primary">PRE-LAUNCH</div>
                </div>
              </div>
            </div>

            {/* Tokenomics */}
            <div className="p-5 border border-border rounded-[3px] bg-card/30">
              <div className="flex items-center gap-2 mb-5">
                <Coins className="w-4 h-4 text-primary" />
                <span className="mono-sm text-foreground">TOKENOMICS</span>
              </div>
              <div className="space-y-4">
                {tokenomics.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-foreground/70">{item.label}</span>
                      <span className="mono-sm text-foreground">{item.percentage}%</span>
                    </div>
                    <div className="h-1 bg-border rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right - Utilities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-6">
              <h3 className="mono text-lg text-foreground mb-2">Token Utility</h3>
              <p className="text-sm text-foreground/50 leading-relaxed">
                V1n3 powers the entire AgroV1n3 ecosystem, enabling seamless transactions, 
                governance participation, and rewards distribution across all 14 communities.
              </p>
            </div>

            <div className="grid gap-3 mb-6">
              {utilities.map((utility, i) => (
                <motion.div
                  key={utility.title}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 border border-border rounded-[2px] bg-card/30 card-hover"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <utility.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="mono-sm text-foreground mb-0.5">{utility.title}</h4>
                      <p className="text-xs text-muted-foreground">{utility.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pre-launch CTA */}
            <div className="p-5 border border-primary/30 rounded-[2px] bg-primary/5">
              <div className="flex items-center gap-2.5 mb-3">
                <Lock className="w-4 h-4 text-primary" />
                <span className="mono-sm text-foreground">PRE-LAUNCH ALLOCATION</span>
              </div>
              <p className="text-sm text-foreground/50 mb-4">
                Early adopters who register during the pre-launch phase receive bonus V1n3 allocation.
              </p>
              <button className="w-full px-5 py-3 bg-primary text-background rounded-[2px] mono-sm hover:bg-primary/90 transition-colors">
                JOIN WHITELIST
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
