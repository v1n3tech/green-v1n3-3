'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowRight, Star, Clock, Users, CheckCircle, 
  Zap, Shield, Award, ExternalLink, Lock, Loader2
} from 'lucide-react'
import type { CommunityData } from './communities-hub'
import { fetchServices, type CommunityService } from '@/lib/services/actions'

interface CommunityServicesProps {
  community: CommunityData
  isAuthenticated: boolean
  isUserInCommunity: boolean
}

// Community-specific services with more details
const SERVICES_DETAILS: Record<string, Array<{
  id: string
  name: string
  description: string
  price: string
  rating: number
  reviews: number
  turnaround: string
  provider: string
  featured: boolean
  tags: string[]
}>> = {
  crop_farming: [
    { id: 's1', name: 'Seed Supply', description: 'Premium certified seeds for various crops with guaranteed germination rates.', price: 'From N15,000', rating: 4.8, reviews: 234, turnaround: '2-3 days', provider: 'Jos Agro Seeds', featured: true, tags: ['Certified', 'Premium'] },
    { id: 's2', name: 'Soil Analysis', description: 'Comprehensive soil testing and nutrient analysis with recommendations.', price: 'N25,000', rating: 4.9, reviews: 156, turnaround: '5-7 days', provider: 'AgroLab Nigeria', featured: true, tags: ['Lab Certified', 'Detailed Report'] },
    { id: 's3', name: 'Irrigation Solutions', description: 'Custom drip and sprinkler irrigation system design and installation.', price: 'From N120,000', rating: 4.7, reviews: 89, turnaround: '7-14 days', provider: 'WaterTech Farms', featured: false, tags: ['Installation', 'Maintenance'] },
    { id: 's4', name: 'Crop Consultancy', description: 'Expert guidance on crop selection, rotation, and yield optimization.', price: 'N10,000/session', rating: 4.6, reviews: 312, turnaround: 'Same day', provider: 'Dr. Amina Hassan', featured: false, tags: ['Expert', 'Personalized'] },
  ],
  animal_farming: [
    { id: 's1', name: 'Livestock Supply', description: 'Quality day-old chicks, fingerlings, and healthy livestock from certified farms.', price: 'From N5,000', rating: 4.7, reviews: 189, turnaround: '1-2 days', provider: 'Plateau Livestock Hub', featured: true, tags: ['Certified', 'Vaccinated'] },
    { id: 's2', name: 'Veterinary Care', description: '24/7 veterinary services including vaccination, treatment, and health checks.', price: 'From N8,000', rating: 4.9, reviews: 267, turnaround: 'Same day', provider: 'VetCare Jos', featured: true, tags: ['24/7', 'Emergency'] },
    { id: 's3', name: 'Feed Solutions', description: 'Custom formulated feed for poultry, fish, and livestock.', price: 'From N12,000/bag', rating: 4.5, reviews: 145, turnaround: '1-3 days', provider: 'NutriFeeds Nigeria', featured: false, tags: ['Custom', 'Nutritious'] },
    { id: 's4', name: 'Breeding Programs', description: 'Artificial insemination and selective breeding services.', price: 'From N50,000', rating: 4.8, reviews: 78, turnaround: 'By appointment', provider: 'Genesis Genetics', featured: false, tags: ['Advanced', 'Expert'] },
  ],
  agro_technology: [
    { id: 's1', name: 'Drone Services', description: 'Aerial surveying, crop monitoring, and precision spraying services.', price: 'From N45,000/hectare', rating: 4.9, reviews: 156, turnaround: '1-2 days', provider: 'SkyFarm Tech', featured: true, tags: ['Precision', 'Advanced'] },
    { id: 's2', name: 'IoT Sensors', description: 'Smart sensors for soil moisture, temperature, and crop health monitoring.', price: 'From N35,000', rating: 4.7, reviews: 98, turnaround: '3-5 days', provider: 'AgriSense Nigeria', featured: true, tags: ['Real-time', 'Smart'] },
    { id: 's3', name: 'Farm Software', description: 'Farm management software for inventory, sales, and operations tracking.', price: 'N15,000/month', rating: 4.6, reviews: 234, turnaround: 'Instant', provider: 'FarmOS', featured: false, tags: ['Cloud', 'Mobile'] },
    { id: 's4', name: 'Data Analytics', description: 'Predictive analytics and yield forecasting using AI and machine learning.', price: 'From N50,000', rating: 4.8, reviews: 67, turnaround: '7 days', provider: 'AgriData Labs', featured: false, tags: ['AI', 'Insights'] },
  ],
}

