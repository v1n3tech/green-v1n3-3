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
  RotateCw,
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
  const [flipped, setFlipped] = useState(false)

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

  const getRoleAccent = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return { color: 'text-orange', bg: 'bg-orange/10', border: 'border-orange/40', dot: 'bg-orange' }
      case 'lgpa':
        return { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/40', dot: 'bg-accent' }
      case 'gcm':
        return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/40', dot: 'bg-blue-500' }
      default:
        return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/40', dot: 'bg-primary' }
    }
  }

  const getVerificationStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return { color: 'text-primary', bg: 'bg-primary/10', icon: Verified, label: 'VERIFIED' }
      case 'pending':
        return { color: 'text-accent', bg: 'bg-accent/10', icon: Clock, label: 'PENDING' }
      default:
        return { color: 'text-muted-foreground', bg: 'bg-muted/10', icon: Shield, label: 'UNVERIFIED' }
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
  const roleAccent = getRoleAccent(profile.role)
  const VerificationIcon = verificationStyle.icon
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    profile.displayName ||
    'Agro Executive'
  const joinDate = new Date(profile.createdAt)
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase()

  // Expiry: 3 years from join (Phase 01 timeline)
  const expiryDate = new Date(profile.createdAt)
  expiryDate.setFullYear(expiryDate.getFullYear() + 3)
  const expiryFormatted = expiryDate
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back Button + Actions */}
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
            onClick={() => setFlipped(!flipped)}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-[3px] hover:border-primary/40 hover:bg-primary/5 transition-all"
            title="Flip card"
          >
            <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="mono-xs text-muted-foreground text-[9px] tracking-wider">
              {flipped ? 'FRONT' : 'BACK'}
            </span>
          </button>
          <button
            className="p-2 border border-border rounded-[3px] hover:border-primary/40 hover:bg-primary/5 transition-all"
            title="Download ID"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            className="p-2 border border-border rounded-[3px] hover:border-primary/40 hover:bg-primary/5 transition-all"
            title="Share ID"
          >
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ AGRO EXECUTIVE ID</span>
        </div>
        <span className="mono-xs text-muted-foreground/50 text-[9px] tracking-wider hidden sm:block">
          ISO/IEC 7810 · CR80 · 85.6 × 53.98 MM
        </span>
      </div>

      {/* ID Card — CR80 aspect ratio (1.586:1) */}
      <div className="flex justify-center" style={{ perspective: '1800px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative w-full"
          style={{ maxWidth: '680px' }}
        >
          {/* Ambient glow */}
          <div className="absolute -inset-10 bg-gradient-to-br from-primary/15 via-transparent to-accent/10 blur-3xl opacity-60 pointer-events-none" />

          {/* Flip container */}
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full"
            style={{
              aspectRatio: '1.586 / 1',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* FRONT */}
            <div
              className="absolute inset-0"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <IDCardFront
                profile={profile}
                fullName={fullName}
                joinDate={joinDate}
                expiryFormatted={expiryFormatted}
                roleAccent={roleAccent}
                verificationStyle={verificationStyle}
                VerificationIcon={VerificationIcon}
                getInitials={getInitials}
                copied={copied}
                copyAgroId={copyAgroId}
              />
            </div>

            {/* BACK */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <IDCardBack
                profile={profile}
                fullName={fullName}
                joinDate={joinDate}
                expiryFormatted={expiryFormatted}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Quick stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatTile label="WEEKLY" value={`${profile.weeklyRating.toFixed(1)}%`} accent="primary" />
        <StatTile label="OPERATIONAL" value={`${profile.operationalRating.toFixed(1)}%`} accent="accent" />
        <StatTile label="STATUS" value={verificationStyle.label} accent="orange" />
        <StatTile label="EXPIRES" value={expiryFormatted} accent="muted" />
      </motion.div>

      {/* Info cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
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

/* ============================================================
   FRONT OF ID CARD
   ============================================================ */
function IDCardFront({
  profile,
  fullName,
  joinDate,
  expiryFormatted,
  roleAccent,
  verificationStyle,
  VerificationIcon,
  getInitials,
  copied,
  copyAgroId,
}: {
  profile: ProfileData
  fullName: string
  joinDate: string
  expiryFormatted: string
  roleAccent: { color: string; bg: string; border: string; dot: string }
  verificationStyle: { color: string; bg: string; label: string }
  VerificationIcon: React.ComponentType<{ className?: string }>
  getInitials: (name: string | null) => string
  copied: boolean
  copyAgroId: () => void
}) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-[6px] border border-primary/30 bg-gradient-to-br from-[#040804] via-[#060a06] to-[#02060a] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(0,200,83,0.15)]">
      {/* Geometric + hexagonal background */}
      <HexGeoBackground />

      {/* Diagonal accent stripe */}
      <div className="absolute -top-1 -left-1 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent blur-2xl pointer-events-none" />
      <div className="absolute -bottom-1 -right-1 w-40 h-40 bg-gradient-to-tl from-accent/15 to-transparent blur-2xl pointer-events-none" />

      {/* Corner brackets */}
      <CornerBrackets />

      {/* ============== TOP BAR ============== */}
      <div className="absolute top-0 inset-x-0 px-4 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between border-b border-primary/15 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-primary text-[8px] sm:text-[9px] tracking-[0.25em] font-semibold">
              GREENV1N3
            </span>
          </div>
          <div className="h-2.5 w-px bg-primary/20 shrink-0" />
          <span className="font-mono text-foreground/50 text-[7px] sm:text-[8px] tracking-[0.2em] truncate">
            FEDERAL REPUBLIC OF NIGERIA
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="font-mono text-muted-foreground/40 text-[7px] sm:text-[8px] tracking-wider hidden sm:inline">
            PHASE 01
          </span>
          <div className="px-1.5 py-0.5 border border-orange/40 bg-orange/5 rounded-[2px]">
            <span className="font-mono text-orange text-[7px] sm:text-[8px] tracking-[0.18em]">
              PLATEAU STATE
            </span>
          </div>
        </div>
      </div>

      {/* ============== CARD TITLE ============== */}
      <div className="absolute top-[14%] left-4 sm:left-5">
        <p className="font-mono text-foreground/40 text-[7px] sm:text-[8px] tracking-[0.3em]">
          OFFICIAL IDENTIFICATION CARD
        </p>
        <h1 className="font-mono text-foreground text-[11px] sm:text-[13px] tracking-[0.18em] font-bold mt-0.5">
          AGRO EXECUTIVE
        </h1>
      </div>

      {/* Phase / Issue strip */}
      <div className="absolute top-[14%] right-4 sm:right-5 text-right">
        <p className="font-mono text-foreground/40 text-[7px] sm:text-[8px] tracking-[0.2em]">
          / SERIES
        </p>
        <p className="font-mono text-primary text-[10px] sm:text-[12px] tracking-[0.15em] font-semibold mt-0.5">
          AV1-{(profile.agroId || 'AE000000').slice(-6)}
        </p>
      </div>

      {/* ============== MAIN BODY ============== */}
      <div className="absolute top-[30%] bottom-[16%] left-4 sm:left-5 right-4 sm:right-5 flex gap-3 sm:gap-4">
        {/* Left: Photo */}
        <div className="relative h-full aspect-[3/4] shrink-0">
          {/* Photo frame with gradient border */}
          <div className="absolute -inset-[1.5px] bg-gradient-to-br from-primary via-primary/40 to-accent rounded-[3px] opacity-80" />
          <div className="relative w-full h-full rounded-[3px] overflow-hidden bg-primary/5 border border-primary/30">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/5">
                <span className="font-mono text-2xl sm:text-3xl text-primary font-bold tracking-wider">
                  {getInitials(fullName)}
                </span>
              </div>
            )}

            {/* Photo overlay scanline */}
            <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,200,83,0.04)_0px,rgba(0,200,83,0.04)_1px,transparent_1px,transparent_3px)]" />

            {/* Photo corner ticks */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-primary/60" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-primary/60" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-primary/60" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-primary/60" />
          </div>

          {/* Verification micro-badge under photo */}
          <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 ${verificationStyle.bg} border border-current ${verificationStyle.color} rounded-[2px] flex items-center gap-1`}>
            <VerificationIcon className="w-2 h-2" />
            <span className="font-mono text-[6px] sm:text-[7px] tracking-[0.2em] font-semibold">
              {verificationStyle.label}
            </span>
          </div>
        </div>

        {/* Right: Identity block */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Name */}
          <div className="space-y-2 sm:space-y-2.5">
            <div>
              <p className="font-mono text-foreground/40 text-[7px] sm:text-[8px] tracking-[0.25em]">
                / FULL NAME
              </p>
              <p className="font-mono text-foreground text-[13px] sm:text-[17px] md:text-[19px] tracking-tight font-bold leading-tight uppercase truncate">
                {fullName}
              </p>
            </div>

            {/* Agro ID */}
            <div>
              <p className="font-mono text-foreground/40 text-[7px] sm:text-[8px] tracking-[0.25em]">
                / AGRO ID
              </p>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-primary text-[11px] sm:text-[14px] tracking-[0.15em] font-semibold">
                  {profile.agroId}
                </span>
                <button
                  onClick={copyAgroId}
                  className="p-0.5 hover:bg-primary/10 rounded-[2px] transition-colors"
                  title="Copy ID"
                >
                  {copied ? (
                    <Check className="w-2.5 h-2.5 text-primary" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Field grid */}
            <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-1.5 sm:gap-y-2">
              <FieldMicro
                label="COMMUNITY"
                value={profile.community?.replace(/_/g, ' ').toUpperCase() || '—'}
              />
              <FieldMicro
                label="ROLE"
                value={profile.role.toUpperCase()}
                valueClass={roleAccent.color}
              />
              <FieldMicro
                label="LGA"
                value={profile.lga?.toUpperCase() || '—'}
              />
              <FieldMicro
                label="STATE"
                value={profile.state?.toUpperCase() || '—'}
              />
            </div>
          </div>

          {/* Issue / Expiry */}
          <div className="grid grid-cols-2 gap-2 pt-1.5 sm:pt-2 border-t border-primary/10">
            <FieldMicro label="ISSUED" value={joinDate} />
            <FieldMicro label="EXPIRES" value={expiryFormatted} valueClass="text-orange" />
          </div>
        </div>
      </div>

      {/* ============== BOTTOM STRIP ============== */}
      <div className="absolute bottom-0 inset-x-0 px-4 sm:px-5 py-1.5 sm:py-2 flex items-center justify-between border-t border-primary/15 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Mini chip / hologram emulation */}
          <div className="relative w-5 h-3.5 sm:w-6 sm:h-4 rounded-[1px] bg-gradient-to-br from-accent/60 via-primary/40 to-accent/30 border border-accent/40 overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0px,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_3px)]" />
          </div>
          <span className="font-mono text-foreground/35 text-[7px] sm:text-[8px] tracking-[0.2em] truncate">
            AGROV1N3 · POWERED BY V1N3TECH
          </span>
        </div>
        <span className="font-mono text-muted-foreground/40 text-[6px] sm:text-[7px] tracking-[0.18em] shrink-0">
          REF: {profile.id.slice(0, 8).toUpperCase()}
        </span>
      </div>
    </div>
  )
}

/* ============================================================
   BACK OF ID CARD
   ============================================================ */
function IDCardBack({
  profile,
  fullName,
  joinDate,
  expiryFormatted,
}: {
  profile: ProfileData
  fullName: string
  joinDate: string
  expiryFormatted: string
}) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-[6px] border border-primary/30 bg-gradient-to-br from-[#040804] via-[#020602] to-[#040604] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(0,200,83,0.15)]">
      {/* Hex/Geo background */}
      <HexGeoBackground />
      <CornerBrackets />

      {/* Magnetic strip */}
      <div className="absolute top-[10%] inset-x-0 h-[14%] bg-gradient-to-b from-black via-[#0a0a0a] to-black border-y border-foreground/5">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_3px)]" />
      </div>

      {/* Top label */}
      <div className="absolute top-1 left-4 sm:left-5 right-4 sm:right-5 flex items-center justify-between">
        <span className="font-mono text-foreground/40 text-[7px] sm:text-[8px] tracking-[0.25em]">
          / SECURE STRIP
        </span>
        <span className="font-mono text-foreground/40 text-[7px] sm:text-[8px] tracking-[0.25em]">
          AGROV1N3 · BACK
        </span>
      </div>

      {/* Body */}
      <div className="absolute top-[28%] bottom-[18%] left-4 sm:left-5 right-4 sm:right-5 flex gap-3 sm:gap-4">
        {/* Left: signature + barcode */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Signature line */}
          <div>
            <p className="font-mono text-foreground/40 text-[7px] sm:text-[8px] tracking-[0.25em]">
              / HOLDER SIGNATURE
            </p>
            <div className="mt-1.5 sm:mt-2 h-7 sm:h-9 border-b border-primary/30 relative">
              <span className="absolute bottom-1 left-1 font-serif italic text-primary/70 text-sm sm:text-base">
                {fullName.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* Barcode */}
          <div className="space-y-1">
            <p className="font-mono text-foreground/40 text-[7px] sm:text-[8px] tracking-[0.25em]">
              / SCAN CODE
            </p>
            <Barcode value={profile.agroId || 'AE000000'} />
            <p className="font-mono text-foreground/60 text-[8px] sm:text-[9px] tracking-[0.3em] text-center">
              {profile.agroId}
            </p>
          </div>
        </div>

        {/* Right: QR + meta */}
        <div className="shrink-0 flex flex-col items-end gap-2 sm:gap-2.5">
          {/* QR placeholder */}
          <div className="relative aspect-square h-[60%] bg-foreground/95 rounded-[3px] p-1 sm:p-1.5 border border-primary/30">
            <QRPattern />
          </div>
          <div className="text-right space-y-0.5 sm:space-y-1">
            <p className="font-mono text-foreground/40 text-[6px] sm:text-[7px] tracking-[0.25em]">
              VALID THROUGH
            </p>
            <p className="font-mono text-orange text-[9px] sm:text-[11px] tracking-[0.15em] font-semibold">
              {expiryFormatted}
            </p>
            <p className="font-mono text-foreground/30 text-[6px] sm:text-[7px] tracking-[0.2em]">
              ISSUED · {joinDate}
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Notice */}
      <div className="absolute bottom-0 inset-x-0 px-4 sm:px-5 py-2 sm:py-2.5 border-t border-primary/15 bg-black/40 backdrop-blur-sm">
        <p className="font-mono text-foreground/35 text-[6px] sm:text-[7px] tracking-[0.18em] leading-relaxed">
          PROPERTY OF GREENV1N3 NIGERIA. IF FOUND, RETURN TO THE STATE COORDINATING COUNCIL,
          PLATEAU STATE. THIS CARD REMAINS PROPERTY OF THE AGROV1N3 PROGRAM AND MUST BE
          SURRENDERED ON REQUEST. UNAUTHORIZED USE IS PROHIBITED.
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   DECORATIVE COMPONENTS
   ============================================================ */
function HexGeoBackground() {
  return (
    <>
      {/* Hexagonal pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="hex-pattern"
            width="32"
            height="28"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1.4)"
          >
            <polygon
              points="16,2 30,10 30,22 16,30 2,22 2,10"
              fill="none"
              stroke="#00c853"
              strokeWidth="0.6"
            />
          </pattern>
          <radialGradient id="hex-fade" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#00c853" stopOpacity="1" />
            <stop offset="100%" stopColor="#00c853" stopOpacity="0" />
          </radialGradient>
          <mask id="hex-mask">
            <rect width="100%" height="100%" fill="url(#hex-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-pattern)" mask="url(#hex-mask)" />
      </svg>

      {/* Geometric line accents */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 680 429"
        preserveAspectRatio="none"
      >
        {/* Diagonal slashes */}
        <line x1="0" y1="60" x2="120" y2="0" stroke="#00c853" strokeOpacity="0.15" strokeWidth="1" />
        <line x1="0" y1="80" x2="100" y2="0" stroke="#00c853" strokeOpacity="0.08" strokeWidth="1" />
        <line x1="560" y1="429" x2="680" y2="320" stroke="#d4a000" strokeOpacity="0.12" strokeWidth="1" />
        <line x1="600" y1="429" x2="680" y2="350" stroke="#d4a000" strokeOpacity="0.06" strokeWidth="1" />

        {/* Right side floating hex */}
        <polygon
          points="600,200 640,220 640,260 600,280 560,260 560,220"
          fill="none"
          stroke="#00c853"
          strokeOpacity="0.12"
          strokeWidth="1"
        />
        <polygon
          points="620,180 660,200 660,240 620,260 580,240 580,200"
          fill="none"
          stroke="#00c853"
          strokeOpacity="0.06"
          strokeWidth="1"
        />

        {/* Left side floating hex */}
        <polygon
          points="40,300 70,316 70,348 40,364 10,348 10,316"
          fill="none"
          stroke="#d4a000"
          strokeOpacity="0.1"
          strokeWidth="1"
        />

        {/* Tick marks along right edge */}
        <line x1="670" y1="100" x2="680" y2="100" stroke="#00c853" strokeOpacity="0.3" strokeWidth="1" />
        <line x1="670" y1="120" x2="680" y2="120" stroke="#00c853" strokeOpacity="0.2" strokeWidth="1" />
        <line x1="670" y1="140" x2="680" y2="140" stroke="#00c853" strokeOpacity="0.1" strokeWidth="1" />
      </svg>

      {/* Grid overlay (very subtle) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,200,83,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,83,0.6) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    </>
  )
}

function CornerBrackets() {
  return (
    <>
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-primary/50 pointer-events-none" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-primary/50 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-primary/50 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-primary/50 pointer-events-none" />
    </>
  )
}

function FieldMicro({
  label,
  value,
  valueClass = 'text-foreground/85',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-foreground/40 text-[6px] sm:text-[7px] tracking-[0.22em] mb-0.5">
        / {label}
      </p>
      <p className={`font-mono text-[9px] sm:text-[11px] tracking-[0.1em] truncate ${valueClass}`}>
        {value}
      </p>
    </div>
  )
}

function Barcode({ value }: { value: string }) {
  // Deterministic pseudo-barcode based on value
  const bars = Array.from({ length: 48 }, (_, i) => {
    const charCode = value.charCodeAt(i % value.length) || 65
    const w = ((charCode + i * 7) % 4) + 1
    const dark = (charCode + i) % 2 === 0
    return { w, dark }
  })

  return (
    <div className="flex items-end gap-[1px] h-7 sm:h-9 w-full">
      {bars.map((b, i) => (
        <div
          key={i}
          className={b.dark ? 'bg-foreground/85' : 'bg-transparent'}
          style={{ width: `${b.w}px`, height: '100%', flex: '1 0 auto' }}
        />
      ))}
    </div>
  )
}

function QRPattern() {
  // Stylized QR placeholder — 7x7 grid with finder patterns
  const cells = Array.from({ length: 49 }, (_, i) => {
    const row = Math.floor(i / 7)
    const col = i % 7
    // Finder patterns at corners
    if ((row < 3 && col < 3) || (row < 3 && col > 3) || (row > 3 && col < 3)) {
      const r = row < 3 ? row : 6 - row
      const c = col < 3 ? col : col > 3 ? 6 - col : col
      const inFinder = r === 0 || c === 0 || (r === 1 && c === 1)
      return inFinder
    }
    // Pseudo-random fill
    return (row * 7 + col * 3 + 17) % 3 !== 0
  })

  return (
    <div className="grid grid-cols-7 gap-[1px] w-full h-full">
      {cells.map((on, i) => (
        <div key={i} className={on ? 'bg-background' : 'bg-transparent'} />
      ))}
    </div>
  )
}

/* ============================================================
   SUPPORT TILES
   ============================================================ */
function StatTile({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'primary' | 'accent' | 'orange' | 'muted'
}) {
  const accentMap = {
    primary: 'text-primary',
    accent: 'text-accent',
    orange: 'text-orange',
    muted: 'text-foreground/70',
  }
  return (
    <div className="border border-border rounded-[3px] p-3 bg-card/40 hover:border-primary/30 transition-colors">
      <p className="font-mono text-muted-foreground/60 text-[8px] tracking-[0.22em] mb-1.5">
        / {label}
      </p>
      <p className={`font-mono text-[13px] tracking-[0.1em] font-semibold ${accentMap[accent]}`}>
        {value}
      </p>
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
    <div className="border border-border rounded-[3px] p-4 bg-card/40 hover:border-primary/25 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-primary">{icon}</span>
        <span className="font-mono text-foreground text-[10px] tracking-[0.18em]">{title}</span>
      </div>
      <p className="font-mono text-muted-foreground/70 text-[9px] leading-relaxed tracking-wide">
        {description}
      </p>
    </div>
  )
}
