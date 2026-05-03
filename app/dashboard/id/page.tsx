'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Shield,
  MapPin,
  Sprout,
  Calendar,
  QrCode,
  Download,
  Share2,
  Verified,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

interface ProfileData {
  id: string
  displayName: string | null
  firstName: string | null
  lastName: string | null
  agroId: string | null
  role: string
  community: string | null
  lga: string | null
  state: string | null
  verificationStatus: string
  avatarUrl: string | null
  createdAt: string
  walletAddress: string | null
  weeklyRating: number
  operationalRating: number
}

export default function IDPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile({
            id: data.id,
            displayName: data.display_name,
            firstName: data.first_name,
            lastName: data.last_name,
            agroId: data.agro_id,
            role: data.role || 'explorer',
            community: data.community,
            lga: data.lga,
            state: data.state || 'Plateau',
            verificationStatus: data.verification_status || 'pending',
            avatarUrl: data.avatar_url,
            createdAt: data.created_at,
            walletAddress: data.wallet_address,
            weeklyRating: Number(data.weekly_rating) || 0,
            operationalRating: Number(data.operational_rating) || 0,
          })
        }
      }
      setLoading(false)
    }

    fetchProfile()
  }, [])

  const copyAgroId = () => {
    if (profile?.agroId) {
      navigator.clipboard.writeText(profile.agroId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'AE'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'border-orange/50 bg-orange/10 text-orange'
      case 'lgpa':
        return 'border-accent/50 bg-accent/10 text-accent'
      case 'gcm':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400'
      default:
        return 'border-primary/50 bg-primary/10 text-primary'
    }
  }

  const getVerificationStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return { color: 'text-primary', bg: 'bg-primary/10', icon: Verified }
      case 'pending':
        return { color: 'text-accent', bg: 'bg-accent/10', icon: Clock }
      default:
        return { color: 'text-muted-foreground', bg: 'bg-muted/10', icon: Shield }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="mono-xs text-muted-foreground text-[10px] tracking-wider">LOADING ID...</span>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="mono-xs text-muted-foreground">No profile found</span>
      </div>
    )
  }

  const verificationStyle = getVerificationStyle(profile.verificationStatus)
  const VerificationIcon = verificationStyle.icon
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.displayName || 'Agro Executive'
  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="mono-xs text-[10px] tracking-wider">BACK TO OVERVIEW</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQR(!showQR)}
            className="p-2 border border-border rounded-[2px] hover:border-primary/40 hover:bg-primary/5 transition-all"
            title="Show QR Code"
          >
            <QrCode className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            className="p-2 border border-border rounded-[2px] hover:border-primary/40 hover:bg-primary/5 transition-all"
            title="Download ID"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            className="p-2 border border-border rounded-[2px] hover:border-primary/40 hover:bg-primary/5 transition-all"
            title="Share ID"
          >
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-5 bg-primary" />
        <span className="mono-xs text-primary text-[10px] tracking-wider">/ AGRO EXECUTIVE ID</span>
      </div>

      {/* ID Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative"
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10 blur-3xl opacity-50" />
        
        {/* Card */}
        <div className="relative border border-primary/30 rounded-[3px] overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-border bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="mono-xs text-primary text-[9px] tracking-[0.2em]">GREENV1N3</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <span className="mono-xs text-muted-foreground text-[9px] tracking-wider">AGROV1N3 PROGRAM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="mono-xs text-muted-foreground/60 text-[8px] tracking-wider">PHASE 01</span>
              <div className="px-2 py-0.5 border border-orange/40 rounded-[2px]">
                <span className="mono-xs text-orange text-[8px] tracking-wider">PLATEAU STATE</span>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: Avatar & Primary Info */}
              <div className="flex flex-col items-center md:items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary via-primary/50 to-accent rounded-[3px] blur-sm opacity-60" />
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={fullName}
                      className="relative w-28 h-28 md:w-32 md:h-32 rounded-[3px] object-cover border-2 border-primary/50"
                    />
                  ) : (
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-[3px] bg-primary/10 border-2 border-primary/50 flex items-center justify-center">
                      <span className="font-mono text-3xl text-primary font-bold">
                        {getInitials(fullName)}
                      </span>
                    </div>
                  )}
                  {/* Verification Badge */}
                  <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full ${verificationStyle.bg} border border-current`}>
                    <VerificationIcon className={`w-4 h-4 ${verificationStyle.color}`} />
                  </div>
                </div>

                {/* Role Badge */}
                <div className={`px-3 py-1.5 border rounded-[2px] ${getRoleBadgeStyle(profile.role)}`}>
                  <span className="mono-xs text-[10px] tracking-[0.2em]">/ {profile.role.toUpperCase()}</span>
                </div>
              </div>

              {/* Right: Details */}
              <div className="flex-1 space-y-5">
                {/* Name & ID */}
                <div>
                  <p className="mono-xs text-muted-foreground/60 text-[9px] tracking-[0.18em] mb-1">/ EXECUTIVE NAME</p>
                  <h2 className="font-mono text-2xl md:text-3xl text-foreground tracking-tight">
                    {fullName}
                  </h2>
                </div>

                {/* Agro ID */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="mono-xs text-muted-foreground/60 text-[9px] tracking-[0.18em] mb-1">/ AGRO ID</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg text-primary tracking-wider">{profile.agroId}</span>
                      <button
                        onClick={copyAgroId}
                        className="p-1.5 hover:bg-primary/10 rounded-[2px] transition-colors"
                        title="Copy ID"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <IDField
                    icon={<Sprout className="w-3.5 h-3.5" />}
                    label="COMMUNITY"
                    value={profile.community?.replace(/_/g, ' ').toUpperCase() || '—'}
                  />
                  <IDField
                    icon={<MapPin className="w-3.5 h-3.5" />}
                    label="LOCATION"
                    value={profile.lga ? `${profile.state?.toUpperCase()} / ${profile.lga.toUpperCase()}` : '—'}
                  />
                  <IDField
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    label="JOINED"
                    value={joinDate}
                  />
                  <IDField
                    icon={<Shield className="w-3.5 h-3.5" />}
                    label="STATUS"
                    value={profile.verificationStatus.toUpperCase()}
                    valueClass={verificationStyle.color}
                  />
                </div>
              </div>
            </div>

            {/* Ratings Bar */}
            <div className="mt-6 pt-5 border-t border-border">
              <div className="grid grid-cols-2 gap-6">
                <RatingBar label="WEEKLY RATING" value={profile.weeklyRating} />
                <RatingBar label="OPERATIONAL RATING" value={profile.operationalRating} />
              </div>
            </div>

            {/* Wallet Address */}
            {profile.walletAddress && (
              <div className="mt-5 pt-5 border-t border-border">
                <p className="mono-xs text-muted-foreground/60 text-[9px] tracking-[0.18em] mb-2">/ CONNECTED WALLET</p>
                <div className="flex items-center gap-2">
                  <span className="status-dot" />
                  <span className="font-mono text-[11px] text-foreground/70 tracking-wider">
                    {profile.walletAddress}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="px-6 py-3 border-t border-border bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="mono-xs text-muted-foreground text-[8px] tracking-wider">
                POWERED BY V1N3TECH
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="mono-xs text-muted-foreground/60 text-[8px] tracking-wider">
                ID: {profile.id.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* QR Code Modal */}
      {showQR && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-[2px] p-6 bg-background"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="mono-xs text-muted-foreground text-[10px] tracking-wider">/ QR CODE</span>
            <button
              onClick={() => setShowQR(false)}
              className="mono-xs text-muted-foreground hover:text-foreground text-[9px]"
            >
              CLOSE
            </button>
          </div>
          <div className="flex flex-col items-center gap-4">
            {/* Placeholder QR - would be generated with actual data */}
            <div className="w-48 h-48 bg-white p-3 rounded-[2px]">
              <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjMDAwIiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiLz48cmVjdCBmaWxsPSIjMDAwIiB4PSI3NSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1Ii8+PHJlY3QgZmlsbD0iIzAwMCIgeT0iNzUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIvPjxyZWN0IGZpbGw9IiMwMDAiIHg9IjI1IiB5PSIyNSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIi8+PC9zdmc+')] bg-contain" />
            </div>
            <p className="mono-xs text-muted-foreground text-[9px] tracking-wider text-center">
              SCAN TO VERIFY AGRO EXECUTIVE IDENTITY
            </p>
          </div>
        </motion.div>
      )}

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <InfoCard
          title="ID VERIFICATION"
          description="Your ID is verified on-chain and can be shared with businesses and partners."
          icon={<Shield className="w-4 h-4" />}
        />
        <InfoCard
          title="NETWORK ACCESS"
          description="This ID grants access to all GreenV1n3 communities and services."
          icon={<Sprout className="w-4 h-4" />}
        />
        <InfoCard
          title="WALLET LINKED"
          description="Your Solana wallet is connected for V1N3 token transactions."
          icon={<Sparkles className="w-4 h-4" />}
        />
      </motion.div>
    </div>
  )
}

function IDField({
  icon,
  label,
  value,
  valueClass = 'text-foreground/80',
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-primary/70 mt-0.5">{icon}</span>
      <div>
        <p className="mono-xs text-muted-foreground/60 text-[8px] tracking-[0.18em]">/ {label}</p>
        <p className={`mono-sm text-[11px] tracking-wider ${valueClass}`}>{value}</p>
      </div>
    </div>
  )
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="mono-xs text-muted-foreground/70 text-[9px] tracking-[0.18em]">/ {label}</span>
        <span className="font-mono text-primary text-[12px] tracking-wider">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
          className="h-full bg-gradient-to-r from-primary to-accent"
        />
      </div>
    </div>
  )
}

function InfoCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="border border-border rounded-[2px] p-4 bg-background">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-primary">{icon}</span>
        <span className="mono-xs text-foreground text-[10px] tracking-wider">{title}</span>
      </div>
      <p className="mono-xs text-muted-foreground/70 text-[9px] leading-relaxed">
        {description}
      </p>
    </div>
  )
}