// Default services for communities without specific details
const DEFAULT_SERVICES = [
  { id: 's1', name: 'Consultation', description: 'Expert consultation and guidance for your agricultural needs.', price: 'From N10,000', rating: 4.5, reviews: 100, turnaround: 'Same day', provider: 'V1n3 Experts', featured: true, tags: ['Expert', 'Personalized'] },
  { id: 's2', name: 'Training', description: 'Hands-on training programs and workshops.', price: 'From N15,000', rating: 4.6, reviews: 85, turnaround: 'Scheduled', provider: 'V1n3 Academy', featured: true, tags: ['Certified', 'Practical'] },
  { id: 's3', name: 'Equipment', description: 'Access to modern equipment and tools.', price: 'Varies', rating: 4.4, reviews: 120, turnaround: '1-3 days', provider: 'V1n3 Equipment', featured: false, tags: ['Modern', 'Quality'] },
  { id: 's4', name: 'Support', description: '24/7 support and assistance for all your needs.', price: 'Free', rating: 4.8, reviews: 200, turnaround: 'Instant', provider: 'V1n3 Support', featured: false, tags: ['24/7', 'Reliable'] },
]

export function CommunityServices({ community, isAuthenticated, isUserInCommunity }: CommunityServicesProps) {
  const [dbServices, setDbServices] = useState<CommunityService[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadServices() {
      setLoading(true)
      const { services } = await fetchServices({ community: community.key as any, limit: 10 })
      setDbServices(services)
      setLoading(false)
    }
    loadServices()
  }, [community.key])
  
  // Use database services if available, otherwise fallback to static
  const staticServices = SERVICES_DETAILS[community.key] ?? DEFAULT_SERVICES
  const hasDbServices = dbServices.length > 0
  
  const accentColor = community.color === 'orange' ? 'text-orange' : 'text-primary'
  const accentBg = community.color === 'orange' ? 'bg-orange' : 'bg-primary'
  const accentBgSoft = community.color === 'orange' ? 'bg-orange-soft' : 'bg-primary/10'
  const accentBorder = community.color === 'orange' ? 'border-orange' : 'border-primary'

  return (
    <div className="space-y-6">
      {/* Services Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mono text-lg text-foreground">{community.name} Services</h2>
          <p className="text-sm text-muted-foreground mt-1">Access verified service providers in this community.</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className={`w-4 h-4 ${accentColor}`} />
          <span className="mono-xs text-[10px] text-muted-foreground">V1N3 VERIFIED</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Database Services (GCM offerings) */}
          {hasDbServices && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${accentColor}`} />
                <span className="mono-xs text-[10px] text-muted-foreground">/ GCM SERVICES</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dbServices.map((service, index) => (
                  <DbServiceCard
                    key={service.id}
                    service={service}
                    index={index}
                    isAuthenticated={isAuthenticated}
                    accent={community.color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Featured Static Services */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staticServices.filter(s => s.featured).map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={index}
                isAuthenticated={isAuthenticated}
                isUserInCommunity={isUserInCommunity}
                accent={community.color}
                featured
              />
            ))}
          </div>

          {/* All Static Services */}
          <div className="border border-border rounded-[2px] bg-card/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="mono-xs text-muted-foreground">/ ALL SERVICES</span>
              <span className={`mono-xs text-[10px] ${accentColor}`}>{staticServices.length + dbServices.length} AVAILABLE</span>
            </div>
            <div className="divide-y divide-border">
              {staticServices.map((service, index) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  index={index}
                  isAuthenticated={isAuthenticated}
                  isUserInCommunity={isUserInCommunity}
                  accent={community.color}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* CTA for non-authenticated users */}
      {!isAuthenticated && (
        <div className="border border-border rounded-[2px] p-5 bg-gradient-to-br from-card to-background">
          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="mono text-foreground">Unlock Full Service Access</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your wallet to access services, make bookings, and engage with verified providers.
              </p>
              <Link
                href="/"
                className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-[2px] ${accentBg} text-background mono-sm text-xs`}
              >
                CONNECT NOW <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard redirect for members */}
      {isUserInCommunity && (
        <div className={`border ${accentBorder}/30 rounded-[2px] p-5 ${accentBgSoft}`}>
          <div className="flex items-start gap-4">
            <Award className={`w-6 h-6 ${accentColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <h3 className={`mono ${accentColor}`}>Member Benefits Available</h3>
              <p className="text-sm text-foreground/70 mt-1">
                As a community member, you have access to exclusive discounts, priority booking, and advanced tools in your dashboard.
              </p>
              <Link
                href="/dashboard/communities"
                className={`inline-flex items-center gap-2 mt-4 ${accentColor} mono-sm text-xs hover:underline`}
              >
                GO TO DASHBOARD <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ServiceCard({ 
  service, 
  index,
  isAuthenticated,
  isUserInCommunity,
  accent,
  featured
}: { 
  service: typeof DEFAULT_SERVICES[0]
  index: number
  isAuthenticated: boolean
  isUserInCommunity: boolean
  accent: 'green' | 'orange'
  featured?: boolean
}) {
  const accentColor = accent === 'orange' ? 'text-orange' : 'text-primary'
  const accentBg = accent === 'orange' ? 'bg-orange' : 'bg-primary'
  const accentBgSoft = accent === 'orange' ? 'bg-orange-soft' : 'bg-primary/10'
  const accentBorder = accent === 'orange' ? 'border-orange' : 'border-primary'

  const targetHref = isAuthenticated
    ? isUserInCommunity
      ? '/dashboard/communities'
      : '/dashboard/marketplace'
    : '/'

  const hoverBorder = accent === 'orange' ? 'hover:border-orange/40' : 'hover:border-primary/40'
  const borderClass = featured ? `${accentBorder}/30` : 'border-border'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`border rounded-[2px] p-4 bg-card/50 transition-all ${hoverBorder} ${borderClass}`}
    >
      {featured && (
        <div className="flex items-center gap-1.5 mb-3">
          <Zap className={`w-3.5 h-3.5 ${accentColor}`} />
          <span className={`mono-xs text-[9px] ${accentColor}`}>FEATURED</span>
        </div>
      )}
      
      <h3 className="mono text-foreground">{service.name}</h3>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
      
      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-accent fill-accent" />
          <span className="mono-xs text-[10px] text-foreground/80">{service.rating}</span>
          <span className="mono-xs text-[9px] text-muted-foreground">({service.reviews})</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="mono-xs text-[9px] text-muted-foreground">{service.turnaround}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1.5 mt-3">
        {service.tags.map((tag) => (
          <span key={tag} className={`px-2 py-0.5 rounded-[2px] mono-xs text-[8px] ${accentBgSoft} ${accentColor}`}>
            {tag.toUpperCase()}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div>
          <span className="mono text-sm text-foreground">{service.price}</span>
          <span className="mono-xs text-[9px] text-muted-foreground block">{service.provider}</span>
        </div>
        <Link
          href={targetHref}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] ${accentBg} text-background mono-xs text-[9px]`}
        >
          {isAuthenticated ? 'VIEW' : 'CONNECT'}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  )
}

