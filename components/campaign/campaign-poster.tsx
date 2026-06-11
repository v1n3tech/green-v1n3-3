'use client'

import { forwardRef } from 'react'
import { Megaphone, Sprout, Users, ShoppingBag, Coins, TrendingUp, CheckCircle2, Rocket } from 'lucide-react'

/**
 * CampaignPoster — the exportable poster surface.
 * Rendered as styled DOM so html-to-image can rasterize it to PNG at high DPI.
 * Fixed pixel width keeps the export deterministic regardless of viewport.
 */

const milestones = [
  {
    icon: Users,
    step: '01',
    title: 'JOIN A COMMUNITY',
    desc: 'Onboard into one of the agro communities across Plateau’s LGAs.',
    reward: '+ V1N3',
  },
  {
    icon: CheckCircle2,
    step: '02',
    title: 'VERIFY & ACTIVATE',
    desc: 'Complete your executive profile and activate your custodial wallet.',
    reward: '+ V1N3',
  },
  {
    icon: ShoppingBag,
    step: '03',
    title: 'TRANSACT ON-CHAIN',
    desc: 'Buy, sell or deliver in the marketplace to earn points and V1N3.',
    reward: '+ V1N3',
  },
  {
    icon: TrendingUp,
    step: '04',
    title: 'STAKE & GROW',
    desc: 'Stake V1N3 and climb the weekly ratings to unlock higher tiers.',
    reward: '+ V1N3',
  },
]

export const CampaignPoster = forwardRef<HTMLDivElement>(function CampaignPoster(_props, ref) {
  return (
    <div
      ref={ref}
      style={{ width: 1080 }}
      className="relative bg-background text-foreground overflow-hidden"
    >
      {/* Brick grid backdrop */}
      <div className="absolute inset-0 grid-pattern opacity-70" />
      {/* Corner glow */}
      <div className="absolute -top-40 -right-40 w-[480px] h-[480px] bg-primary/10 blur-[120px] rounded-full" />

      <div className="relative px-14 py-12">
        {/* Top status bar */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-10">
          <div className="flex items-center gap-3">
            <span className="status-dot status-dot-pulse" />
            <span className="mono-xs text-muted-foreground">NETWORK : SOLANA</span>
            <span className="mono-xs text-primary">PHASE 01 — PLATEAU</span>
          </div>
          <span className="mono-xs text-muted-foreground">V1N3TECH.IO</span>
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between gap-8 mb-12">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 border border-border-strong rounded-[1px] flex items-center justify-center bg-card">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <span className="mono-sm text-muted-foreground tracking-widest">ONGOING CAMPAIGN</span>
            </div>
            <h1 className="font-sans leading-[0.95] tracking-tight mb-5" style={{ fontSize: 72 }}>
              COMPLETE MILESTONES.
              <br />
              EARN <span className="text-primary">V1N3</span>.
            </h1>
            <p className="text-foreground/60 text-lg max-w-xl leading-relaxed">
              Every milestone you clear in the Green V1N3 program allocates real{' '}
              <span className="text-foreground">V1N3</span> to your wallet. Build, transact, and grow the
              agricultural value chain — and get rewarded for it.
            </p>
          </div>

          {/* Reward chip */}
          <div className="w-[300px] shrink-0 border border-border-strong rounded-[1px] bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <Coins className="w-4 h-4 text-accent" />
              <span className="mono-xs text-muted-foreground">MILESTONE ALLOCATION</span>
            </div>
            <div className="px-5 py-6 text-center">
              <div className="mono-xs text-muted-foreground mb-2">REWARD POOL</div>
              <div className="font-sans text-primary leading-none mb-2" style={{ fontSize: 56 }}>
                V1N3
              </div>
              <div className="text-foreground/50 text-sm leading-relaxed">
                Allocated per completed milestone, paid to your custodial wallet.
              </div>
            </div>
          </div>
        </div>

        {/* Milestones grid */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {milestones.map((m) => (
            <div
              key={m.step}
              className="border border-border rounded-[1px] bg-card/60 p-6 flex gap-4 card-hover"
            >
              <div className="w-11 h-11 shrink-0 border border-border-strong rounded-[1px] bg-background flex items-center justify-center">
                <m.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="mono-sm text-foreground tracking-wide">{m.title}</span>
                  <span className="index">{m.step}</span>
                </div>
                <p className="text-foreground/55 text-sm leading-relaxed mb-3">{m.desc}</p>
                <span className="mono-xs text-primary border border-border-strong rounded-[1px] px-2 py-1 inline-block">
                  {m.reward}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Early adopter banner */}
        <div className="relative border border-border-strong rounded-[1px] overflow-hidden mb-10">
          <div className="absolute inset-0 grid-pattern opacity-50" />
          <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-accent/10 blur-[90px] rounded-full" />
          <div className="relative px-8 py-7 flex items-center gap-6">
            <div className="w-14 h-14 shrink-0 border border-accent/40 rounded-[1px] bg-background flex items-center justify-center">
              <Rocket className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="mono-xs text-accent mb-2">MAINNET EARLY ADOPTER REWARD</div>
              <p className="font-sans leading-tight" style={{ fontSize: 30 }}>
                <span className="text-accent">10 V1N3</span> for an undisclosed number of early adopters
                when we move to <span className="text-primary">mainnet</span>.
              </p>
              <p className="text-foreground/50 text-sm mt-2 leading-relaxed">
                Be early. A limited, unannounced set of pioneers will be rewarded at the mainnet migration.
              </p>
            </div>
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          <div className="flex items-center gap-3">
            <Sprout className="w-5 h-5 text-primary" />
            <span className="mono-sm text-foreground tracking-widest">GREENV1N3</span>
          </div>
          <span className="mono-xs text-muted-foreground">
            Devnet pilot · V1N3 carries no monetary value until mainnet · Not financial advice
          </span>
        </div>
      </div>
    </div>
  )
})
