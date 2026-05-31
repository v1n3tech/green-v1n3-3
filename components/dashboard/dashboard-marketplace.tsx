'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Search,
  Grid3X3,
  List,
  Star,
  Heart,
  MapPin,
  Verified,
  TrendingUp,
  Package,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Upload,
  Trash2,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import Image from 'next/image'
import {
  createProduct,
  reviewProduct,
  deleteProduct,
  toggleFavorite,
  PRODUCT_CATEGORIES,
  type MarketplaceProduct,
  type ProductStatus,
} from '@/lib/marketplace/actions'
import { COMMUNITIES, type AgroCommunityKey } from '@/components/onboarding/data'

const CATEGORIES = [
  { key: 'all', label: 'ALL' },
  { key: 'crops', label: 'CROPS' },
  { key: 'livestock', label: 'LIVESTOCK' },
  { key: 'equipment', label: 'EQUIPMENT' },
  { key: 'seeds', label: 'SEEDS' },
  { key: 'fertilizer', label: 'FERTILIZER' },
  { key: 'services', label: 'SERVICES' },
  { key: 'other', label: 'OTHER' },
]

const CATEGORY_FALLBACK: Record<string, string> = {
  crops: '/communities/crop-farming.jpg',
  livestock: '/communities/animal-farming.jpg',
  seeds: '/communities/agro-technology.jpg',
  fertilizer: '/communities/crop-farming.jpg',
  equipment: '/communities/agro-technology.jpg',
  services: '/communities/agro-technology.jpg',
  other: '/communities/crop-farming.jpg',
}

function productImage(p: MarketplaceProduct) {
  return p.thumbnail || CATEGORY_FALLBACK[p.category] || '/communities/crop-farming.jpg'
}

type Tab = 'browse' | 'listings' | 'review'

interface DashboardMarketplaceProps {
  role: string
  canList: boolean
  canApprove: boolean
  initialTab?: Tab
  userCommunity: AgroCommunityKey | null
  initialProducts: MarketplaceProduct[]
  myProducts: MarketplaceProduct[]
  pendingProducts: MarketplaceProduct[]
  favoriteIds: string[]
  stats: { products: number; verified: number }
}

