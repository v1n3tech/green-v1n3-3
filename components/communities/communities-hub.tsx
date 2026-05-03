'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Leaf, Bird, ShoppingBag, Factory, Scale, Palmtree, Cpu, Heart,
  Radio, Shield, BookOpen, Lightbulb, Home, Truck, ArrowRight,
  Users, Sparkles, TrendingUp, MessageSquare, Package, Store,
  ChevronRight, Star, Clock, Zap, MapPin, Activity
} from 'lucide-react'
import { CommunityFeed } from './community-feed'
import { CommunityServices } from './community-services'
import { CommunityProducts } from './community-products'
import { CommunityHero } from './community-hero'

export type CommunityKey = 
  | "crop_farming" | "animal_farming" | "agro_marketing" | "agro_processing"
  | "agro_management_legislation" | "agro_tourism" | "agro_technology" | "agro_healthcare"
  | "agro_media_branding" | "agro_security" | "agro_literature" | "agro_motivation_training"
  | "agro_real_estate" | "agro_logistics"

export interface CommunityData {
  id: string
  key: CommunityKey
  name: string
  shortName: string
  icon: typeof Leaf
  members: string
  gcms: number
  rating: string
  description: string
  services: string[]
  color: 'green' | 'orange'
  tagline: string
  highlights: string[]
}

