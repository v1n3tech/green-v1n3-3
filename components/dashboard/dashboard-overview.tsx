'use client'

import { motion } from 'framer-motion'
import {
  Sparkles,
  Sprout,
  Wallet,
  MapPin,
  Activity,
  TrendingUp,
  Users,
  ShoppingBag,
  ArrowUpRight,
  BarChart3,
  Clock,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useV1N3Balance } from '@/lib/wallet/use-v1n3-balance'

interface DashboardOverviewProps {
  profile: {
    fullName: string
    displayName: string | null
    agroId: string | null
    role: string
    community: string | null
    lga: string | null
    walletAddress: string | null
    weeklyRating: number
    operationalRating: number
    totalEarnings: number
    v1n3Balance: number
  }
}

export function DashboardOverview({ profile }: DashboardOverviewProps) {
  // Fetch on-chain V1N3 balance
  const { balance: onChainBalance, loading: balanceLoading } = useV1N3Balance(profile.walletAddress)
  const displayBalance = balanceLoading ? profile.v1n3Balance : onChainBalance
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ 01 — OVERVIEW</span>
        </div>
        <span className="mono-xs text-muted-foreground text-[10px] tracking-wider hidden sm:inline">
          {profile.displayName ?? 'ANON'}
        </span>
      </div>

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-mono text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-tight text-balance">
          <span className="text-foreground">Welcome back,</span>
          <br />
          <span className="text-primary">{profile.fullName}.</span>
        </h1>
        <p className="mt-3 text-foreground/55 max-w-lg text-sm leading-relaxed">
          Your field is live. Track your ratings, manage your wallet, and engage with the
          network across the agriculture value chain.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <StatTile
          index="01"
          label="AGRO ID"
          value={profile.agroId ?? '—'}
          mono
          icon={<Sparkles className="w-3.5 h-3.5" />}
          href="/dashboard/id"
        />
        <StatTile
          index="02"
          label="ROLE"
          value={profile.role}
          icon={<Activity className="w-3.5 h-3.5" />}
          accent
        />
        <StatTile
          index="03"
          label="COMMUNITY"
          value={profile.community ?? '—'}
          icon={<Sprout className="w-3.5 h-3.5" />}
        />
        <StatTile
          index="04"
          label="LOCATION"
          value={profile.lga ? `PLATEAU / ${profile.lga.toUpperCase()}` : '—'}
          icon={<MapPin className="w-3.5 h-3.5" />}
        />
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-1 bg-background border border-border rounded-[2px] overflow-hidden"
        >
          <div className="border-b border-border px-4 h-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="status-dot status-dot-pulse" />
              <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.18em]">/ WALLET</span>
            </div>
            <span className="mono-xs text-primary text-[9px] tracking-wider">SOLANA</span>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="mono-xs text-muted-foreground/70 text-[9px] mb-1.5 tracking-[0.18em]">/ V1N3 BALANCE</p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl lg:text-3xl text-foreground tracking-tight">
                  {Number(displayBalance).toLocaleString(undefined, {
                    minimumFractionDigits: displayBalance < 1 ? 4 : 2,
                    maximumFractionDigits: 4,
                  })}
                </span>
                <span className="mono-xs text-primary/80 text-[10px] tracking-[0.2em]">V1N3</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
              <span className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.18em]">/ EARNINGS</span>
              <span className="font-mono text-foreground/85 text-[12px] tracking-wider whitespace-nowrap">
                N{Number(profile.totalEarnings).toLocaleString()}
              </span>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="mono-xs text-muted-foreground/70 text-[9px] mb-1.5 tracking-[0.18em]">/ ADDRESS</p>
              <p className="font-mono text-[11px] text-foreground/85 tracking-wider truncate">
                {profile.walletAddress
                  ? `${profile.walletAddress.slice(0, 6)}…${profile.walletAddress.slice(-6)}`
                  : '—'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Ratings Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="lg:col-span-2 bg-background border border-border rounded-[2px] overflow-hidden"
        >
          <div className="border-b border-border px-4 h-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.18em]">/ RATINGS</span>
            </div>
            <span className="mono-xs text-muted-foreground/60 text-[9px] tracking-wider">WEEKLY CYCLE</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RatingTile label="WEEKLY RATING" value={profile.weeklyRating} />
            <RatingTile label="OPERATIONAL" value={profile.operationalRating} />
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <QuickActionCard
          href="/dashboard/communities"
          icon={<Users className="w-4 h-4" />}
          label="COMMUNITIES"
          description="View your community"
          index="01"
        />
        <QuickActionCard
          href="/dashboard/marketplace"
          icon={<ShoppingBag className="w-4 h-4" />}
          label="MARKETPLACE"
          description="Browse products"
          index="02"
        />
        <QuickActionCard
          href="/dashboard/investments"
          icon={<TrendingUp className="w-4 h-4" />}
          label="INVESTMENTS"
          description="Portfolio overview"
          index="03"
        />
        <QuickActionCard
          href="/dashboard/wallet"
          icon={<Wallet className="w-4 h-4" />}
          label="WALLET"
          description="Manage funds"
          index="04"
        />
      </motion.div>

      {/* Activity & Modules Coming Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-background border border-border rounded-[2px] overflow-hidden"
        >
          <div className="border-b border-border px-4 h-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.18em]">/ RECENT ACTIVITY</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <ActivityItem
              icon={<Zap className="w-3 h-3" />}
              title="Profile Created"
              time="Just now"
              accent="primary"
            />
            <ActivityItem
              icon={<Users className="w-3 h-3" />}
              title="Joined Community"
              time="2 mins ago"
              accent="primary"
            />
            <ActivityItem
              icon={<BarChart3 className="w-3 h-3" />}
              title="Rating Updated"
              time="5 mins ago"
              accent="accent"
            />
          </div>
        </motion.div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-background border border-border rounded-[2px] overflow-hidden"
        >
          <div className="border-b border-border px-4 h-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="mono-xs text-muted-foreground text-[9px] tracking-[0.18em]">/ COMING ONLINE</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 text-foreground/70">
              <Wallet className="w-4 h-4 text-primary shrink-0" />
              <p className="mono-xs text-[10px] tracking-wider leading-relaxed">
                FIELD MODULES — SHOP, INVESTORS, MEDIA, AND TRAINING WILL APPEAR HERE.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {['SHOP', 'INVEST', 'MEDIA', 'TRAIN'].map((mod, i) => (
                <div
                  key={mod}
                  className="h-16 border border-border border-dashed rounded-[2px] flex items-center justify-center"
                >
                  <span className="mono-xs text-[8px] text-muted-foreground/40">{mod}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function StatTile({
  index,
  label,
  value,
  icon,
  mono,
  accent,
  href,
}: {
  index: string
  label: string
  value: string
  icon: React.ReactNode
  mono?: boolean
  accent?: boolean
  href?: string
}) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="mono-xs text-muted-foreground/60 text-[9px] tracking-wider">{index}</span>
        <span className={accent ? 'text-accent' : 'text-primary/70'}>{icon}</span>
      </div>
      <p className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.2em] mb-1.5">/ {label}</p>
      <p className={`text-foreground tracking-wider truncate ${mono ? 'font-mono text-[13px]' : 'mono-sm text-[11px]'}`}>
        {value}
      </p>
      {href && (
        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="mono-xs text-primary text-[8px] tracking-wider">VIEW ID</span>
          <ArrowUpRight className="w-2.5 h-2.5 text-primary" />
        </div>
      )}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="group bg-background border border-border rounded-[2px] p-3.5 transition-all hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="bg-background border border-border rounded-[2px] p-3.5">
      {content}
    </div>
  )
}

function RatingTile({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="border border-border rounded-[2px] p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.18em]">/ {label}</span>
        <span className="font-mono text-primary text-[12px] tracking-wider">{pct.toFixed(1)}</span>
      </div>
      <div className="h-[3px] bg-border rounded-[2px] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  )
}

function QuickActionCard({
  href,
  icon,
  label,
  description,
  index,
}: {
  href: string
  icon: React.ReactNode
  label: string
  description: string
  index: string
}) {
  return (
    <Link
      href={href}
      className="group bg-background border border-border rounded-[2px] p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-primary">{icon}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </div>
      <p className="mono-xs text-[10px] text-foreground">{label}</p>
      <p className="mono-xs text-[9px] text-muted-foreground/60 mt-0.5">{description}</p>
    </Link>
  )
}

function ActivityItem({
  icon,
  title,
  time,
  accent,
}: {
  icon: React.ReactNode
  title: string
  time: string
  accent: 'primary' | 'accent'
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-[2px] flex items-center justify-center ${
        accent === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="mono-xs text-[10px] text-foreground truncate">{title}</p>
        <p className="mono-xs text-[9px] text-muted-foreground/60">{time}</p>
      </div>
    </div>
  )
}