export function DashboardMarketplace({
  role,
  canList,
  canApprove,
  initialTab = 'browse',
  userCommunity,
  initialProducts,
  myProducts,
  pendingProducts,
  favoriteIds,
  stats,
}: DashboardMarketplaceProps) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set(favoriteIds))
  const [pending, setPending] = useState<MarketplaceProduct[]>(pendingProducts)
  const [, startTransition] = useTransition()

  const filteredProducts = initialProducts.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      p.title.toLowerCase().includes(q) ||
      (p.seller?.display_name ?? '').toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  function handleToggleFavorite(id: string) {
    // Optimistic
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    startTransition(async () => {
      await toggleFavorite(id)
    })
  }

  const tabs: { key: Tab; label: string; show: boolean; badge?: number }[] = [
    { key: 'browse', label: 'BROWSE', show: true },
    { key: 'listings', label: 'MY LISTINGS', show: canList, badge: myProducts.length },
    { key: 'review', label: 'REVIEW', show: canApprove, badge: pending.length },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-primary" />
          <span className="mono-xs text-primary text-[10px] tracking-wider">/ 03 — MARKETPLACE</span>
        </div>
        {canList && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background mono-xs text-[10px] rounded-[2px] hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            NEW LISTING
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <StatCard icon={<Package className="w-3.5 h-3.5 text-primary" />} label="PRODUCTS" value={stats.products} />
        <StatCard icon={<Verified className="w-3.5 h-3.5 text-primary" />} label="FEATURED" value={stats.verified} />
        <StatCard
          icon={<TrendingUp className="w-3.5 h-3.5 text-accent" />}
          label="MY LISTINGS"
          value={canList ? myProducts.length : 0}
        />
        <StatCard
          icon={<Clock className="w-3.5 h-3.5 text-orange" />}
          label="IN REVIEW"
          value={canApprove ? pending.length : myProducts.filter((p) => p.status === 'pending_review').length}
        />
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2.5 mono-xs text-[10px] tracking-wider transition-colors ${
              tab === t.key
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {t.label}
              {typeof t.badge === 'number' && t.badge > 0 && (
                <span className="px-1.5 py-0.5 bg-orange/20 text-orange rounded-full text-[8px]">{t.badge}</span>
              )}
            </span>
            {tab === t.key && (
              <motion.div layoutId="mkt-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* BROWSE TAB */}
      {tab === 'browse' && (
        <BrowseTab
          products={filteredProducts}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* MY LISTINGS TAB */}
      {tab === 'listings' && canList && (
        <ListingsTab products={myProducts} onCreate={() => setShowCreate(true)} />
      )}

      {/* REVIEW TAB */}
      {tab === 'review' && canApprove && (
        <ReviewTab
          products={pending}
          onResolved={(id) => setPending((prev) => prev.filter((p) => p.id !== id))}
        />
      )}

      {/* Create Listing Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateListingModal
            role={role}
            canApprove={canApprove}
            userCommunity={userCommunity}
            onClose={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-background border border-border rounded-[2px] p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="mono-xs text-[9px] text-muted-foreground">{label}</span>
      </div>
      <p className="font-mono text-lg text-foreground">{value.toLocaleString()}</p>
    </div>
  )
}

// ============ BROWSE ============

function BrowseTab({
  products,
  viewMode,
  setViewMode,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  favorites,
  onToggleFavorite,
}: {
  products: MarketplaceProduct[]
  viewMode: 'grid' | 'list'
  setViewMode: (v: 'grid' | 'list') => void
  selectedCategory: string
  setSelectedCategory: (c: string) => void
  searchQuery: string
  setSearchQuery: (s: string) => void
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Search & view toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
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

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
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
      </div>

      {/* Products */}
      <div
        className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
        }
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.4) }}
          >
            {viewMode === 'grid' ? (
              <ProductCard product={product} favorited={favorites.has(product.id)} onToggleFavorite={onToggleFavorite} />
            ) : (
              <ProductRow product={product} favorited={favorites.has(product.id)} onToggleFavorite={onToggleFavorite} />
            )}
          </motion.div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="mono-sm text-foreground">No products found</p>
          <p className="mono-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}

function ProductCard({
  product,
  favorited,
  onToggleFavorite,
}: {
  product: MarketplaceProduct
  favorited: boolean
  onToggleFavorite: (id: string) => void
}) {
  const inStock = product.quantity_available == null || product.quantity_available > 0
  return (
    <div className="bg-background border border-border rounded-[2px] overflow-hidden group hover:border-primary/40 transition-all">
      <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
        <Image
          src={productImage(product)}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button
          onClick={() => onToggleFavorite(product.id)}
          className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-[2px] flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-primary text-primary' : ''}`} />
        </button>
        {product.on_behalf_of_community && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-primary/90 rounded-[2px] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-background" />
            <span className="mono-xs text-[8px] text-background">COMMUNITY</span>
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="mono-xs text-[10px] text-destructive">OUT OF STOCK</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="mono-sm text-xs text-foreground leading-tight">{product.title}</h3>
          {product.seller?.verification_status === 'verified' && (
            <Verified className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <span className="mono-xs text-[9px] text-muted-foreground truncate">
            {product.seller?.display_name ?? 'GreenV1n3'}
          </span>
          {product.location && (
            <>
              <span className="text-border-strong">•</span>
              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="mono-xs text-[9px] text-muted-foreground truncate">{product.location}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <Star className="w-3 h-3 text-accent fill-accent" />
          <span className="mono-xs text-[10px] text-foreground">{Number(product.rating).toFixed(1)}</span>
          <span className="mono-xs text-[9px] text-muted-foreground">({product.reviews_count})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-lg text-primary">N{Number(product.price).toLocaleString()}</span>
            <span className="mono-xs text-[9px] text-muted-foreground">/{product.price_unit ?? 'each'}</span>
          </div>
          <button
            disabled={!inStock}
            className="px-3 py-1.5 bg-primary text-background mono-xs text-[10px] rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            BUY
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductRow({
  product,
  favorited,
  onToggleFavorite,
}: {
  product: MarketplaceProduct
  favorited: boolean
  onToggleFavorite: (id: string) => void
}) {
  const inStock = product.quantity_available == null || product.quantity_available > 0
  return (
    <div className="bg-background border border-border rounded-[2px] p-4 flex gap-4 hover:border-primary/40 transition-all">
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-secondary rounded-[2px] overflow-hidden flex-shrink-0">
        <Image src={productImage(product)} alt={product.title} fill className="object-cover" />
        {!inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="mono-xs text-[8px] text-destructive">OUT</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="mono-sm text-xs text-foreground truncate">{product.title}</h3>
              {product.seller?.verification_status === 'verified' && (
                <Verified className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="mono-xs text-[9px] text-muted-foreground truncate">
                {product.seller?.display_name ?? 'GreenV1n3'}
              </span>
              {product.location && (
                <>
                  <span className="text-border-strong">•</span>
                  <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="mono-xs text-[9px] text-muted-foreground truncate">{product.location}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => onToggleFavorite(product.id)}
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-primary text-primary' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <Star className="w-3 h-3 text-accent fill-accent" />
          <span className="mono-xs text-[10px] text-foreground">{Number(product.rating).toFixed(1)}</span>
          <span className="mono-xs text-[9px] text-muted-foreground">({product.reviews_count} reviews)</span>
        </div>
        <div className="flex items-center justify-between mt-auto pt-3">
          <div>
            <span className="font-mono text-xl text-primary">N{Number(product.price).toLocaleString()}</span>
            <span className="mono-xs text-[10px] text-muted-foreground ml-1">/{product.price_unit ?? 'each'}</span>
          </div>
          <button
            disabled={!inStock}
            className="px-4 py-2 bg-primary text-background mono-xs text-[10px] rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            BUY NOW
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ MY LISTINGS ============

function statusBadge(status: ProductStatus) {
  switch (status) {
    case 'approved':
      return { label: 'LIVE', cls: 'bg-primary/15 text-primary', icon: <CheckCircle2 className="w-3 h-3" /> }
    case 'pending_review':
      return { label: 'IN REVIEW', cls: 'bg-orange/15 text-orange', icon: <Clock className="w-3 h-3" /> }
    case 'rejected':
      return { label: 'REJECTED', cls: 'bg-destructive/15 text-destructive', icon: <XCircle className="w-3 h-3" /> }
    default:
      return { label: 'ARCHIVED', cls: 'bg-muted text-muted-foreground', icon: <Package className="w-3 h-3" /> }
  }
}

function ListingsTab({ products, onCreate }: { products: MarketplaceProduct[]; onCreate: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteProduct(id)
      setDeletingId(null)
    })
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-[2px]">
        <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="mono-sm text-foreground">No listings yet</p>
        <p className="mono-xs text-muted-foreground mt-1 mb-4">Create your first product listing</p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-background mono-xs text-[10px] rounded-[2px] hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          NEW LISTING
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const badge = statusBadge(product.status)
        return (
          <div
            key={product.id}
            className="bg-background border border-border rounded-[2px] p-4 flex gap-4"
          >
            <div className="relative w-20 h-20 bg-secondary rounded-[2px] overflow-hidden flex-shrink-0">
              <Image src={productImage(product)} alt={product.title} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="mono-sm text-xs text-foreground truncate">{product.title}</h3>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] mono-xs text-[8px] ${badge.cls}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>
              <p className="mono-xs text-[9px] text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
              {product.status === 'rejected' && product.rejection_reason && (
                <p className="mono-xs text-[9px] text-destructive mt-1.5">
                  Reason: {product.rejection_reason}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="font-mono text-sm text-primary">
                  N{Number(product.price).toLocaleString()}
                  <span className="mono-xs text-[9px] text-muted-foreground">/{product.price_unit ?? 'each'}</span>
                </span>
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={isPending && deletingId === product.id}
                  className="flex items-center gap-1 px-2 py-1 border border-border rounded-[2px] text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors mono-xs text-[9px] disabled:opacity-50"
                >
                  {isPending && deletingId === product.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  DELETE
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============ REVIEW (GCM / Admin) ============

function ReviewTab({
  products,
  onResolved,
}: {
  products: MarketplaceProduct[]
  onResolved: (id: string) => void
}) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-[2px]">
        <CheckCircle2 className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <p className="mono-sm text-foreground">All caught up</p>
        <p className="mono-xs text-muted-foreground mt-1">No products awaiting review</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ReviewCard key={product.id} product={product} onResolved={onResolved} />
      ))}
    </div>
  )
}

function ReviewCard({
  product,
  onResolved,
}: {
  product: MarketplaceProduct
  onResolved: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const community = COMMUNITIES.find((c) => c.key === product.community)

  function handle(action: 'approve' | 'reject') {
    startTransition(async () => {
      const res = await reviewProduct(product.id, action, action === 'reject' ? reason : undefined)
      if (res.success) onResolved(product.id)
    })
  }

  return (
    <div className="bg-background border border-border rounded-[2px] p-4">
      <div className="flex gap-4">
        <div className="relative w-24 h-24 bg-secondary rounded-[2px] overflow-hidden flex-shrink-0">
          <Image src={productImage(product)} alt={product.title} fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="mono-sm text-xs text-foreground">{product.title}</h3>
            <span className="px-2 py-0.5 bg-orange/15 text-orange rounded-[2px] mono-xs text-[8px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              PENDING
            </span>
          </div>
          <p className="mono-xs text-[9px] text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            <span className="mono-xs text-[9px] text-muted-foreground">
              BY <span className="text-foreground">{product.seller?.display_name ?? 'Unknown'}</span>
            </span>
            {community && (
              <span className="mono-xs text-[9px] text-muted-foreground">{community.label}</span>
            )}
            <span className="font-mono text-sm text-primary">
              N{Number(product.price).toLocaleString()}
              <span className="mono-xs text-[9px] text-muted-foreground">/{product.price_unit ?? 'each'}</span>
            </span>
          </div>
        </div>
      </div>

      {showReject ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (sent to the seller)..."
            rows={2}
            className="w-full bg-secondary/50 border border-border rounded-[2px] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowReject(false)}
              className="px-3 py-1.5 border border-border rounded-[2px] mono-xs text-[9px] text-muted-foreground hover:text-foreground transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={() => handle('reject')}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-background rounded-[2px] mono-xs text-[9px] hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              CONFIRM REJECT
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-border">
          <button
            onClick={() => setShowReject(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-[2px] mono-xs text-[9px] text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-3 h-3" />
            REJECT
          </button>
          <button
            onClick={() => handle('approve')}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-background rounded-[2px] mono-xs text-[9px] hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            APPROVE
          </button>
        </div>
      )}
    </div>
  )
}

// ============ CREATE LISTING MODAL ============

function CreateListingModal({
  role,
  canApprove,
  userCommunity,
  onClose,
}: {
  role: string
  canApprove: boolean
  userCommunity: AgroCommunityKey | null
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'crops',
    price: '',
    price_unit: 'each',
    quantity_available: '',
    location: '',
    community: (userCommunity ?? 'crop_farming') as AgroCommunityKey,
    on_behalf_of_community: false,
    thumbnail: '',
    tags: '',
  })

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/product-image', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      update('thumbnail', json.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit() {
    setError(null)
    if (!form.title.trim() || !form.description.trim() || !form.price) {
      setError('Title, description and price are required')
      return
    }
    startTransition(async () => {
      const res = await createProduct({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price),
        price_unit: form.price_unit,
        quantity_available: form.quantity_available ? Number(form.quantity_available) : undefined,
        location: form.location.trim() || undefined,
        community: form.community,
        on_behalf_of_community: canApprove ? form.on_behalf_of_community : false,
        thumbnail: form.thumbnail || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      })
      if (res.error) {
        setError(res.error)
        return
      }
      onClose()
    })
  }

  const inputCls =
    'w-full bg-secondary/50 border border-border rounded-[2px] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40'
  const labelCls = 'mono-xs text-[9px] text-muted-foreground tracking-wider mb-1.5 block'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border rounded-[3px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-primary" />
            <span className="mono-xs text-[10px] text-primary tracking-wider">NEW LISTING</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!canApprove && (
            <div className="flex items-start gap-2 p-3 bg-orange/10 border border-orange/20 rounded-[2px]">
              <Clock className="w-3.5 h-3.5 text-orange mt-0.5 flex-shrink-0" />
              <p className="mono-xs text-[9px] text-orange leading-relaxed">
                Your listing will be sent to your GCM for approval before it goes live.
              </p>
            </div>
          )}

          {/* Image */}
          <div>
            <span className={labelCls}>PRODUCT IMAGE</span>
            <label className="relative flex items-center justify-center aspect-[4/3] bg-secondary/50 border border-dashed border-border rounded-[2px] overflow-hidden cursor-pointer hover:border-primary/40 transition-colors">
              {form.thumbnail ? (
                <Image src={form.thumbnail} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="text-center">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <span className="mono-xs text-[9px] text-muted-foreground">UPLOAD IMAGE</span>
                    </>
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }}
              />
            </label>
          </div>

          {/* Title */}
          <div>
            <span className={labelCls}>TITLE *</span>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Organic Tomatoes"
            />
          </div>

          {/* Description */}
          <div>
            <span className={labelCls}>DESCRIPTION *</span>
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe your product..."
            />
          </div>

          {/* Category + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls}>CATEGORY</span>
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className={labelCls}>PRICE (N) *</span>
              <input
                type="number"
                className={inputCls}
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Unit + Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls}>UNIT</span>
              <input
                className={inputCls}
                value={form.price_unit}
                onChange={(e) => update('price_unit', e.target.value)}
                placeholder="each, kg, bag..."
              />
            </div>
            <div>
              <span className={labelCls}>QUANTITY</span>
              <input
                type="number"
                className={inputCls}
                value={form.quantity_available}
                onChange={(e) => update('quantity_available', e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <span className={labelCls}>LOCATION</span>
            <input
              className={inputCls}
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. Jos South"
            />
          </div>

          {/* Tags */}
          <div>
            <span className={labelCls}>TAGS (comma separated)</span>
            <input
              className={inputCls}
              value={form.tags}
              onChange={(e) => update('tags', e.target.value)}
              placeholder="organic, fresh, bulk"
            />
          </div>

          {/* GCM-only: community + on behalf */}
          {canApprove && (
            <>
              <div>
                <span className={labelCls}>COMMUNITY</span>
                <select
                  className={inputCls}
                  value={form.community}
                  onChange={(e) => update('community', e.target.value as AgroCommunityKey)}
                >
                  {COMMUNITIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.on_behalf_of_community}
                  onChange={(e) => update('on_behalf_of_community', e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="mono-xs text-[10px] text-foreground">List on behalf of the community</span>
              </label>
            </>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[2px]">
              <p className="mono-xs text-[9px] text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end p-4 border-t border-border sticky bottom-0 bg-card">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-[2px] mono-xs text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || uploading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-[2px] mono-xs text-[10px] hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {canApprove ? 'PUBLISH' : 'SUBMIT FOR REVIEW'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
