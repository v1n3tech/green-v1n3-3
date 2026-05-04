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
  Sprout,
  Download,
  Share2,
  Verified,
  Clock,
  RotateCw,
  Printer,
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
        return { color: 'text-orange', label: 'ADMIN' }
      case 'lgpa':
        return { color: 'text-accent', label: 'LGPA' }
      case 'gcm':
        return { color: 'text-blue-400', label: 'GCM' }
      default:
        return { color: 'text-primary', label: role.toUpperCase() }
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

  const handlePrint = () => {
    if (typeof window === 'undefined') return

    const agroId = profile.agroId || 'AE-000000'
    const communityLabel = (profile.community || '').replace(/_/g, ' ').toUpperCase()
    const vColor = profile.verificationStatus === 'verified' ? '#00c853' : '#ff9800'
    const vLabel = verificationStyle.label
    const rColor = profile.role === 'admin' ? '#ff9800' : profile.role === 'lgpa' ? '#d4a000' : profile.role === 'gcm' ? '#60a5fa' : '#00c853'

    // Deterministic barcode — exact same algorithm as Barcode component
    const barcodeValue = agroId
    const bars = Array.from({ length: 56 }, (_, i) => {
      const charCode = barcodeValue.charCodeAt(i % barcodeValue.length) || 65
      const w = ((charCode + i * 7) % 4) + 1
      const dark = (charCode + i) % 2 === 0
      return { w, dark }
    })
    const barcodeSvgBars = bars.map(b =>
      `<rect width="${b.w}" height="18" fill="${b.dark ? 'rgba(255,255,255,0.85)' : 'transparent'}"/>`
    )
    // Build barcode as SVG with proper widths
    let bx = 0
    const barcodeRects = bars.map(b => {
      const rect = b.dark ? `<rect x="${bx}" y="0" width="${b.w + 1}" height="18" fill="rgba(255,255,255,0.85)"/>` : ''
      bx += b.w + 1
      return rect
    }).join('')
    const barcodeTotalWidth = bx
    const barcodeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${barcodeTotalWidth} 18" width="100%" height="18px" preserveAspectRatio="none">${barcodeRects}</svg>`

    // QR pattern — exact same algorithm as QRPattern component
    const qrCells = Array.from({ length: 49 }, (_, i) => {
      const row = Math.floor(i / 7)
      const col = i % 7
      if ((row < 3 && col < 3) || (row < 3 && col > 3) || (row > 3 && col < 3)) {
        const r = row < 3 ? row : 6 - row
        const c = col < 3 ? col : col > 3 ? 6 - col : col
        const inFinder = r === 0 || c === 0 || (r === 1 && c === 1)
        return inFinder
      }
      return (row * 7 + col * 3 + 17) % 3 !== 0
    })
    const cellSize = 14 / 7 // 14mm / 7 cells
    const qrRects = qrCells.map((on, i) => {
      const row = Math.floor(i / 7)
      const col = i % 7
      return on ? `<rect x="${col * cellSize}mm" y="${row * cellSize}mm" width="${cellSize}mm" height="${cellSize}mm" fill="#000"/>` : ''
    }).join('')
    const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14mm" height="14mm" style="display:block;">${qrRects}</svg>`

    // Photo / initials
    const photoHtml = profile.avatarUrl
      ? `<img src="${profile.avatarUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" crossorigin="anonymous"/>`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(0,200,83,0.2),rgba(212,160,0,0.1));"><span style="font-family:monospace;font-size:9pt;color:#00c853;font-weight:700;letter-spacing:0.1em;">${getInitials(fullName)}</span></div>`

    // Shared hex+geo background SVG
    const hexGeoBg = `
      <svg style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.07;pointer-events:none;" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexv" width="22" height="19" patternUnits="userSpaceOnUse">
            <polygon points="11,1 21,6.5 21,15.5 11,21 1,15.5 1,6.5" fill="none" stroke="#00c853" stroke-width="0.5"/>
          </pattern>
          <radialGradient id="hfv" cx="50%" cy="55%" r="75%">
            <stop offset="0%" stop-color="#00c853" stop-opacity="1"/>
            <stop offset="100%" stop-color="#00c853" stop-opacity="0"/>
          </radialGradient>
          <mask id="hmv"><rect width="100%" height="100%" fill="url(#hfv)"/></mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexv)" mask="url(#hmv)"/>
      </svg>
      <svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;" viewBox="0 0 204 323" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="48" x2="48" y2="0" stroke="#00c853" stroke-opacity="0.12" stroke-width="1"/>
        <line x1="0" y1="60" x2="36" y2="0" stroke="#00c853" stroke-opacity="0.06" stroke-width="1"/>
        <line x1="156" y1="323" x2="204" y2="275" stroke="#d4a000" stroke-opacity="0.1" stroke-width="1"/>
        <line x1="168" y1="323" x2="204" y2="287" stroke="#d4a000" stroke-opacity="0.05" stroke-width="1"/>
        <polygon points="12,156 30,167 30,186 12,197 -6,186 -6,167" fill="none" stroke="#00c853" stroke-opacity="0.1" stroke-width="1"/>
        <polygon points="192,240 210,251 210,270 192,281 174,270 174,251" fill="none" stroke="#d4a000" stroke-opacity="0.1" stroke-width="1"/>
      </svg>
      <div style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:0.025;background-image:linear-gradient(rgba(0,200,83,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,83,0.6) 1px,transparent 1px);background-size:20px 20px;"></div>`

    // Corner brackets — same as CornerBrackets component
    const cornerBrackets = `
      <div style="position:absolute;top:1.5mm;left:1.5mm;width:2mm;height:2mm;border-top:0.5px solid rgba(0,200,83,0.4);border-left:0.5px solid rgba(0,200,83,0.4);pointer-events:none;"></div>
      <div style="position:absolute;top:1.5mm;right:1.5mm;width:2mm;height:2mm;border-top:0.5px solid rgba(0,200,83,0.4);border-right:0.5px solid rgba(0,200,83,0.4);pointer-events:none;"></div>
      <div style="position:absolute;bottom:1.5mm;left:1.5mm;width:2mm;height:2mm;border-bottom:0.5px solid rgba(0,200,83,0.4);border-left:0.5px solid rgba(0,200,83,0.4);pointer-events:none;"></div>
      <div style="position:absolute;bottom:1.5mm;right:1.5mm;width:2mm;height:2mm;border-bottom:0.5px solid rgba(0,200,83,0.4);border-right:0.5px solid rgba(0,200,83,0.4);pointer-events:none;"></div>`

    // Field helper (matches FieldMicro)
    const field = (label: string, value: string, valColor = 'rgba(255,255,255,0.85)') =>
      `<div style="min-width:0;overflow:hidden;">
        <p style="margin:0 0 0.4mm;font-family:monospace;color:rgba(255,255,255,0.4);font-size:4.5pt;letter-spacing:0.22em;">/ ${label}</p>
        <p style="margin:0;font-family:monospace;font-size:6.5pt;letter-spacing:0.08em;font-weight:600;color:${valColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${value}</p>
      </div>`

    // ==================== FRONT ====================
    const frontHtml = `
      <div style="width:53.98mm;height:85.6mm;background:#0a120c;border-radius:3mm;overflow:hidden;position:relative;box-sizing:border-box;border:0.5px solid rgba(0,200,83,0.25);">
        ${hexGeoBg}
        ${cornerBrackets}

        <!-- HEADER BAND -->
        <div style="position:absolute;top:0;left:0;right:0;height:12%;background:linear-gradient(90deg,#00c853,rgba(0,200,83,0.85));overflow:hidden;">
          <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15;" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="bh" width="14" height="12" patternUnits="userSpaceOnUse"><polygon points="7,1 13,4.5 13,9.5 7,13 1,9.5 1,4.5" fill="none" stroke="#fff" stroke-width="0.4"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#bh)"/>
          </svg>
          <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,rgba(212,160,0,0.6),#d4a000,rgba(212,160,0,0.6));"></div>
          <div style="position:relative;height:100%;padding:0 3mm;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:1.5mm;">
              <div style="width:4mm;height:4mm;border-radius:1px;background:#0a120c;border:0.5px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;">
                <svg width="2.5mm" height="2.5mm" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2.5" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              </div>
              <div>
                <p style="margin:0;font-family:monospace;color:#fff;font-size:5.5pt;letter-spacing:0.25em;font-weight:700;line-height:1.2;">GREENV1N3</p>
                <p style="margin:0;font-family:monospace;color:rgba(255,255,255,0.7);font-size:4.5pt;letter-spacing:0.22em;line-height:1.2;">NIGERIA</p>
              </div>
            </div>
            <div style="text-align:right;">
              <p style="margin:0;font-family:monospace;color:rgba(255,255,255,0.7);font-size:4.5pt;letter-spacing:0.22em;line-height:1.2;">PHASE 01</p>
              <p style="margin:0;font-family:monospace;color:#fff;font-size:5pt;letter-spacing:0.2em;font-weight:700;line-height:1.2;">PLATEAU STATE</p>
            </div>
          </div>
        </div>

        <!-- TITLE STRIP -->
        <div style="position:absolute;top:12.5%;left:0;right:0;padding:2mm 3mm 0;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <p style="margin:0;font-family:monospace;color:rgba(255,255,255,0.45);font-size:4.5pt;letter-spacing:0.3em;line-height:1.3;">OFFICIAL IDENTIFICATION</p>
              <p style="margin:0.5mm 0 0;font-family:monospace;color:#fff;font-size:8pt;letter-spacing:0.18em;font-weight:700;line-height:1.2;">AGRO EXECUTIVE</p>
            </div>
            <div style="text-align:right;">
              <p style="margin:0;font-family:monospace;color:rgba(255,255,255,0.45);font-size:4pt;letter-spacing:0.25em;line-height:1.3;">/ SERIES</p>
              <p style="margin:0.5mm 0 0;font-family:monospace;color:#00c853;font-size:6pt;letter-spacing:0.15em;font-weight:600;line-height:1.2;">AV1-${agroId.slice(-6)}</p>
            </div>
          </div>
        </div>

        <!-- PHOTO -->
        <div style="position:absolute;top:24%;left:50%;transform:translateX(-50%);width:42%;aspect-ratio:3/4;">
          <div style="position:absolute;inset:-1.5px;border-radius:3px;background:linear-gradient(135deg,#00c853,rgba(0,200,83,0.4),#d4a000);"></div>
          <div style="position:relative;width:100%;height:100%;border-radius:3px;overflow:hidden;background:#0c170e;border:0.5px solid rgba(0,200,83,0.3);">
            ${photoHtml}
            <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,200,83,0.025) 0px,rgba(0,200,83,0.025) 1px,transparent 1px,transparent 3px);pointer-events:none;"></div>
            <div style="position:absolute;top:1mm;left:1mm;width:2mm;height:2mm;border-top:0.5px solid rgba(0,200,83,0.6);border-left:0.5px solid rgba(0,200,83,0.6);"></div>
            <div style="position:absolute;top:1mm;right:1mm;width:2mm;height:2mm;border-top:0.5px solid rgba(0,200,83,0.6);border-right:0.5px solid rgba(0,200,83,0.6);"></div>
            <div style="position:absolute;bottom:1mm;left:1mm;width:2mm;height:2mm;border-bottom:0.5px solid rgba(0,200,83,0.6);border-left:0.5px solid rgba(0,200,83,0.6);"></div>
            <div style="position:absolute;bottom:1mm;right:1mm;width:2mm;height:2mm;border-bottom:0.5px solid rgba(0,200,83,0.6);border-right:0.5px solid rgba(0,200,83,0.6);"></div>
          </div>
          <div style="position:absolute;bottom:-2.5mm;left:50%;transform:translateX(-50%);padding:0.5mm 2mm;background:#0a120c;border:0.4px solid ${vColor};border-radius:2px;white-space:nowrap;">
            <span style="font-family:monospace;color:${vColor};font-size:4pt;letter-spacing:0.2em;font-weight:600;">${vLabel}</span>
          </div>
        </div>

        <!-- NAME + ID -->
        <div style="position:absolute;top:57%;left:0;right:0;padding:0 3mm;text-align:center;">
          <p style="margin:0;font-family:monospace;color:rgba(255,255,255,0.45);font-size:4.5pt;letter-spacing:0.3em;">/ FULL NAME</p>
          <p style="margin:0.5mm 0 0;font-family:monospace;color:#fff;font-size:10pt;letter-spacing:0.06em;font-weight:700;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2;">${fullName}</p>
          <p style="margin:1.5mm 0 0;font-family:monospace;color:#00c853;font-size:7.5pt;letter-spacing:0.18em;font-weight:600;">${agroId}</p>
        </div>

        <!-- INFO GRID -->
        <div style="position:absolute;top:67%;left:0;right:0;padding:0 3mm;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:2mm 2.5mm;padding-bottom:2mm;border-bottom:0.5px solid rgba(0,200,83,0.15);">
            ${field('COMMUNITY', communityLabel || 'UNASSIGNED')}
            ${field('ROLE', roleAccent.label, rColor)}
            ${field('LGA', (profile.lga || '—').toUpperCase())}
            ${field('STATE', (profile.state || 'PLATEAU').toUpperCase())}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:2mm 2.5mm;padding-top:1.5mm;">
            ${field('ISSUED', joinDate)}
            ${field('EXPIRES', expiryFormatted, '#d4a000')}
          </div>
        </div>

        <!-- BOTTOM STRIP -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:7%;padding:0 3mm;display:flex;align-items:center;justify-content:space-between;border-top:0.5px solid rgba(0,200,83,0.15);background:rgba(0,0,0,0.4);">
          <div style="display:flex;align-items:center;gap:1.5mm;">
            <div style="position:relative;width:4mm;height:3mm;border-radius:1px;background:linear-gradient(135deg,rgba(212,160,0,0.7),rgba(0,200,83,0.4),rgba(212,160,0,0.3));border:0.5px solid rgba(212,160,0,0.4);overflow:hidden;">
              <div style="position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent 0,transparent 0.5mm,rgba(0,0,0,0.3) 0.5mm,rgba(0,0,0,0.3) 0.75mm);"></div>
            </div>
            <span style="font-family:monospace;color:rgba(255,255,255,0.4);font-size:4.5pt;letter-spacing:0.18em;">AGROV1N3</span>
          </div>
          <span style="font-family:monospace;color:rgba(255,255,255,0.4);font-size:4.5pt;letter-spacing:0.18em;">REF · ${profile.id.slice(0, 6).toUpperCase()}</span>
        </div>
      </div>`

    // ==================== BACK ====================
    const backHtml = `
      <div style="width:53.98mm;height:85.6mm;background:#0a120c;border-radius:3mm;overflow:hidden;position:relative;box-sizing:border-box;border:0.5px solid rgba(0,200,83,0.25);">
        ${hexGeoBg}
        ${cornerBrackets}

        <!-- TOP LABEL -->
        <div style="position:absolute;top:1.5mm;left:3mm;right:3mm;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-family:monospace;color:rgba(255,255,255,0.45);font-size:4.5pt;letter-spacing:0.25em;">/ SECURE STRIP</span>
          <span style="font-family:monospace;color:rgba(255,255,255,0.45);font-size:4.5pt;letter-spacing:0.25em;">AGROV1N3 · BACK</span>
        </div>

        <!-- MAGNETIC STRIP -->
        <div style="position:absolute;top:6%;left:0;right:0;height:10%;background:linear-gradient(180deg,#0a0a0a,#050505,#0a0a0a);border-top:0.5px solid rgba(255,255,255,0.05);border-bottom:0.5px solid rgba(255,255,255,0.05);">
          <div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0,transparent 2px,rgba(255,255,255,0.025) 2px,rgba(255,255,255,0.025) 3px);"></div>
        </div>

        <!-- TITLE -->
        <div style="position:absolute;top:18%;left:0;right:0;padding:0 3mm;text-align:center;">
          <p style="margin:0;font-family:monospace;color:rgba(255,255,255,0.45);font-size:4.5pt;letter-spacing:0.3em;">/ HOLDER VERIFICATION</p>
          <p style="margin:0.5mm 0 0;font-family:monospace;color:#fff;font-size:8pt;letter-spacing:0.15em;font-weight:700;">AUTHENTICATION DATA</p>
        </div>

        <!-- SIGNATURE LINE -->
        <div style="position:absolute;top:27%;left:0;right:0;padding:0 3mm;">
          <p style="margin:0;font-family:monospace;color:rgba(255,255,255,0.45);font-size:4.5pt;letter-spacing:0.25em;">/ HOLDER SIGNATURE</p>
          <div style="margin-top:1mm;height:7mm;border-bottom:0.5px solid rgba(0,200,83,0.3);position:relative;">
            <span style="position:absolute;bottom:1mm;left:1mm;font-family:Georgia,serif;font-style:italic;color:rgba(0,200,83,0.7);font-size:9pt;">${fullName.split(' ')[0]}</span>
          </div>
        </div>

        <!-- QR CODE -->
        <div style="position:absolute;top:41%;left:50%;transform:translateX(-50%);">
          <div style="position:absolute;inset:-1.5px;border-radius:3px;background:linear-gradient(135deg,rgba(0,200,83,0.6),rgba(212,160,0,0.6));"></div>
          <div style="position:relative;background:#fff;border-radius:2px;padding:1.5mm;box-sizing:border-box;">
            ${qrSvg}
          </div>
        </div>

        <!-- VALIDITY -->
        <div style="position:absolute;top:67%;left:0;right:0;padding:0 3mm;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:2mm 2.5mm;padding-bottom:1.5mm;border-bottom:0.5px solid rgba(0,200,83,0.15);">
            ${field('ISSUED', joinDate)}
            ${field('VALID THROUGH', expiryFormatted, '#d4a000')}
          </div>
          <div style="margin-top:2mm;">
            <p style="margin:0 0 1mm;font-family:monospace;color:rgba(255,255,255,0.45);font-size:4.5pt;letter-spacing:0.25em;">/ SCAN CODE</p>
            ${barcodeSvg}
            <p style="margin:0.8mm 0 0;font-family:monospace;color:rgba(255,255,255,0.55);font-size:5.5pt;letter-spacing:0.25em;text-align:center;">${agroId}</p>
          </div>
        </div>

        <!-- FOOTER LEGAL -->
        <div style="position:absolute;bottom:0;left:0;right:0;padding:2mm 3mm;border-top:0.5px solid rgba(0,200,83,0.15);background:rgba(0,0,0,0.4);">
          <p style="margin:0;font-family:monospace;color:rgba(255,255,255,0.4);font-size:4pt;letter-spacing:0.15em;line-height:1.5;">PROPERTY OF GREENV1N3 NIGERIA. IF FOUND, RETURN TO THE STATE COORDINATING COUNCIL, PLATEAU STATE. UNAUTHORIZED USE IS PROHIBITED.</p>
        </div>
      </div>`

    const printWindow = window.open('', '_blank', 'width=240,height=420,toolbar=0,menubar=0,scrollbars=0')
    if (!printWindow) return

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>GreenV1n3 Agro ID – ${fullName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 53.98mm; background: #0a120c; }
    @page { size: 53.98mm 85.6mm; margin: 0; }
    @media print {
      * { margin: 0 !important; padding: 0 !important; }
      html, body { width: 53.98mm !important; background: #0a120c !important; }
      .pb { page-break-after: always; display: block; height: 0; line-height: 0; font-size: 0; }
    }
    .cw { width: 53.98mm; height: 85.6mm; overflow: hidden; display: block; }
  </style>
</head>
<body>
  <div class="cw">${frontHtml}</div>
  <div class="pb"></div>
  <div class="cw">${backHtml}</div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 600); };
  <\/script>
