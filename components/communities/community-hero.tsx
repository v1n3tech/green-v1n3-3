'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Users, Star, Zap, Shield } from 'lucide-react'
import type { CommunityData } from './communities-hub'

interface CommunityHeroProps {
  community: CommunityData
  isAuthenticated: boolean
  isCommunityMember: boolean
  isUserInCommunity: boolean
  displayName: string | null
  agroId: string | null
}

// Community-specific hero images
const COMMUNITY_IMAGES: Record<string, string> = {
  crop_farming: '/communities/crop-farming.jpg',
  animal_farming: '/communities/animal-farming.jpg',
  agro_marketing: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop',
  agro_processing: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=400&fit=crop',
  agro_management_legislation: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=400&fit=crop',
  agro_tourism: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=400&fit=crop',
  agro_technology: '/communities/agro-technology.jpg',
  agro_healthcare: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=400&fit=crop',
  agro_media_branding: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop',
  agro_security: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&h=400&fit=crop',
  agro_literature: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=400&fit=crop',
  agro_motivation_training: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop',
  agro_real_estate: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1200&h=400&fit=crop',
  agro_logistics: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=400&fit=crop',
}

export function CommunityHero({
  community,
  isAuthenticated,
  isCommunityMember,
  isUserInCommunity,
  displayName,
  agroId
}: CommunityHeroProps) {
  const Icon = community.icon
  const accentColor = community.color === 'orange' ? 'text-orange' : 'text-primary'
  const accentBg = community.color === 'orange' ? 'bg-orange' : 'bg-primary'
  const accentBgSoft = community.color === 'orange' ? 'bg-orange-soft' : 'bg-primary/10'
  const accentBorder = community.color === 'orange' ? 'border-orange' : 'border-primary'
  const heroImage = COMMUNITY_IMAGES[community.key] ?? COMMUNITY_IMAGES.crop_farming

  return (
    <section className="relative">
      {/* Hero Image with Overlay */}
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden">
        <Image
          src={heroImage}
          alt={community.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        
        {/* Scanline effect */}
        <div className="absolute inset-0 frame-scanlines opacity-30" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-end">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Left: Community Info */}
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[2px] flex items-center justify-center ${accentBgSoft} border ${accentBorder}/30 flex-shrink-0`}>
                <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${accentColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`mono-xs text-[10px] ${accentColor}`}>{community.id}</span>
                  <span className="mono-xs text-[10px] text-muted-foreground">/</span>
                  <span className="mono-xs text-[10px] text-muted-foreground">{community.tagline.toUpperCase()}</span>
                </div>
                <h1 className="mono text-2xl sm:text-3xl md:text-4xl text-foreground">
                  {community.name}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="mono-xs text-[10px] text-foreground/70">{community.members} MEMBERS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-accent" />
                    <span className="mono-xs text-[10px] text-foreground/70">{community.rating} RATING</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: User Status / CTA */}
            <div className="flex flex-col items-start sm:items-end gap-2">
              {isUserInCommunity ? (
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-[2px] ${accentBgSoft} border ${accentBorder}/30`}>
                    <div className="flex items-center gap-2">
                      <Shield className={`w-3.5 h-3.5 ${accentColor}`} />
                      <span className={`mono-xs text-[10px] ${accentColor}`}>COMMUNITY MEMBER</span>
                    </div>
                  </div>
                </div>
              ) : isAuthenticated ? (
                <Link
                  href="/onboarding"
                  className={`flex items-center gap-2 px-4 py-2 rounded-[2px] ${accentBg} text-background mono-sm text-xs transition-all hover:opacity-90`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>JOIN COMMUNITY</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href="/"
                  className={`flex items-center gap-2 px-4 py-2 rounded-[2px] border ${accentBorder}/50 ${accentColor} mono-sm text-xs transition-all hover:${accentBg}/10`}
                >
                  <span>CONNECT TO JOIN</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
              
              {displayName && (
                <span className="mono-xs text-[9px] text-muted-foreground">
                  VIEWING AS: {displayName.toUpperCase()} {agroId && `/ ${agroId}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-1 h-5 ${accentBg}`} />
          <span className={`mono-xs ${accentColor} text-[10px] tracking-wider`}>/ 03 — COMMUNITIES HUB</span>
        </div>
      </div>
    </section>
  )
}
