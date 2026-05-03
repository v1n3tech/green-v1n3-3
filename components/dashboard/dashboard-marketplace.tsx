'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBag,
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Heart,
  ShoppingCart,
  MapPin,
  Verified,
  TrendingUp,
  Package,
} from 'lucide-react'
import Image from 'next/image'

const CATEGORIES = [
  { key: 'all', label: 'ALL' },
  { key: 'crops', label: 'CROPS' },
  { key: 'livestock', label: 'LIVESTOCK' },
  { key: 'equipment', label: 'EQUIPMENT' },
  { key: 'seeds', label: 'SEEDS' },
  { key: 'fertilizer', label: 'FERTILIZER' },
  { key: 'services', label: 'SERVICES' },
]

const PRODUCTS = [
  {
    id: '1',
    name: 'Organic Tomatoes',
    seller: 'Ibrahim Farm',
    location: 'Jos South',
    price: 2500,
    unit: 'basket',
    rating: 4.8,
    reviews: 24,
    image: '/communities/crop-farming.jpg',
    verified: true,
    category: 'crops',
    inStock: true,
  },
  {
    id: '2',
    name: 'Fresh Maize (50kg)',
    seller: 'Plateau Grains',
    location: 'Barkin Ladi',
    price: 8500,
    unit: 'bag',
    rating: 4.9,
    reviews: 56,
    image: '/communities/crop-farming.jpg',
    verified: true,
    category: 'crops',
    inStock: true,
  },
  {
    id: '3',
    name: 'Layer Chickens (Point of Lay)',
    seller: 'GreenV1n3 Poultry',
    location: 'Jos North',
    price: 4500,
    unit: 'bird',
    rating: 4.7,
    reviews: 38,
    image: '/communities/animal-farming.jpg',
    verified: true,
    category: 'livestock',
    inStock: true,
  },
  {
    id: '4',
    name: 'Hybrid Tomato Seeds',
    seller: 'AgriTech Seeds',
    location: 'Mangu',
    price: 3500,
    unit: 'pack',
    rating: 4.6,
    reviews: 18,
    image: '/communities/agro-technology.jpg',
    verified: false,
    category: 'seeds',
    inStock: true,
  },
  {
    id: '5',
    name: 'NPK Fertilizer (50kg)',
    seller: 'Plateau Agro Inputs',
    location: 'Jos East',
    price: 28000,
    unit: 'bag',
    rating: 4.5,
    reviews: 42,
    image: '/communities/crop-farming.jpg',
    verified: true,
    category: 'fertilizer',
    inStock: false,
  },
  {
    id: '6',
    name: 'Spraying Services',
    seller: 'AgroTech Solutions',
    location: 'State-wide',
    price: 15000,
    unit: 'hectare',
    rating: 4.9,
    reviews: 89,
    image: '/communities/agro-technology.jpg',
    verified: true,
    category: 'services',
    inStock: true,
  },
]

export function DashboardMarketplace() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.seller.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ 03 — MARKETPLACE</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ShoppingCart className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange text-[9px] text-background rounded-full flex items-center justify-center mono-xs">
              2
            </span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <div className="bg-background border border-border rounded-[2px] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-3.5 h-3.5 text-primary" />
            <span className="mono-xs text-[9px] text-muted-foreground">PRODUCTS</span>
          </div>
          <p className="font-mono text-lg text-foreground">1,234</p>
        </div>
        <div className="bg-background border border-border rounded-[2px] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Verified className="w-3.5 h-3.5 text-primary" />
            <span className="mono-xs text-[9px] text-muted-foreground">VERIFIED</span>
          </div>
          <p className="font-mono text-lg text-foreground">892</p>
        </div>
        <div className="bg-background border border-border rounded-[2px] p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
            <span className="mono-xs text-[9px] text-muted-foreground">TRENDING</span>
          </div>
          <p className="font-mono text-lg text-foreground">45</p>
        </div>
        <div className="bg-background border border-border rounded-[2px] p-3">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-orange" />
            <span className="mono-xs text-[9px] text-muted-foreground">ORDERS</span>
          </div>
          <p className="font-mono text-lg text-foreground">156</p>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 bg-secondary/50 border border-border rounded-[2px]">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products, sellers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none flex-1"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-[2px] hover:border-primary/40 transition-colors">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="mono-xs text-[10px] text-foreground">FILTERS</span>
          </button>
          <div className="flex border border-border rounded-[2px] overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2 mono-xs text-[10px] rounded-[2px] whitespace-nowrap transition-colors ${
              selectedCategory === cat.key
                ? 'bg-primary text-background'
                : 'bg-secondary border border-border text-foreground/70 hover:border-primary/40'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>

      {/* Products Grid/List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
        }
      >
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {viewMode === 'grid' ? (
              <ProductCard product={product} />
            ) : (
              <ProductRow product={product} />
            )}
          </motion.div>
        ))}
      </motion.div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="mono-sm text-foreground">No products found</p>
          <p className="mono-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: typeof PRODUCTS[0] }) {
  return (
    <div className="bg-background border border-border rounded-[2px] overflow-hidden group hover:border-primary/40 transition-all">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-[2px] flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Heart className="w-4 h-4" />
        </button>
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="mono-xs text-[10px] text-destructive">OUT OF STOCK</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="mono-sm text-xs text-foreground leading-tight">{product.name}</h3>
          {product.verified && <Verified className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <span className="mono-xs text-[9px] text-muted-foreground">{product.seller}</span>
          <span className="text-border-strong">•</span>
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <span className="mono-xs text-[9px] text-muted-foreground">{product.location}</span>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <Star className="w-3 h-3 text-accent fill-accent" />
          <span className="mono-xs text-[10px] text-foreground">{product.rating}</span>
          <span className="mono-xs text-[9px] text-muted-foreground">({product.reviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-lg text-primary">N{product.price.toLocaleString()}</span>
            <span className="mono-xs text-[9px] text-muted-foreground">/{product.unit}</span>
          </div>
          <button 
            disabled={!product.inStock}
            className="px-3 py-1.5 bg-primary text-background mono-xs text-[10px] rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ADD
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductRow({ product }: { product: typeof PRODUCTS[0] }) {
  return (
    <div className="bg-background border border-border rounded-[2px] p-4 flex gap-4 hover:border-primary/40 transition-all">
      {/* Image */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-secondary rounded-[2px] overflow-hidden flex-shrink-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="mono-xs text-[8px] text-destructive">OUT</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="mono-sm text-xs text-foreground">{product.name}</h3>
              {product.verified && <Verified className="w-3.5 h-3.5 text-primary" />}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="mono-xs text-[9px] text-muted-foreground">{product.seller}</span>
              <span className="text-border-strong">•</span>
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="mono-xs text-[9px] text-muted-foreground">{product.location}</span>
            </div>
          </div>
          <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <Heart className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <Star className="w-3 h-3 text-accent fill-accent" />
          <span className="mono-xs text-[10px] text-foreground">{product.rating}</span>
          <span className="mono-xs text-[9px] text-muted-foreground">({product.reviews} reviews)</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3">
          <div>
            <span className="font-mono text-xl text-primary">N{product.price.toLocaleString()}</span>
            <span className="mono-xs text-[10px] text-muted-foreground ml-1">/{product.unit}</span>
          </div>
          <button 
            disabled={!product.inStock}
            className="px-4 py-2 bg-primary text-background mono-xs text-[10px] rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ADD TO CART
          </button>
        </div>
      </div>
    </div>
  )
}
