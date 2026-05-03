'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  ArrowRight, Star, ShoppingCart, Heart, Filter,
  Grid3X3, List, Lock, Truck, Shield, CheckCircle,
  Tag, TrendingUp
} from 'lucide-react'
import type { CommunityData } from './communities-hub'

interface CommunityProductsProps {
  community: CommunityData
  isAuthenticated: boolean
  isUserInCommunity: boolean
}

// Mock product data - in production this would come from Supabase
const MOCK_PRODUCTS = [
  {
    id: 'p1',
    name: 'Organic Tomato Seeds (500g)',
    description: 'High-yield Roma tomato seeds, certified organic.',
    price: 15000,
    originalPrice: 18000,
    image: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=400&h=400&fit=crop',
    seller: 'Jos Agro Seeds',
    rating: 4.8,
    reviews: 156,
    sold: 1240,
    inStock: true,
    category: 'Seeds',
    tags: ['Organic', 'Bestseller'],
  },
  {
    id: 'p2',
    name: 'Day-Old Broiler Chicks (100pcs)',
    description: 'Healthy vaccinated broiler chicks, fast growth.',
    price: 85000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&h=400&fit=crop',
    seller: 'Plateau Poultry',
    rating: 4.9,
    reviews: 234,
    sold: 890,
    inStock: true,
    category: 'Livestock',
    tags: ['Vaccinated', 'Premium'],
  },
  {
    id: 'p3',
    name: 'Solar Irrigation Pump System',
    description: 'Complete solar-powered irrigation system for 1 hectare.',
    price: 450000,
    originalPrice: 520000,
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=400&fit=crop',
    seller: 'WaterTech Farms',
    rating: 4.7,
    reviews: 67,
    sold: 45,
    inStock: true,
    category: 'Equipment',
    tags: ['Solar', 'Eco-friendly'],
  },
  {
    id: 'p4',
    name: 'NPK Fertilizer (50kg)',
    description: 'Balanced 15-15-15 NPK compound fertilizer.',
    price: 28000,
    originalPrice: 32000,
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
    seller: 'FertilePlus Nigeria',
    rating: 4.5,
    reviews: 312,
    sold: 2100,
    inStock: true,
    category: 'Fertilizers',
    tags: ['Bestseller'],
  },
  {
    id: 'p5',
    name: 'Catfish Fingerlings (1000pcs)',
    description: 'Healthy clarias fingerlings, 4-6 weeks old.',
    price: 45000,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop',
    seller: 'AquaFarms Jos',
    rating: 4.6,
    reviews: 189,
    sold: 560,
    inStock: false,
    category: 'Fishery',
    tags: ['Pre-order'],
  },
  {
    id: 'p6',
    name: 'Farm Management Software (1 Year)',
    description: 'Complete farm management and tracking software.',
    price: 180000,
    originalPrice: 240000,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
    seller: 'FarmOS',
    rating: 4.8,
    reviews: 145,
    sold: 320,
    inStock: true,
    category: 'Software',
    tags: ['Digital', '25% OFF'],
  },
]