export const COMMUNITIES_DATA: CommunityData[] = [
  { id: 'C-01', key: 'crop_farming', name: 'Crop Farming', shortName: 'CROP', icon: Leaf, members: '2.4K', gcms: 18, rating: 'A+', description: 'Food crop cultivation, cash crops, horticulture, and sustainable farming practices.', services: ['Seed Supply', 'Soil Analysis', 'Irrigation Solutions', 'Crop Consultancy'], color: 'green', tagline: 'Cultivating Tomorrow', highlights: ['Organic Certification', '24/7 Expert Support', 'Market Access'] },
  { id: 'C-02', key: 'animal_farming', name: 'Animal Farming', shortName: 'ANIMAL', icon: Bird, members: '1.8K', gcms: 15, rating: 'A', description: 'Poultry, livestock, fishery, apiculture, and animal husbandry excellence.', services: ['Livestock Supply', 'Veterinary Care', 'Feed Solutions', 'Breeding Programs'], color: 'orange', tagline: 'Raising Standards', highlights: ['Quality Breeds', 'Health Monitoring', 'Export Ready'] },
  { id: 'C-03', key: 'agro_marketing', name: 'Agro Marketing', shortName: 'MARKET', icon: ShoppingBag, members: '1.5K', gcms: 12, rating: 'A-', description: 'Distribution, wholesale, retail, export, and market intelligence.', services: ['Market Research', 'Distribution Networks', 'Export Facilitation', 'Brand Development'], color: 'green', tagline: 'Markets Unlocked', highlights: ['Global Reach', 'Price Analytics', 'Direct Sales'] },
  { id: 'C-04', key: 'agro_processing', name: 'Agro Processing', shortName: 'PROCESS', icon: Factory, members: '980', gcms: 10, rating: 'B+', description: 'Value addition, packaging, preservation, and industrial processing.', services: ['Processing Equipment', 'Packaging Solutions', 'Quality Control', 'Certification Support'], color: 'orange', tagline: 'Value Maximized', highlights: ['Modern Equipment', 'NAFDAC Support', 'Cold Storage'] },
  { id: 'C-05', key: 'agro_management_legislation', name: 'Mgmt. & Legislation', shortName: 'MGMT', icon: Scale, members: '1.2K', gcms: 12, rating: 'A-', description: 'Policy, governance, contracts, compliance, and agricultural law.', services: ['Legal Advisory', 'Policy Advocacy', 'Contract Review', 'Compliance Audits'], color: 'green', tagline: 'Governed Growth', highlights: ['Legal Protection', 'Policy Updates', 'Contract Templates'] },
  { id: 'C-06', key: 'agro_tourism', name: 'Agro Tourism', shortName: 'TOUR', icon: Palmtree, members: '650', gcms: 8, rating: 'B', description: 'Farm visits, agro-parks, eco-tourism, and agricultural experiences.', services: ['Farm Tours', 'Event Hosting', 'Eco Lodging', 'Experience Design'], color: 'orange', tagline: 'Explore Agriculture', highlights: ['Unique Experiences', 'Event Spaces', 'Educational Tours'] },
  { id: 'C-07', key: 'agro_technology', name: 'Agro Technology', shortName: 'TECH', icon: Cpu, members: '1.1K', gcms: 11, rating: 'A', description: 'Smart farming, IoT, drones, analytics, and agricultural innovation.', services: ['Drone Services', 'IoT Sensors', 'Farm Software', 'Data Analytics'], color: 'green', tagline: 'Innovation First', highlights: ['AI Powered', 'Real-time Data', 'Smart Irrigation'] },
  { id: 'C-08', key: 'agro_healthcare', name: 'Agro Health Care', shortName: 'HEALTH', icon: Heart, members: '890', gcms: 9, rating: 'B+', description: 'Animal health, plant pathology, food safety, and agricultural wellness.', services: ['Health Diagnostics', 'Treatment Programs', 'Safety Audits', 'Nutrition Consulting'], color: 'orange', tagline: 'Healthy Harvests', highlights: ['Lab Services', 'Quick Response', 'Preventive Care'] },
  { id: 'C-09', key: 'agro_media_branding', name: 'Media & Branding', shortName: 'MEDIA', icon: Radio, members: '720', gcms: 8, rating: 'B+', description: 'Content creation, PR, social media, and agricultural storytelling.', services: ['Content Production', 'Brand Strategy', 'Social Management', 'PR Campaigns'], color: 'green', tagline: 'Stories That Grow', highlights: ['Viral Content', 'Brand Building', 'Media Training'] },
  { id: 'C-10', key: 'agro_security', name: 'Agro Security', shortName: 'SECURE', icon: Shield, members: '540', gcms: 6, rating: 'B', description: 'Farm protection, anti-theft, surveillance, and agricultural security.', services: ['Surveillance Systems', 'Security Personnel', 'Risk Assessment', 'Insurance Advisory'], color: 'orange', tagline: 'Protected Yields', highlights: ['24/7 Monitoring', 'Quick Response', 'Insurance Help'] },
  { id: 'C-11', key: 'agro_literature', name: 'Agro Literature', shortName: 'LIT', icon: BookOpen, members: '380', gcms: 5, rating: 'B-', description: 'Research, documentation, publications, and agricultural knowledge.', services: ['Research Papers', 'Training Materials', 'Publication Support', 'Knowledge Base'], color: 'green', tagline: 'Knowledge Grows', highlights: ['Research Access', 'Publications', 'Expert Authors'] },
  { id: 'C-12', key: 'agro_motivation_training', name: 'Motivation & Training', shortName: 'TRAIN', icon: Lightbulb, members: '920', gcms: 10, rating: 'A-', description: 'Training programs, workshops, mentorship, and skill development.', services: ['Workshops', 'Mentorship', 'Certification Courses', 'Leadership Training'], color: 'orange', tagline: 'Skills Empowered', highlights: ['Certified Trainers', 'Hands-on Learning', 'Career Path'] },
  { id: 'C-13', key: 'agro_real_estate', name: 'Real Estate (Green)', shortName: 'ESTATE', icon: Home, members: '450', gcms: 6, rating: 'B', description: 'Farmland acquisition, green buildings, and agricultural property.', services: ['Land Acquisition', 'Property Management', 'Green Construction', 'Land Survey'], color: 'green', tagline: 'Land Secured', highlights: ['Verified Lands', 'Legal Support', 'Investment Ready'] },
  { id: 'C-14', key: 'agro_logistics', name: 'Agro Logistics', shortName: 'LOGISTICS', icon: Truck, members: '680', gcms: 7, rating: 'B+', description: 'Transport, cold chain, warehousing, and supply chain solutions.', services: ['Transport Services', 'Cold Chain', 'Warehousing', 'Last Mile Delivery'], color: 'orange', tagline: 'Delivered Fresh', highlights: ['Cold Storage', 'GPS Tracking', 'Same Day Delivery'] },
]