</body>
</html>`)
    printWindow.document.close()
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back Button + Actions */}
      <div className="flex items-center justify-between id-print-hide">
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
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-[3px] hover:border-primary/40 hover:bg-primary/5 transition-all"
            title="Print at actual CR80 size"
          >
            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="mono-xs text-muted-foreground text-[9px] tracking-wider">
              PRINT
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
      <div className="flex items-center justify-between id-print-hide">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ AGRO EXECUTIVE ID</span>
        </div>
        <span className="mono-xs text-muted-foreground/50 text-[9px] tracking-wider hidden sm:block">
          ISO/IEC 7810 · CR80 PORTRAIT · 53.98 × 85.6 MM
        </span>
      </div>

      {/* ID Card — vertical CR80 (53.98 × 85.6 mm) */}
      <div className="flex justify-center" style={{ perspective: '1800px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative"
          style={{ width: '340px' }}
        >
          {/* Ambient glow (screen only) */}
          <div className="absolute -inset-10 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-3xl opacity-50 pointer-events-none" />

          {/* Flip container */}
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full"
            style={{
              aspectRatio: '53.98 / 85.6',
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
        className="grid grid-cols-2 md:grid-cols-4 gap-3 id-print-hide"
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
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 id-print-hide"
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
   FRONT OF ID CARD — Vertical CR80
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
  roleAccent: { color: string; label: string }
  verificationStyle: { color: string; bg: string; label: string }
  VerificationIcon: React.ComponentType<{ className?: string }>
  getInitials: (name: string | null) => string
  copied: boolean
  copyAgroId: () => void
}) {
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#0a120c] border border-primary/25"
      style={{
        borderRadius: '3mm',
        boxShadow:
          '0 24px 60px -20px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(0,200,83,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Subtle hex/geo background */}
      <HexGeoBackground />

      {/* ============== HEADER BAND ============== */}
      <div className="absolute top-0 inset-x-0 h-[12%]">
        {/* Solid green band */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/85" />
        {/* Subtle hex texture on band */}
        <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="band-hex" width="14" height="12" patternUnits="userSpaceOnUse">
              <polygon points="7,1 13,4.5 13,9.5 7,13 1,9.5 1,4.5" fill="none" stroke="#fff" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#band-hex)" />
        </svg>
        {/* Header content */}
        <div className="relative h-full px-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Logo mark */}
            <div className="w-4 h-4 rounded-[1.5px] bg-[#0a120c] flex items-center justify-center border border-white/30">
              <Sprout className="w-2.5 h-2.5 text-primary" />
            </div>
            <div className="leading-none">
              <p className="font-mono text-white text-[7px] tracking-[0.25em] font-bold">GREENV1N3</p>
              <p className="font-mono text-white/70 text-[5.5px] tracking-[0.22em] mt-0.5">NIGERIA</p>
            </div>
          </div>
          <div className="text-right leading-none">
            <p className="font-mono text-white/70 text-[5.5px] tracking-[0.22em]">PHASE 01</p>
            <p className="font-mono text-white text-[6.5px] tracking-[0.22em] font-bold mt-0.5">PLATEAU STATE</p>
          </div>
        </div>
        {/* Bottom edge accent */}
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-orange/60 via-orange to-orange/60" />
      </div>

      {/* ============== TITLE STRIP ============== */}
      <div className="absolute top-[12.5%] inset-x-0 px-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-foreground/45 text-[6px] tracking-[0.3em]">OFFICIAL IDENTIFICATION</p>
            <h1 className="font-mono text-foreground text-[10px] tracking-[0.18em] font-bold mt-0.5">
              AGRO EXECUTIVE
            </h1>
          </div>
          <div className="text-right">
            <p className="font-mono text-foreground/45 text-[5.5px] tracking-[0.25em]">/ SERIES</p>
            <p className="font-mono text-primary text-[8px] tracking-[0.15em] font-semibold mt-0.5">
              AV1-{(profile.agroId || 'AE000000').slice(-6)}
            </p>
          </div>
        </div>
      </div>

      {/* ============== PHOTO ============== */}
      <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[42%] aspect-[3/4]">
        {/* Photo gradient frame */}
        <div className="absolute -inset-[1.5px] rounded-[3px] bg-gradient-to-br from-primary via-primary/40 to-accent" />
        <div className="relative w-full h-full rounded-[3px] overflow-hidden bg-[#0c170e] border border-primary/30">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
              <span className="font-mono text-3xl text-primary font-bold tracking-wider">
                {getInitials(fullName)}
              </span>
            </div>
          )}
          {/* Photo overlay scanline (very subtle) */}
          <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,200,83,0.025)_0px,rgba(0,200,83,0.025)_1px,transparent_1px,transparent_3px)]" />
          {/* Photo corner ticks */}
          <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-primary/60" />
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-primary/60" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-primary/60" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-primary/60" />
        </div>

        {/* Verification badge under photo */}
        <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 ${verificationStyle.bg} border border-current ${verificationStyle.color} rounded-[2px] flex items-center gap-1 bg-[#0a120c]`}>
          <VerificationIcon className="w-2 h-2" />
          <span className="font-mono text-[6px] tracking-[0.2em] font-semibold whitespace-nowrap">
            {verificationStyle.label}
          </span>
        </div>
      </div>

      {/* ============== NAME + ID ============== */}
      <div className="absolute top-[57%] inset-x-0 px-3 text-center">
        <p className="font-mono text-foreground/45 text-[6px] tracking-[0.3em]">/ FULL NAME</p>
        <p className="font-mono text-foreground text-[12px] tracking-[0.06em] font-bold leading-tight uppercase mt-0.5 truncate">
          {fullName}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <span className="font-mono text-primary text-[10px] tracking-[0.18em] font-semibold">
            {profile.agroId}
          </span>
          <button
            onClick={copyAgroId}
            className="p-0.5 hover:bg-primary/10 rounded-[2px] transition-colors id-print-hide"
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

      {/* ============== INFO GRID ============== */}
      <div className="absolute top-[68%] inset-x-0 px-3">
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 pb-2 border-b border-primary/15">
          <FieldMicro
            label="COMMUNITY"
            value={profile.community?.replace(/_/g, ' ').toUpperCase() || '—'}
          />
          <FieldMicro
            label="ROLE"
            value={roleAccent.label}
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
        <div className="grid grid-cols-2 gap-x-2.5 pt-1.5">
          <FieldMicro label="ISSUED" value={joinDate} />
          <FieldMicro label="EXPIRES" value={expiryFormatted} valueClass="text-orange" />
        </div>
      </div>

      {/* ============== BOTTOM STRIP ============== */}
      <div className="absolute bottom-0 inset-x-0 h-[7%] px-3 flex items-center justify-between border-t border-primary/15 bg-black/40">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Mini chip */}
          <div className="relative w-4 h-3 rounded-[1px] bg-gradient-to-br from-accent/70 via-primary/40 to-accent/30 border border-accent/40 overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0px,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_3px)]" />
          </div>
          <span className="font-mono text-foreground/40 text-[5.5px] tracking-[0.18em] truncate">
            AGROV1N3
          </span>
        </div>
        <span className="font-mono text-muted-foreground/40 text-[5.5px] tracking-[0.18em] shrink-0">
          REF · {profile.id.slice(0, 6).toUpperCase()}
        </span>
      </div>

      {/* Corner brackets — subtle */}
      <CornerBrackets />
    </div>
  )
}