function DbServiceCard({
  service,
  index,
  isAuthenticated,
  accent
}: {
  service: CommunityService
  index: number
  isAuthenticated: boolean
  accent: 'green' | 'orange'
}) {
  const accentColor = accent === 'orange' ? 'text-orange' : 'text-primary'
  const accentBg = accent === 'orange' ? 'bg-orange' : 'bg-primary'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-primary/30 rounded-[2px] p-4 bg-card/50 hover:border-primary/50 transition-all"
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className={`w-3.5 h-3.5 ${accentColor}`} />
        <span className={`mono-xs text-[9px] ${accentColor}`}>GCM SERVICE</span>
      </div>
      
      <h3 className="mono text-foreground">{service.title}</h3>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
      
      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-accent fill-accent" />
          <span className="mono-xs text-[10px] text-foreground/80">{service.rating.toFixed(1)}</span>
          <span className="mono-xs text-[9px] text-muted-foreground">({service.reviews_count})</span>
        </div>
        {service.turnaround_time && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="mono-xs text-[9px] text-muted-foreground">{service.turnaround_time}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div>
          <span className="mono text-sm text-primary">{service.price.toLocaleString()} V1N3</span>
          <span className="mono-xs text-[9px] text-muted-foreground block">{service.price_unit}</span>
        </div>
        <Link
          href={isAuthenticated ? '/dashboard/requests' : '/'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] ${accentBg} text-background mono-xs text-[9px]`}
        >
          {isAuthenticated ? 'REQUEST' : 'CONNECT'}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      {service.gcm && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <span className="mono-xs text-[9px] text-muted-foreground">
            by {service.gcm.display_name} • {service.completed_count} completed
          </span>
        </div>
      )}
    </motion.div>
  )
}

function ServiceRow({
  service,
  index,
  isAuthenticated,
  isUserInCommunity,
  accent
}: {
  service: typeof DEFAULT_SERVICES[0]
  index: number
  isAuthenticated: boolean
  isUserInCommunity: boolean
  accent: 'green' | 'orange'
}) {
  const accentColor = accent === 'orange' ? 'text-orange' : 'text-primary'
  const iconHoverClass = accent === 'orange' ? 'group-hover:text-orange' : 'group-hover:text-primary'
  
  const targetHref = isAuthenticated
    ? isUserInCommunity
      ? '/dashboard/communities'
      : '/dashboard/marketplace'
    : '/'

  return (
    <Link
      href={targetHref}
      className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-all group"
    >
      <span className="mono-xs text-muted-foreground/50 text-[10px] w-6">{String(index + 1).padStart(2, '0')}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="mono-sm text-foreground text-xs truncate">{service.name}</span>
          {service.featured && <Zap className={`w-3 h-3 ${accentColor}`} />}
        </div>
        <span className="mono-xs text-[9px] text-muted-foreground">{service.provider}</span>
      </div>
      <div className="flex items-center gap-1.5 hidden sm:flex">
        <Star className="w-3 h-3 text-accent fill-accent" />
        <span className="mono-xs text-[10px] text-foreground/70">{service.rating}</span>
      </div>
      <span className="mono-xs text-[10px] text-foreground/80 hidden md:block">{service.price}</span>
      <ExternalLink className={`w-3.5 h-3.5 text-muted-foreground/50 ${iconHoverClass} transition-colors`} />
    </Link>
  )
}