interface CommunitiesHubProps {
  isAuthenticated: boolean
  isCommunityMember: boolean
  userCommunity: string | null
  secondaryCommunities: string[]
  displayName: string | null
  agroId: string | null
}

export function CommunitiesHub({ 
  isAuthenticated, 
  isCommunityMember, 
  userCommunity,
  secondaryCommunities,
  displayName,
  agroId
}: CommunitiesHubProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityData>(
    userCommunity 
      ? COMMUNITIES_DATA.find(c => c.key === userCommunity) ?? COMMUNITIES_DATA[0]
      : COMMUNITIES_DATA[0]
  )
  const [activeTab, setActiveTab] = useState<'overview' | 'feed' | 'services' | 'marketplace'>('overview')

  const isUserInCommunity = (communityKey: string) => {
    return userCommunity === communityKey || secondaryCommunities.includes(communityKey)
  }

  const tabs = [
    { id: 'overview' as const, label: 'OVERVIEW', icon: Activity },
    { id: 'feed' as const, label: 'FEED', icon: MessageSquare },
    { id: 'services' as const, label: 'SERVICES', icon: Zap },
    { id: 'marketplace' as const, label: 'MARKETPLACE', icon: Store },
  ]

  return (
    <main className="pt-24 sm:pt-28 pb-20 relative">
      <div className="absolute inset-0 grid-pattern pointer-events-none -z-10" />

      {/* Hero Section */}
      <CommunityHero 
        community={selectedCommunity}
        isAuthenticated={isAuthenticated}
        isCommunityMember={isCommunityMember}
        isUserInCommunity={isUserInCommunity(selectedCommunity.key)}
        displayName={displayName}
        agroId={agroId}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Community Selector */}
          <aside className="lg:w-72 xl:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-28">
              <div className="border border-border rounded-[2px] bg-card/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="mono-xs text-muted-foreground">/ SELECT COMMUNITY</span>
                  <span className="mono-xs text-primary">{COMMUNITIES_DATA.length}</span>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {COMMUNITIES_DATA.map((community, index) => {
                    const Icon = community.icon
                    const isSelected = selectedCommunity.key === community.key
                    const isMember = isUserInCommunity(community.key)
                    const accentColor = community.color === 'orange' ? 'orange' : 'primary'
                    
                    return (
                      <button
                        key={community.id}
                        onClick={() => setSelectedCommunity(community)}
                        className={`w-full px-4 py-3 flex items-center gap-3 transition-all border-l-2 ${
                          isSelected 
                            ? community.color === 'orange'
                              ? 'bg-orange-soft border-orange'
                              : 'bg-primary/5 border-primary'
                            : 'border-transparent hover:bg-secondary'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? community.color === 'orange'
                              ? 'bg-orange/15'
                              : 'bg-primary/15'
                            : 'bg-muted'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            isSelected
                              ? community.color === 'orange'
                                ? 'text-orange'
                                : 'text-primary'
                              : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <span className={`mono-xs text-[10px] truncate ${
                              isSelected ? 'text-foreground' : 'text-foreground/70'
                            }`}>
                              {community.name}
                            </span>
                            {isMember && (
                              <span className="px-1.5 py-0.5 bg-primary/20 text-primary mono-xs text-[8px] rounded-[2px]">
                                MEMBER
                              </span>
                            )}
                          </div>
                          <span className="mono-xs text-[9px] text-muted-foreground">
                            {community.id} / {community.members} MEMBERS
                          </span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${
                          isSelected
                            ? community.color === 'orange'
                              ? 'text-orange'
                              : 'text-primary'
                            : 'text-muted-foreground/50'
                        }`} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="border border-border rounded-[2px] p-3 bg-card/50">
                  <Users className="w-4 h-4 text-primary mb-2" />
                  <p className="mono text-lg text-foreground">14.8K</p>
                  <p className="mono-xs text-[9px] text-muted-foreground">TOTAL MEMBERS</p>
                </div>
                <div className="border border-border rounded-[2px] p-3 bg-card/50">
                  <TrendingUp className="w-4 h-4 text-orange mb-2" />
                  <p className="mono text-lg text-foreground">127</p>
                  <p className="mono-xs text-[9px] text-muted-foreground">ACTIVE GCMS</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
              {tabs.map((tab) => {
                const TabIcon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? selectedCommunity.color === 'orange'
                          ? 'border-orange text-orange'
                          : 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span className="mono-xs text-[10px]">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedCommunity.key}-${activeTab}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <CommunityOverview 
                    community={selectedCommunity}
                    isAuthenticated={isAuthenticated}
                    isCommunityMember={isCommunityMember}
                    isUserInCommunity={isUserInCommunity(selectedCommunity.key)}
                  />
                )}
                {activeTab === 'feed' && (
                  <CommunityFeed 
                    community={selectedCommunity}
                    isAuthenticated={isAuthenticated}
                  />
                )}
                {activeTab === 'services' && (
                  <CommunityServices 
                    community={selectedCommunity}
                    isAuthenticated={isAuthenticated}
                    isUserInCommunity={isUserInCommunity(selectedCommunity.key)}
                  />
                )}
                {activeTab === 'marketplace' && (
                  <CommunityProducts 
                    community={selectedCommunity}
                    isAuthenticated={isAuthenticated}
                    isUserInCommunity={isUserInCommunity(selectedCommunity.key)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}

function CommunityOverview({ 
  community, 
  isAuthenticated,
  isCommunityMember,
  isUserInCommunity
}: { 
  community: CommunityData
  isAuthenticated: boolean
  isCommunityMember: boolean
  isUserInCommunity: boolean
}) {
  const Icon = community.icon
  const accentColor = community.color === 'orange' ? 'text-orange' : 'text-primary'
  const accentBg = community.color === 'orange' ? 'bg-orange-soft' : 'bg-primary/10'
  const accentBorder = community.color === 'orange' ? 'border-orange/30' : 'border-primary/30'

  return (
    <div className="space-y-6">
      {/* Community Member Notice */}
      {isUserInCommunity && (
        <div className={`p-4 border ${accentBorder} rounded-[2px] ${accentBg}`}>
          <div className="flex items-start gap-3">
            <Sparkles className={`w-5 h-5 ${accentColor} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`mono-sm ${accentColor}`}>YOU ARE A MEMBER OF THIS COMMUNITY</p>
              <p className="text-sm text-foreground/70 mt-1">
                Access your full dashboard with advanced tools, community chat, and exclusive features.
              </p>
              <Link
                href="/dashboard/communities"
                className={`inline-flex items-center gap-2 mt-3 mono-xs text-[10px] ${accentColor} hover:underline`}
              >
                GO TO DASHBOARD <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="border border-border rounded-[2px] bg-card/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <div className="w-1 h-4 bg-primary" />
          <span className="mono-xs text-muted-foreground">/ ABOUT {community.shortName}</span>
        </div>
        <div className="p-5">
          <p className="text-foreground/80 leading-relaxed">{community.description}</p>
          
          <div className="mt-5 flex flex-wrap gap-2">
            {community.highlights.map((highlight, i) => (
              <span 
                key={i}
                className={`px-3 py-1.5 border rounded-[2px] mono-xs text-[10px] ${
                  i % 2 === 0 
                    ? 'border-primary/30 text-primary bg-primary/5' 
                    : 'border-orange/30 text-orange bg-orange-soft'
                }`}
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard index="01" label="MEMBERS" value={community.members} icon={<Users className="w-3.5 h-3.5" />} />
        <StatCard index="02" label="GCMS" value={String(community.gcms)} icon={<MapPin className="w-3.5 h-3.5" />} accent />
        <StatCard index="03" label="RATING" value={community.rating} icon={<Star className="w-3.5 h-3.5" />} />
        <StatCard index="04" label="SERVICES" value={String(community.services.length)} icon={<Zap className="w-3.5 h-3.5" />} accent />
      </div>

      {/* Services Preview */}
      <div className="border border-border rounded-[2px] bg-card/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="mono-xs text-muted-foreground">/ TOP SERVICES</span>
          </div>
          <span className={`mono-xs text-[10px] ${accentColor}`}>{community.services.length} AVAILABLE</span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {community.services.map((service, i) => (
            <ServicePreviewCard 
              key={i}
              service={service}
              index={String(i + 1).padStart(2, '0')}
              isAuthenticated={isAuthenticated}
              isUserInCommunity={isUserInCommunity}
              accent={community.color}
            />
          ))}
        </div>
      </div>

      {/* CTA for non-members */}
      {!isUserInCommunity && (
        <div className="border border-border rounded-[2px] p-6 bg-gradient-to-br from-card to-background">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="mono text-lg text-foreground">Join {community.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Become an Agro Executive and unlock full access to this community.
              </p>
            </div>
            {isAuthenticated ? (
              <Link
                href="/onboarding"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-[2px] mono-sm transition-all ${
                  community.color === 'orange'
                    ? 'bg-orange text-background hover:bg-orange/90'
                    : 'bg-primary text-background hover:bg-primary/90'
                }`}
              >
                <span>BECOME EXECUTIVE</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-[2px] mono-sm transition-all ${
                  community.color === 'orange'
                    ? 'bg-orange text-background hover:bg-orange/90'
                    : 'bg-primary text-background hover:bg-primary/90'
                }`}
              >
                <span>CONNECT TO JOIN</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ 
  index, 
  label, 
  value, 
  icon,
  accent 
}: { 
  index: string
  label: string
  value: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="border border-border rounded-[2px] p-3.5 bg-card/50">
      <div className="flex items-center justify-between mb-3">
        <span className="mono-xs text-muted-foreground/60 text-[9px]">{index}</span>
        <span className={accent ? 'text-orange' : 'text-primary/70'}>{icon}</span>
      </div>
      <p className="mono text-xl text-foreground">{value}</p>
      <p className="mono-xs text-[9px] text-muted-foreground mt-1">/ {label}</p>
    </div>
  )
}

function ServicePreviewCard({
  service,
  index,
  isAuthenticated,
  isUserInCommunity,
  accent
}: {
  service: string
  index: string
  isAuthenticated: boolean
  isUserInCommunity: boolean
  accent: 'green' | 'orange'
}) {
  const targetHref = isAuthenticated
    ? isUserInCommunity
      ? '/dashboard/communities'
      : '/dashboard/marketplace'
    : '/'

  const hoverClasses = accent === 'orange'
    ? 'hover:border-orange/40 hover:bg-orange-soft'
    : 'hover:border-primary/40 hover:bg-primary/5'

  const arrowHoverClass = accent === 'orange'
    ? 'group-hover:text-orange'
    : 'group-hover:text-primary'

  return (
    <Link
      href={targetHref}
      className={`flex items-center gap-3 p-3 border border-border rounded-[2px] transition-all ${hoverClasses} group`}
    >
      <span className="mono-xs text-muted-foreground/50 text-[10px]">{index}</span>
      <span className="mono-xs text-foreground/80 flex-1">{service}</span>
      <ArrowRight className={`w-3.5 h-3.5 text-muted-foreground/50 ${arrowHoverClass} transition-colors`} />
    </Link>
  )
}