/* ============================================================
   BACK OF ID CARD — Vertical CR80
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
    <div
      className="relative w-full h-full overflow-hidden bg-[#0a120c] border border-primary/25"
      style={{
        borderRadius: '3mm',
        boxShadow:
          '0 24px 60px -20px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(0,200,83,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <HexGeoBackground />

      {/* Magnetic strip near top */}
      <div className="absolute top-[6%] inset-x-0 h-[10%] bg-gradient-to-b from-black via-[#0a0a0a] to-black border-y border-foreground/5">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_2px,rgba(255,255,255,0.025)_2px,rgba(255,255,255,0.025)_3px)]" />
      </div>

      {/* Top label */}
      <div className="absolute top-1.5 left-3 right-3 flex items-center justify-between">
        <span className="font-mono text-foreground/45 text-[6px] tracking-[0.25em]">/ SECURE STRIP</span>
        <span className="font-mono text-foreground/45 text-[6px] tracking-[0.25em]">AGROV1N3 · BACK</span>
      </div>

      {/* Title under strip */}
      <div className="absolute top-[18%] inset-x-0 px-3 text-center">
        <p className="font-mono text-foreground/45 text-[6px] tracking-[0.3em]">/ HOLDER VERIFICATION</p>
        <h2 className="font-mono text-foreground text-[10px] tracking-[0.15em] font-bold mt-0.5">
          AUTHENTICATION DATA
        </h2>
      </div>

      {/* Signature line */}
      <div className="absolute top-[28%] inset-x-0 px-3">
        <p className="font-mono text-foreground/45 text-[6px] tracking-[0.25em]">/ HOLDER SIGNATURE</p>
        <div className="mt-1 h-7 border-b border-primary/30 relative">
          <span className="absolute bottom-0.5 left-1 font-serif italic text-primary/70 text-sm">
            {fullName.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* QR code centered */}
      <div className="absolute top-[42%] left-1/2 -translate-x-1/2 w-[42%] aspect-square">
        <div className="absolute -inset-[1.5px] rounded-[3px] bg-gradient-to-br from-primary/60 to-accent/60" />
        <div className="relative w-full h-full bg-white rounded-[2px] p-1.5">
          <QRPattern />
        </div>
      </div>

      {/* Validity */}
      <div className="absolute top-[68%] inset-x-0 px-3">
        <div className="grid grid-cols-2 gap-x-2.5 pb-1.5 border-b border-primary/15">
          <FieldMicro label="ISSUED" value={joinDate} />
          <FieldMicro label="VALID THROUGH" value={expiryFormatted} valueClass="text-orange" />
        </div>
        {/* Barcode */}
        <div className="mt-2">
          <p className="font-mono text-foreground/45 text-[6px] tracking-[0.25em]">/ SCAN CODE</p>
          <div className="mt-1">
            <Barcode value={profile.agroId || 'AE000000'} />
          </div>
          <p className="font-mono text-foreground/55 text-[7px] tracking-[0.25em] text-center mt-0.5">
            {profile.agroId}
          </p>
        </div>
      </div>

      {/* Footer / Notice */}
      <div className="absolute bottom-0 inset-x-0 px-3 py-1.5 border-t border-primary/15 bg-black/40">
        <p className="font-mono text-foreground/40 text-[5.5px] tracking-[0.15em] leading-snug">
          PROPERTY OF GREENV1N3 NIGERIA. IF FOUND, RETURN TO THE STATE COORDINATING COUNCIL,
          PLATEAU STATE. UNAUTHORIZED USE IS PROHIBITED.
        </p>
      </div>

      <CornerBrackets />
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
        className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="hex-pattern-v"
            width="22"
            height="19"
            patternUnits="userSpaceOnUse"
          >
            <polygon
              points="11,1 21,6.5 21,15.5 11,21 1,15.5 1,6.5"
              fill="none"
              stroke="#00c853"
              strokeWidth="0.5"
            />
          </pattern>
          <radialGradient id="hex-fade-v" cx="50%" cy="55%" r="75%">
            <stop offset="0%" stopColor="#00c853" stopOpacity="1" />
            <stop offset="100%" stopColor="#00c853" stopOpacity="0" />
          </radialGradient>
          <mask id="hex-mask-v">
            <rect width="100%" height="100%" fill="url(#hex-fade-v)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-pattern-v)" mask="url(#hex-mask-v)" />
      </svg>

      {/* Geometric line accents (vertical layout) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 340 540"
        preserveAspectRatio="none"
      >
        {/* Diagonal slashes top-left */}
        <line x1="0" y1="80" x2="80" y2="0" stroke="#00c853" strokeOpacity="0.12" strokeWidth="1" />
        <line x1="0" y1="100" x2="60" y2="0" stroke="#00c853" strokeOpacity="0.06" strokeWidth="1" />

        {/* Diagonal slashes bottom-right */}
        <line x1="260" y1="540" x2="340" y2="460" stroke="#d4a000" strokeOpacity="0.1" strokeWidth="1" />
        <line x1="280" y1="540" x2="340" y2="480" stroke="#d4a000" strokeOpacity="0.05" strokeWidth="1" />

        {/* Floating hex left middle */}
        <polygon
          points="20,260 50,278 50,310 20,328 -10,310 -10,278"
          fill="none"
          stroke="#00c853"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
        {/* Floating hex right */}
        <polygon
          points="320,400 350,418 350,450 320,468 290,450 290,418"
          fill="none"
          stroke="#d4a000"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
        <polygon
          points="310,380 340,398 340,430 310,448 280,430 280,398"
          fill="none"
          stroke="#00c853"
          strokeOpacity="0.05"
          strokeWidth="1"
        />

        {/* Edge ticks */}
        <line x1="330" y1="200" x2="340" y2="200" stroke="#00c853" strokeOpacity="0.25" strokeWidth="1" />
        <line x1="330" y1="220" x2="340" y2="220" stroke="#00c853" strokeOpacity="0.18" strokeWidth="1" />
        <line x1="330" y1="240" x2="340" y2="240" stroke="#00c853" strokeOpacity="0.1" strokeWidth="1" />
      </svg>

      {/* Grid overlay (very subtle) */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,200,83,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,83,0.6) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
    </>
  )
}

