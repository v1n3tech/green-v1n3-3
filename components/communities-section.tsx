'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Leaf, Bird, ShoppingBag, Factory, Scale, Palmtree, Cpu, Heart,
  Radio, Shield, BookOpen, Lightbulb, Home, Truck, ArrowRight
} from 'lucide-react'

const communities = [
  { id: 'C-01', name: 'Crop Farming', icon: Leaf, members: '2.4K', gcms: 18, rating: 'A+' },
  { id: 'C-02', name: 'Animal Farming', icon: Bird, members: '1.8K', gcms: 15, rating: 'A' },
  { id: 'C-03', name: 'Agro Marketing', icon: ShoppingBag, members: '1.5K', gcms: 12, rating: 'A-' },
  { id: 'C-04', name: 'Agro Processing', icon: Factory, members: '980', gcms: 10, rating: 'B+' },
  { id: 'C-05', name: 'Mgmt. & Legislation', icon: Scale, members: '1.2K', gcms: 12, rating: 'A-' },
  { id: 'C-06', name: 'Agro Tourism', icon: Palmtree, members: '650', gcms: 8, rating: 'B' },
  { id: 'C-07', name: 'Agro Technology', icon: Cpu, members: '1.1K', gcms: 11, rating: 'A' },
  { id: 'C-08', name: 'Agro Health Care', icon: Heart, members: '890', gcms: 9, rating: 'B+' },
  { id: 'C-09', name: 'Media & Branding', icon: Radio, members: '720', gcms: 8, rating: 'B+' },
  { id: 'C-10', name: 'Agro Security', icon: Shield, members: '540', gcms: 6, rating: 'B' },
  { id: 'C-11', name: 'Agro Literature', icon: BookOpen, members: '380', gcms: 5, rating: 'B-' },
  { id: 'C-12', name: 'Motivation & Training', icon: Lightbulb, members: '920', gcms: 10, rating: 'A-' },
  { id: 'C-13', name: 'Real Estate (Green)', icon: Home, members: '450', gcms: 6, rating: 'B' },
  { id: 'C-14', name: 'Agro Logistics', icon: Truck, members: '680', gcms: 7, rating: 'B+' },
]

const communityDescriptions: Record<string, string> = {
  'C-01': 'Food crop cultivation, cash crops, horticulture.',
  'C-02': 'Poultry, livestock, fishery, apiculture.',
  'C-03': 'Distribution, wholesale, retail, export.',
  'C-04': 'Value addition, packaging, preservation.',
  'C-05': 'Policy, governance, contracts, compliance.',
  'C-06': 'Farm visits, agro-parks, eco-tourism.',
  'C-07': 'Smart farming, IoT, drones, analytics.',
  'C-08': 'Animal health, plant pathology, food safety.',
  'C-09': 'Content creation, PR, social media.',
  'C-10': 'Farm protection, anti-theft, surveillance.',
  'C-11': 'Research, documentation, publications.',
  'C-12': 'Training programs, workshops, mentorship.',
  'C-13': 'Farmland acquisition, green buildings.',
  'C-14': 'Transport, cold chain, warehousing.',
}

// Alternating filamental accent — even index = green, odd = orange
const accentForIndex = (i: number): 'green' | 'orange' => (i % 2 === 0 ? 'green' : 'orange')