export function CommunityProducts({ community, isAuthenticated, isUserInCommunity }: CommunityProductsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [wishlist, setWishlist] = useState<string[]>([])
  
  const accentColor = community.color === 'orange' ? 'text-orange' : 'text-primary'
  const accentBg = community.color === 'orange' ? 'bg-orange' : 'bg-primary'
  const accentBgSoft = community.color === 'orange' ? 'bg-orange-soft' : 'bg-primary/10'
  const accentBorder = community.color === 'orange' ? 'border-orange' : 'border-primary'

  const toggleWishlist = (productId: string) => {
    if (!isAuthenticated) return
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  return (
    <div className="space-y-6">
      {/* Marketplace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="mono text-lg text-foreground">Marketplace</h2>
          <p className="text-sm text-muted-foreground mt-1">Products and equipment from {community.name} providers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-[2px] text-muted-foreground hover:text-foreground transition-all">
            <Filter className="w-3 h-3" />
            <span className="mono-xs text-[9px]">FILTER</span>
          </button>
          <div className="flex items-center border border-border rounded-[2px] overflow-hidden">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors ${viewMode === 'grid' ? accentBgSoft : ''}`}
            >
              <Grid3X3 className={`w-4 h-4 ${viewMode === 'grid' ? accentColor : 'text-muted-foreground'}`} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 transition-colors ${viewMode === 'list' ? accentBgSoft : ''}`}
            >
              <List className={`w-4 h-4 ${viewMode === 'list' ? accentColor : 'text-muted-foreground'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap gap-4 py-3 border-y border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="mono-xs text-[10px] text-muted-foreground">VERIFIED SELLERS</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          <span className="mono-xs text-[10px] text-muted-foreground">SECURE DELIVERY</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          <span className="mono-xs text-[10px] text-muted-foreground">QUALITY GUARANTEED</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {MOCK_PRODUCTS.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            viewMode={viewMode}
            isAuthenticated={isAuthenticated}
            isUserInCommunity={isUserInCommunity}
            isInWishlist={wishlist.includes(product.id)}
            onWishlistToggle={() => toggleWishlist(product.id)}
            accent={community.color}
          />
        ))}
      </div>

      {/* Load More */}
      <div className="pt-4 flex justify-center">
        <button className="flex items-center gap-2 px-6 py-2.5 border border-border rounded-[2px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all mono-xs text-[10px]">
          LOAD MORE PRODUCTS
        </button>
      </div>

      {/* Auth Gate */}
      {!isAuthenticated && (
        <div className="border border-border rounded-[2px] p-5 bg-gradient-to-br from-card to-background mt-6">
          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="mono text-foreground">Unlock Shopping</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect to purchase products, save to wishlist, and access exclusive member prices.
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
    </div>
  )
}

function ProductCard({
  product,
  index,
  viewMode,
  isAuthenticated,
  isUserInCommunity,
  isInWishlist,
  onWishlistToggle,
  accent
}: {
  product: typeof MOCK_PRODUCTS[0]
  index: number
  viewMode: 'grid' | 'list'
  isAuthenticated: boolean
  isUserInCommunity: boolean
  isInWishlist: boolean
  onWishlistToggle: () => void
  accent: 'green' | 'orange'
}) {
  const accentColor = accent === 'orange' ? 'text-orange' : 'text-primary'
  const accentBg = accent === 'orange' ? 'bg-orange' : 'bg-primary'
  const accentBgSoft = accent === 'orange' ? 'bg-orange-soft' : 'bg-primary/10'

  const targetHref = isAuthenticated
    ? isUserInCommunity
      ? '/dashboard/communities'
      : '/dashboard/marketplace'
    : '/'

  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex gap-4 border border-border rounded-[2px] p-3 bg-card/50 hover:border-primary/30 transition-all"
      >
        <div className="relative w-24 h-24 rounded-[2px] overflow-hidden bg-muted flex-shrink-0">
          <Image src={product.image} alt={product.name} fill className="object-cover" />
          {!product.inStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <span className="mono-xs text-[9px] text-muted-foreground">OUT OF STOCK</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="mono-sm text-foreground text-xs truncate">{product.name}</h3>
              <p className="mono-xs text-[9px] text-muted-foreground">{product.seller}</p>
            </div>
            <button 
              onClick={onWishlistToggle}
              className={`p-1.5 rounded-[2px] transition-colors ${
                !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="mono text-foreground">N{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="mono-xs text-[10px] text-muted-foreground line-through">
                N{product.originalPrice.toLocaleString()}
              </span>
            )}
            {discount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-[2px] mono-xs text-[8px] ${accentBgSoft} ${accentColor}`}>
                -{discount}%
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3 text-accent fill-accent" />
              <span className="mono-xs text-[10px] text-foreground/70">{product.rating} ({product.reviews})</span>
            </div>
            <Link
              href={targetHref}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] ${accentBg} text-background mono-xs text-[9px]`}
            >
              <ShoppingCart className="w-3 h-3" />
              {isAuthenticated ? 'VIEW' : 'CONNECT'}
            </Link>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-border rounded-[2px] bg-card/50 overflow-hidden hover:border-primary/30 transition-all group"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.tags.map((tag) => (
            <span key={tag} className={`px-2 py-0.5 rounded-[2px] mono-xs text-[8px] ${
              tag.includes('OFF') || tag === 'Bestseller' 
                ? `${accentBgSoft} ${accentColor}` 
                : 'bg-background/80 text-foreground'
            }`}>
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
        
        {/* Wishlist */}
        <button 
          onClick={onWishlistToggle}
          className={`absolute top-2 right-2 p-2 rounded-[2px] bg-background/80 transition-colors ${
            !isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'hover:bg-background'
          }`}
        >
          <Heart className={`w-4 h-4 ${isInWishlist ? 'text-red-500 fill-red-500' : 'text-foreground'}`} />
        </button>
        
        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="mono text-muted-foreground">OUT OF STOCK</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="mono-xs text-[9px] text-muted-foreground truncate">{product.seller}</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-accent fill-accent" />
            <span className="mono-xs text-[10px] text-foreground/70">{product.rating}</span>
          </div>
        </div>
        
        <h3 className="mono-sm text-foreground text-xs line-clamp-2 min-h-[2.5em]">{product.name}</h3>
        
        <div className="flex items-baseline gap-2 mt-2">
          <span className="mono text-foreground">N{product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="mono-xs text-[10px] text-muted-foreground line-through">
              N{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <TrendingUp className="w-3 h-3 text-muted-foreground" />
          <span className="mono-xs text-[9px] text-muted-foreground">{product.sold.toLocaleString()} sold</span>
        </div>
        
        <Link
          href={targetHref}
          className={`w-full flex items-center justify-center gap-2 mt-3 px-3 py-2 rounded-[2px] ${accentBg} text-background mono-xs text-[10px] transition-opacity hover:opacity-90`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {isAuthenticated ? 'VIEW PRODUCT' : 'CONNECT TO BUY'}
        </Link>
      </div>
    </motion.div>
  )
}