function CornerBrackets() {
  return (
    <>
      <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-primary/40 pointer-events-none" />
      <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-primary/40 pointer-events-none" />
      <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l border-primary/40 pointer-events-none" />
      <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b border-r border-primary/40 pointer-events-none" />
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
      <p className="font-mono text-foreground/40 text-[5.5px] tracking-[0.22em] mb-0.5">
        / {label}
      </p>
      <p className={`font-mono text-[8px] tracking-[0.08em] truncate font-semibold ${valueClass}`}>
        {value}
      </p>
    </div>
  )
}

function Barcode({ value }: { value: string }) {
  // Deterministic pseudo-barcode based on value
  const bars = Array.from({ length: 56 }, (_, i) => {
    const charCode = value.charCodeAt(i % value.length) || 65
    const w = ((charCode + i * 7) % 4) + 1
    const dark = (charCode + i) % 2 === 0
    return { w, dark }
  })

  return (
    <div className="flex items-end gap-[1px] h-6 w-full">
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
    if ((row < 3 && col < 3) || (row < 3 && col > 3) || (row > 3 && col < 3)) {
      const r = row < 3 ? row : 6 - row
      const c = col < 3 ? col : col > 3 ? 6 - col : col
      const inFinder = r === 0 || c === 0 || (r === 1 && c === 1)
      return inFinder
    }
    return (row * 7 + col * 3 + 17) % 3 !== 0
  })

  return (
    <div className="grid grid-cols-7 gap-[1px] w-full h-full">
      {cells.map((on, i) => (
        <div key={i} className={on ? 'bg-black' : 'bg-transparent'} />
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