export function CommunitiesSection() {
  const [selectedIndex, setSelectedIndex] = useState(7)
  const selected = communities[selectedIndex]
  const selectedAccent = accentForIndex(selectedIndex)

  return (
    <section id="communities" className="py-12 sm:py-16 md:py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center gap-2 sm:gap-2.5 mb-8 sm:mb-10 md:mb-12">
          <div className="w-1 h-4 sm:h-5 bg-primary" />
          <span className="mono-xs text-primary">/ 03 — COMMUNITIES</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
          {/* Hexagonal Grid */}
          <div className="flex-1 py-2 sm:py-4 w-full max-w-full lg:max-w-[620px]">
            {/* Row 1 - 5 items */}
            <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1 mb-[-12px] sm:mb-[-16px]">
              {communities.slice(0, 5).map((community, i) => {
                const idx = i
                return (
                  <HexCard
                    key={community.id}
                    community={community}
                    accent={accentForIndex(idx)}
                    isSelected={selectedIndex === idx}
                    onClick={() => setSelectedIndex(idx)}
                  />
                )
              })}
            </div>

            {/* Row 2 - 4 items (offset) */}
            <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1 mb-[-12px] sm:mb-[-16px]">
              {communities.slice(5, 9).map((community, i) => {
                const idx = i + 5
                return (
                  <HexCard
                    key={community.id}
                    community={community}
                    accent={accentForIndex(idx)}
                    isSelected={selectedIndex === idx}
                    onClick={() => setSelectedIndex(idx)}
                  />
                )
              })}
            </div>

            {/* Row 3 - 5 items */}
            <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1">
              {communities.slice(9, 14).map((community, i) => {
                const idx = i + 9
                return (
                  <HexCard
                    key={community.id}
                    community={community}
                    accent={accentForIndex(idx)}
                    isSelected={selectedIndex === idx}
                    onClick={() => setSelectedIndex(idx)}
                  />
                )
              })}
            </div>
          </div>

          {/* Selected Community Panel - Beside Hex Grid */}
          <div className="w-full lg:w-[320px] xl:w-[340px] border border-border rounded-[4px] bg-card/50 flex-shrink-0 lg:sticky lg:top-[140px]">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center justify-between">
              <span className="mono-xs text-muted-foreground">SELECTED : V1N3</span>
              <span className={`mono-xs ${selectedAccent === 'orange' ? 'text-orange' : 'text-primary'}`}>{selected.id}</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-4 sm:p-5"
              >
                {/* Icon and Title */}
                <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[4px] flex items-center justify-center flex-shrink-0 border ${
                      selectedAccent === 'orange'
                        ? 'bg-orange-soft border-orange/25'
                        : 'bg-primary/10 border-primary/25'
                    }`}
                  >
                    <selected.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedAccent === 'orange' ? 'text-orange' : 'text-primary'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="mono text-base sm:text-lg text-foreground leading-tight">{selected.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-1.5 leading-relaxed">
                      {communityDescriptions[selected.id]}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
                  <div className="p-2.5 sm:p-3 border border-border rounded-[4px] bg-background/50">
                    <div className="mono text-sm sm:text-base text-foreground">{selected.members}</div>
                    <div className="mono-xs text-muted-foreground mt-0.5 text-[9px] sm:text-[10px]">MEMBERS</div>
                  </div>
                  <div className="p-2.5 sm:p-3 border border-border rounded-[4px] bg-background/50">
                    <div className="mono text-sm sm:text-base text-foreground">{selected.gcms}</div>
                    <div className="mono-xs text-muted-foreground mt-0.5 text-[9px] sm:text-[10px]">GCMS</div>
                  </div>
                  <div className="p-2.5 sm:p-3 border border-border rounded-[4px] bg-background/50">
                    <div className="mono text-sm sm:text-base text-foreground">{selected.rating}</div>
                    <div className="mono-xs text-muted-foreground mt-0.5 text-[9px] sm:text-[10px]">AVG RATING</div>
                  </div>
                </div>

                {/* Register Button */}
                <Link
                  href="/communities"
                  className={`w-full flex items-center justify-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 border rounded-[4px] mono-sm text-foreground/90 transition-all group ${
                    selectedAccent === 'orange'
                      ? 'border-orange/30 hover:border-orange/60 hover:bg-orange-soft'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <span className="text-xs sm:text-sm">REGISTER HERE</span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform ${
                      selectedAccent === 'orange' ? 'text-orange' : 'text-primary'
                    }`}
                  />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

interface HexCardProps {
  community: typeof communities[0]
  accent: 'green' | 'orange'
  isSelected: boolean
  onClick: () => void
}

function HexCard({ community, accent, isSelected, onClick }: HexCardProps) {
  const Icon = community.icon
  const isOrange = accent === 'orange'

  // Filamental palette — thin threads, low-opacity strokes, near-transparent fills
  const stroke = isSelected
    ? (isOrange ? '#ff6b1a' : '#00c853')
    : (isOrange ? 'rgba(255, 107, 26, 0.32)' : 'rgba(0, 200, 83, 0.30)')

  const fill = isSelected
    ? (isOrange ? 'rgba(255, 107, 26, 0.10)' : 'rgba(0, 200, 83, 0.08)')
    : '#060906'

  const idColor = isSelected
    ? (isOrange ? 'text-orange' : 'text-primary')
    : 'text-muted-foreground'

  const iconColor = isSelected
    ? (isOrange ? 'text-orange' : 'text-primary')
    : (isOrange ? 'text-orange/70' : 'text-primary/70')

  return (
    <button
      onClick={onClick}
      className="relative w-[70px] h-[82px] sm:w-[85px] sm:h-[98px] md:w-[95px] md:h-[110px] flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-100 group"
    >
      {/* Hexagon Shape — filamental thread */}
      <svg
        viewBox="0 0 100 115"
        className="absolute inset-0 w-full h-full"
      >
        <polygon
          points="50,0 100,28.75 100,86.25 50,115 0,86.25 0,28.75"
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 1.5 : 1}
          className={`transition-all duration-200 ${
            !isSelected
              ? isOrange
                ? 'group-hover:[stroke:#ff6b1a]'
                : 'group-hover:[stroke:#00c853]'
              : ''
          }`}
        />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 text-center">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor} transition-colors`} />
        <span className={`mono-xs leading-tight text-[8px] sm:text-[9px] md:text-[10px] ${isSelected ? 'text-foreground' : 'text-foreground/75'}`}>
          {community.name}
        </span>
        <span className={`mono-xs text-[8px] sm:text-[9px] md:text-[10px] ${idColor}`}>
          {community.id}
        </span>
      </div>
    </button>
  )
}
